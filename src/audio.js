// Generative, copyright-free audio: one procedural "atmosphere" per album.
// Everything is synthesised with the Web Audio API — no samples, no recordings.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function makeKit(ctx, bus, reverb, noiseBuf) {
  const nodes = [];
  const track = (n) => { nodes.push(n); return n; };

  const sendTo = (src, send) => {
    if (!send) return;
    const s = ctx.createGain();
    s.gain.value = send;
    src.connect(s); s.connect(reverb);
  };

  const kit = {
    ctx, bus, track,
    midi: mtof,
    tone({ f, t, d = 0.5, type = 'sine', vol = 0.1, a = 0.005, r = 0.25, lp = 0, q = 0.7, detune = 0, send = 0.3, glideTo = 0 }) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + d);
      o.detune.value = detune;
      let n = o;
      if (lp) {
        const F = ctx.createBiquadFilter();
        F.type = 'lowpass'; F.frequency.value = lp; F.Q.value = q;
        o.connect(F); n = F;
      }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + a);
      g.gain.setTargetAtTime(0.0001, t + Math.max(d, a), r / 3);
      n.connect(g); g.connect(bus);
      sendTo(g, send);
      o.start(t); o.stop(t + d + r * 1.3 + 0.05);
    },
    fm({ f, t, d = 1, ratio = 1, index = 2, vol = 0.1, r = 0.6, send = 0.4 }) {
      const c = ctx.createOscillator(), m = ctx.createOscillator();
      const mg = ctx.createGain(), g = ctx.createGain();
      c.frequency.value = f; m.frequency.value = f * ratio;
      mg.gain.setValueAtTime(f * index, t);
      mg.gain.setTargetAtTime(f * index * 0.05, t, d / 3);
      m.connect(mg); mg.connect(c.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.setTargetAtTime(0.0001, t + 0.02, d / 3);
      c.connect(g); g.connect(bus); sendTo(g, send);
      c.start(t); m.start(t); c.stop(t + d + r); m.stop(t + d + r);
    },
    noise({ t, d = 0.1, vol = 0.05, type = 'bandpass', f = 1000, fTo = 0, q = 1, a = 0.002, send = 0.2 }) {
      const s = ctx.createBufferSource();
      s.buffer = noiseBuf; s.loop = true;
      const F = ctx.createBiquadFilter();
      F.type = type; F.Q.value = q; F.frequency.setValueAtTime(f, t);
      if (fTo) F.frequency.exponentialRampToValueAtTime(fTo, t + d);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + a);
      g.gain.setTargetAtTime(0.0001, t + a + d * 0.5, d / 4);
      s.connect(F); F.connect(g); g.connect(bus); sendTo(g, send);
      s.start(t, Math.random() * 1.5); s.stop(t + d * 2 + 0.1);
    },
    kick(t, vol = 0.5, f0 = 130, f1 = 38) {
      kit.tone({ f: f0, glideTo: f1, t, d: 0.18, vol, a: 0.002, r: 0.12, send: 0 });
    },
    // looping drone / bed nodes that must be cleaned up with the patch
    drone({ f, type = 'sawtooth', vol = 0.03, lp = 400, lfo = 0, lfoDepth = 0, detune = 0 }) {
      const o = track(ctx.createOscillator());
      o.type = type; o.frequency.value = f; o.detune.value = detune;
      const F = track(ctx.createBiquadFilter());
      F.type = 'lowpass'; F.frequency.value = lp; F.Q.value = 0.6;
      const g = track(ctx.createGain()); g.gain.value = vol;
      o.connect(F); F.connect(g); g.connect(bus); sendTo(g, 0.35);
      if (lfo) {
        const l = track(ctx.createOscillator()); l.frequency.value = lfo;
        const lg = track(ctx.createGain()); lg.gain.value = lfoDepth;
        l.connect(lg); lg.connect(F.frequency); l.start();
      }
      o.start();
      return { o, F, g };
    },
    bed({ f = 800, q = 0.6, vol = 0.03, type = 'bandpass', lfo = 0.05, lfoDepth = 300 }) {
      const s = track(ctx.createBufferSource());
      s.buffer = noiseBuf; s.loop = true;
      const F = track(ctx.createBiquadFilter()); F.type = type; F.frequency.value = f; F.Q.value = q;
      const g = track(ctx.createGain()); g.gain.value = vol;
      s.connect(F); F.connect(g); g.connect(bus); sendTo(g, 0.4);
      if (lfo) {
        const l = track(ctx.createOscillator()); l.frequency.value = lfo;
        const lg = track(ctx.createGain()); lg.gain.value = lfoDepth;
        l.connect(lg); lg.connect(F.frequency); l.start();
      }
      s.start();
    },
    pad(notes, t, d, { type = 'sawtooth', vol = 0.018, lp = 900, a = 1.2, r = 1.8, spread = 7, send = 0.5 } = {}) {
      notes.forEach((m) => {
        [-spread, spread].forEach((dt) => kit.tone({ f: mtof(m), t, d, type, vol, a, r, lp, detune: dt, send }));
      });
    },
    dispose() {
      nodes.forEach((n) => { try { n.stop?.(); } catch (_) {} try { n.disconnect(); } catch (_) {} });
      nodes.length = 0;
    },
  };
  return kit;
}

// ---------------------------------------------------------------------------
// Patches. step(n, t) is called once per 16th note.
// ---------------------------------------------------------------------------
const PATCHES = [
  // 01 PABLO HONEY — overdriven chords, hiss, pick scrapes
  (k) => {
    const chords = [[55, 59, 62], [59, 63, 66], [60, 64, 67], [60, 63, 67]];
    return {
      bpm: 76, scale: [55, 59, 60, 62, 64, 67],
      start() { k.bed({ f: 3500, q: 0.4, vol: 0.006, type: 'highpass', lfo: 0 }); },
      step(n, t) {
        if (n % 16 === 0) {
          const c = chords[(n / 16) % 4];
          k.pad(c, t, 2.7, { type: 'sawtooth', vol: 0.02, lp: 1100, a: 0.05, r: 0.8, spread: 12, send: 0.25 });
          k.tone({ f: k.midi(c[0] - 24), t, d: 2.4, type: 'triangle', vol: 0.12, a: 0.01, r: 0.5, send: 0.1 });
        }
        if (n % 16 === 4 || n % 16 === 12) k.noise({ t, d: 0.08, vol: 0.035, f: 2200, q: 0.8 });
        if (n % 8 === 6) k.tone({ f: k.midi(pick([67, 71, 72, 74])), t, d: 0.5, type: 'triangle', vol: 0.05, r: 0.5, send: 0.5 });
      },
    };
  },
  // 02 THE BENDS — heartbeat, reversed swells, glassy bells
  (k) => {
    const chords = [[57, 61, 64, 71], [52, 56, 59, 66], [54, 58, 61, 68], [56, 59, 63, 66]];
    return {
      bpm: 62, scale: [57, 61, 64, 66, 68, 71],
      start() {},
      step(n, t) {
        if (n % 32 === 0) k.pad(chords[(n / 32) % 4], t, 7.5, { type: 'triangle', vol: 0.03, lp: 1400, a: 2.2, r: 2.4 });
        if (n % 8 === 0) k.kick(t, 0.5, 90, 36);
        if (n % 8 === 3) k.kick(t, 0.32, 80, 34);
        if (n % 32 === 24) k.noise({ t, d: 1.6, vol: 0.05, f: 300, fTo: 5000, q: 1.5, a: 1.5, send: 0.6 });
        if (n % 4 === 2 && Math.random() < 0.45) k.fm({ f: k.midi(pick([69, 73, 76, 78, 80, 85])), t, d: 1.5, ratio: 3.5, index: 0.8, vol: 0.035 });
      },
    };
  },
  // 03 OK COMPUTER — modem hiss, robotic pentatonic blips, low drone
  (k) => {
    const sc = [57, 60, 62, 64, 67, 69, 72, 76];
    return {
      bpm: 104, scale: sc,
      start() {
        k.drone({ f: 55, type: 'sawtooth', vol: 0.045, lp: 220, lfo: 0.12, lfoDepth: 90 });
        k.drone({ f: 55.4, type: 'square', vol: 0.015, lp: 180 });
        k.bed({ f: 6000, q: 0.5, vol: 0.006, type: 'highpass', lfo: 0 });
      },
      step(n, t) {
        if (Math.random() < 0.55) k.tone({ f: k.midi(pick(sc) + 12), t, d: 0.05, type: 'square', vol: 0.026, a: 0.002, r: 0.04, lp: 3200, send: 0.18 });
        if (n % 16 === 0) k.tone({ f: k.midi(pick([45, 48, 40])), t, d: 1.2, type: 'sawtooth', vol: 0.04, lp: 400, a: 0.02, r: 0.8, send: 0.2 });
        if (n % 32 === 20 || (n % 8 === 5 && Math.random() < 0.3)) k.noise({ t, d: 0.35, vol: 0.02, f: pick([1200, 1800, 2600]), fTo: pick([900, 3400]), q: 7, send: 0.1 });
        if (n % 4 === 0) k.noise({ t, d: 0.03, vol: 0.02, type: 'highpass', f: 7000, send: 0 });
      },
    };
  },
  // 04 KID A — FM electric piano, sub bass, glacial wind
  (k) => {
    const chords = [[57, 64, 67, 71, 74], [53, 60, 64, 67, 71], [55, 62, 65, 69, 72], [52, 59, 62, 67, 71]];
    return {
      bpm: 72, scale: [57, 60, 62, 64, 67, 71, 74],
      start() {
        k.drone({ f: 41.2, type: 'sine', vol: 0.12, lp: 160, lfo: 0.07, lfoDepth: 20 });
        k.bed({ f: 900, q: 0.8, vol: 0.05, lfo: 0.05, lfoDepth: 600 });
      },
      step(n, t) {
        if (n % 16 === 0) chords[(n / 16) % 4].forEach((m, i) => k.fm({ f: k.midi(m), t: t + i * 0.05, d: 3.5, ratio: 1, index: 1.4, vol: 0.04, send: 0.55 }));
        if (n % 16 === 8) k.fm({ f: k.midi(pick([81, 84, 86, 88])), t, d: 2, ratio: 4, index: 0.5, vol: 0.02, send: 0.8 });
        if (n % 64 === 40) k.noise({ t, d: 2.5, vol: 0.03, f: 400, fTo: 2400, q: 3, a: 1.2, send: 0.7 });
      },
    };
  },
  // 05 AMNESIAC — uneven piano accents (3-3-4-3-3), music box, sub drone
  (k) => {
    const accents = new Set([0, 3, 6, 10, 13]);
    const chords = [[49, 56, 61, 64], [52, 59, 64, 67], [47, 54, 59, 62], [48, 55, 60, 64]];
    return {
      bpm: 68, scale: [49, 52, 56, 59, 61, 64],
      start() { k.drone({ f: 36.7, type: 'sine', vol: 0.1, lp: 120, lfo: 0.04, lfoDepth: 15 }); },
      step(n, t) {
        const s = n % 16, bar = Math.floor(n / 16);
        if (accents.has(s)) {
          const c = chords[bar % 4];
          const notes = s === 0 ? c : [c[s % c.length], c[(s + 2) % c.length] + 12];
          notes.forEach((m) => {
            k.tone({ f: k.midi(m), t, d: 0.5, type: 'triangle', vol: 0.045, a: 0.004, r: 1.2, lp: 2200, send: 0.45 });
            k.tone({ f: k.midi(m) * 2, t, d: 0.2, type: 'sine', vol: 0.012, a: 0.003, r: 0.6, send: 0.5 });
          });
        }
        if (s === 5 && Math.random() < 0.6) k.fm({ f: k.midi(pick([85, 88, 92, 93])), t, d: 1.2, ratio: 5.01, index: 0.35, vol: 0.02, send: 0.6 });
        if (n % 32 === 16) k.noise({ t, d: 1.2, vol: 0.012, f: 3000, q: 1, send: 0.7 });
      },
    };
  },
  // 06 HAIL TO THE THIEF — driving filtered saw bass, hats, glitch bursts
  (k) => {
    const bass = [40, 40, 43, 40, 45, 40, 43, 47];
    return {
      bpm: 112, scale: [52, 55, 57, 59, 64, 67],
      start() { k.bed({ f: 2400, q: 0.5, vol: 0.008, type: 'highpass', lfo: 0 }); },
      step(n, t) {
        if (n % 2 === 0) k.tone({ f: k.midi(bass[(n / 2) % 8]), t, d: 0.2, type: 'sawtooth', vol: 0.08, a: 0.004, r: 0.08, lp: 380 + 500 * Math.abs(Math.sin(n * 0.07)), q: 4, send: 0.08 });
        if (n % 8 === 0) k.kick(t, 0.5);
        if (n % 16 === 4 || n % 16 === 12) k.noise({ t, d: 0.18, vol: 0.06, f: 1800, q: 0.6, send: 0.25 });
        if (n % 2 === 1) k.noise({ t, d: 0.03, vol: 0.022, type: 'highpass', f: 8000, send: 0 });
        if (Math.random() < 0.07) k.noise({ t, d: 0.09, vol: 0.05, f: 500 + Math.random() * 6000, q: 12, send: 0.1 });
        if (n % 32 === 0) k.pad([52, 59, 64], t, 3.5, { type: 'square', vol: 0.01, lp: 1200, a: 0.4, r: 1.5 });
      },
    };
  },
  // 07 IN RAINBOWS — warm arpeggios in triplet groups, soft pad, vinyl dust
  (k) => {
    const arp = [62, 66, 69, 74, 69, 66, 64, 67, 71, 76, 71, 67];
    const chords = [[50, 57, 62, 66], [55, 62, 66, 71], [47, 54, 59, 62], [52, 59, 64, 67]];
    return {
      bpm: 92, scale: [62, 64, 66, 69, 71, 74],
      start() { k.bed({ f: 4500, q: 0.3, vol: 0.005, type: 'highpass', lfo: 0 }); },
      step(n, t) {
        k.tone({ f: k.midiarp[n % 12], t, d: 0.22, type: 'triangle', vol: 0.05, a: 0.004, r: 0.5, lp: 3500, send: 0.4 });
        if (n % 12 === 0) k.tone({ f: k.midi(chords[Math.floor(n / 48) % 4][0] - 12), t, d: 1.4, type: 'sine', vol: 0.09, a: 0.02, r: 0.6, send: 0.15 });
        if (n % 48 === 0) k.pad(chords[(n / 48) % 4], t, 7, { type: 'sawtooth', vol: 0.011, lp: 700, a: 1.8, r: 2 });
        if (n % 6 === 0 && n % 12 !== 0) k.noise({ t, d: 0.05, vol: 0.02, type: 'highpass', f: 6500, send: 0.1 });
        if (n % 12 === 6) k.kick(t, 0.28, 100, 42);
        if (Math.random() < 0.08) k.noise({ t, d: 0.015, vol: 0.02, type: 'highpass', f: 3000, send: 0 });
      },
    };
  },
  // 08 THE KING OF LIMBS — polyrhythm clicks (7 / 5 / 12), woody thumps, birds
  (k) => {
    return {
      bpm: 118, scale: [53, 56, 58, 60, 63, 65],
      start() { k.drone({ f: 43.65, type: 'sine', vol: 0.09, lp: 140, lfo: 0.09, lfoDepth: 20 }); k.bed({ f: 3200, q: 0.5, vol: 0.006, lfo: 0.03, lfoDepth: 800 }); },
      step(n, t) {
        if (n % 7 === 0) k.tone({ f: 900, glideTo: 220, t, d: 0.07, type: 'sine', vol: 0.09, a: 0.001, r: 0.05, send: 0.2 });
        if (n % 5 === 0) k.noise({ t, d: 0.03, vol: 0.04, f: 5200, q: 4, send: 0.15 });
        if (n % 12 === 0) k.kick(t, 0.45, 110, 40);
        if (n % 3 === 0 && Math.random() < 0.5) k.tone({ f: k.midi(pick([65, 68, 70, 72, 75])), t, d: 0.1, type: 'triangle', vol: 0.03, a: 0.003, r: 0.35, lp: 3000, send: 0.45 });
        if (n % 84 === 0) k.pad([53, 60, 63, 68], t, 10, { type: 'sawtooth', vol: 0.012, lp: 800, a: 3, r: 3 });
        if (Math.random() < 0.035) k.tone({ f: 2600 + Math.random() * 1400, glideTo: 4200 + Math.random() * 800, t, d: 0.09, type: 'sine', vol: 0.02, a: 0.01, r: 0.05, send: 0.5 });
      },
    };
  },
  // 09 A MOON SHAPED POOL — string swells and rising harp
  (k) => {
    const chords = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [50, 57, 62, 65, 69], [40, 47, 52, 56, 59]];
    const harp = [69, 72, 76, 81, 76, 72, 71, 74, 79, 83, 79, 74];
    return {
      bpm: 58, scale: [57, 60, 64, 67, 69, 72],
      start() { k.bed({ f: 500, q: 0.5, vol: 0.015, lfo: 0.03, lfoDepth: 220 }); },
      step(n, t) {
        if (n % 32 === 0) k.pad(chords[(n / 32) % 4], t, 7.5, { type: 'sawtooth', vol: 0.014, lp: 1300, a: 2.6, r: 3.2, spread: 9, send: 0.7 });
        if (n % 4 === 0) k.tone({ f: k.midi(harp[(n / 4) % 12]), t, d: 0.3, type: 'sine', vol: 0.055, a: 0.003, r: 1.6, send: 0.6 });
        if (n % 32 === 0) k.tone({ f: k.midi(chords[(n / 32) % 4][0] - 12), t, d: 5, type: 'sine', vol: 0.1, a: 0.03, r: 1.5, send: 0.3 });
      },
    };
  },
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.current = null;
    this.pendingAlbum = 0;
    this.freq = null;
    this.level = { bass: 0, mid: 0, high: 0 };
  }

  async start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const ctx = (this.ctx = new AC());
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.78;
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
      this.master.connect(comp); comp.connect(this.analyser); comp.connect(ctx.destination);

      // generated reverb impulse response
      const len = ctx.sampleRate * 3.4;
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          const env = Math.pow(1 - i / len, 3.2);
          lp += ((Math.random() * 2 - 1) - lp) * (0.25 + 0.75 * (1 - i / len));
          d[i] = lp * env;
        }
      }
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = 0.9;
      this.reverb.connect(wet); wet.connect(this.master);

      const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      this.noiseBuf = nb;

      // UI sound kit (track clicks etc.), connected straight to master
      this.fxBus = ctx.createGain(); this.fxBus.gain.value = 1; this.fxBus.connect(this.master);
      this.fx = makeKit(ctx, this.fxBus, this.reverb, nb);
    }
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch (_) { return false; }
    }
    this.ready = this.ctx.state === 'running';
    if (this.ready) {
      this._setMaster(this.muted ? 0 : 0.9, 1.2);
      this.setAlbum(this.pendingAlbum, true);
    }
    return this.ready;
  }

  _setMaster(v, secs = 0.3) {
    const g = this.master.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(v, t + secs);
  }

  setMuted(m) {
    this.muted = m;
    if (this.ready) this._setMaster(m ? 0 : 0.9, 0.35);
  }

  setAlbum(i, force = false) {
    this.pendingAlbum = i;
    if (!this.ready) return;
    if (this.current && this.current.index === i && !force) return;
    const ctx = this.ctx;
    const old = this.current;
    if (old) this._retire(old);

    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(this.master);
    const kit = makeKit(ctx, bus, this.reverb, this.noiseBuf);
    const patch = PATCHES[i](kit);
    bus.gain.setValueAtTime(0, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.0);
    patch.start();
    this.current = { index: i, patch, kit, bus, step: 0, next: ctx.currentTime + 0.12 };
    if (!this.timer) this.timer = setInterval(() => this._tick(), 25);
  }

  _retire(c) {
    const ctx = this.ctx;
    c.retired = true;
    c.bus.gain.cancelScheduledValues(ctx.currentTime);
    c.bus.gain.setValueAtTime(c.bus.gain.value, ctx.currentTime);
    c.bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4);
    setTimeout(() => { c.kit.dispose(); try { c.bus.disconnect(); } catch (_) {} }, 1800);
  }

  _tick() {
    const c = this.current;
    if (!c || !this.ctx) return;
    const stepDur = 60 / c.patch.bpm / 4;
    while (c.next < this.ctx.currentTime + 0.14) {
      try { c.patch.step(c.step, c.next); } catch (e) { console.warn(e); }
      c.next += stepDur;
      c.step++;
    }
  }

  /** A little chime in the current album's scale — used when tracks are clicked. */
  pluck(i, trackIndex) {
    if (!this.ready || this.muted) return;
    const scale = this.current?.patch.scale || [57, 60, 64, 67];
    const m = scale[trackIndex % scale.length] + 12 * (1 + Math.floor(trackIndex / scale.length) % 2);
    const t = this.ctx.currentTime + 0.01;
    this.fx.fm({ f: this.fx.midi(m), t, d: 1.6, ratio: 2.01, index: 1.1, vol: 0.09, send: 0.7 });
    this.fx.tone({ f: this.fx.midi(m - 12), t, d: 0.5, type: 'sine', vol: 0.05, r: 0.6, send: 0.4 });
  }

  bands() {
    if (!this.ready || !this.analyser) return this.level;
    this.analyser.getByteFrequencyData(this.freq);
    const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += this.freq[i]; return s / ((b - a) * 255); };
    this.level.bass = Math.min(1, avg(0, 4) * 1.7);
    this.level.mid = Math.min(1, avg(4, 24) * 2.4);
    this.level.high = Math.min(1, avg(24, 100) * 4);
    return this.level;
  }
}
