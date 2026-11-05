const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, '0');
const GLYPHS = '█▓▒░<>/\\|+=-_0123456789ABCDEF';

/** Decode-style text scramble that resolves left to right. */
export function scramble(el, text, duration = 700) {
  cancelAnimationFrame(el._scr);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const resolved = Math.floor(t * text.length);
    let out = text.slice(0, resolved);
    for (let i = resolved; i < text.length; i++) {
      out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (t < 1) el._scr = requestAnimationFrame(step);
  };
  el._scr = requestAnimationFrame(step);
}

const SERVICES = [
  { id: 'spotify', name: 'SPOTIFY', url: (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}` },
  { id: 'ytmusic', name: 'YOUTUBE MUSIC', url: (q) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}` },
  { id: 'apple', name: 'APPLE MUSIC', url: (q) => `https://music.apple.com/search?term=${encodeURIComponent(q)}` },
];

export class UI {
  constructor(albums, handlers) {
    this.albums = albums;
    this.h = handlers;
    this.index = -1;
    this.el = {
      track: $('track'), rail: $('rail'), title: $('title'), year: $('year'), blurb: $('blurb'),
      producer: $('m-producer'), label: $('m-label'), tracks: $('tracks'), idx: $('idx-cur'),
      code: $('codename'), count: $('count'), log: $('log'), info: $('info'), toggle: $('tracks-toggle'),
      sound: $('sound'), soundLabel: $('sound-label'), meter: $('meter'), clock: $('clock'),
      coords: $('coords'), cursor: $('cursor'),
    };
    this.bars = [...this.el.meter.children];
    try { this.service = localStorage.getItem('rha-service') || 'spotify'; } catch (_) { this.service = 'spotify'; }
    if (!SERVICES.some((x) => x.id === this.service)) this.service = 'spotify';
    this._build();
  }

  _build() {
    const { albums, el } = this;
    // scroll track: one snap point per album
    el.track.innerHTML = albums.map(() => '<i></i>').join('');

    // streaming service chooser
    const svc = $('svc');
    SERVICES.forEach((sv) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.svc = sv.id; b.textContent = sv.name;
      b.addEventListener('click', () => {
        this.service = sv.id;
        try { localStorage.setItem('rha-service', sv.id); } catch (_) {}
        this._links();
      });
      svc.appendChild(b);
    });
    this.svcButtons = [...svc.children];

    // rail
    const fill = document.createElement('div');
    fill.className = 'rail-fill';
    el.rail.appendChild(fill);
    this.railFill = fill;
    albums.forEach((a, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `${a.title} (${a.year})`);
      b.innerHTML = `<span class="t">${a.title}</span><span class="y">${a.year}</span>`;
      b.addEventListener('click', () => this.h.onNavigate(i));
      el.rail.appendChild(b);
    });
    this.railButtons = [...el.rail.querySelectorAll('button')];

    document.querySelectorAll('[data-goto]').forEach((n) =>
      n.addEventListener('click', (e) => { e.preventDefault(); this.h.onNavigate(+n.dataset.goto); }));
    $('prev').addEventListener('click', () => this.h.onNavigate(this.index - 1));
    $('next').addEventListener('click', () => this.h.onNavigate(this.index + 1));
    el.sound.addEventListener('click', () => this.h.onSound());
    el.toggle.addEventListener('click', () => {
      const open = el.info.classList.toggle('open');
      el.toggle.setAttribute('aria-expanded', open);
      el.toggle.querySelector('b').textContent = open ? '–' : '+';
    });

    // pointer cursor + coords
    const hot = 'button, a, li, [data-hot]';
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      document.body.classList.add('has-cursor');
      this._cx = e.clientX; this._cy = e.clientY;
      document.body.classList.toggle('cursor-hot', !!e.target.closest?.(hot));
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
    this._cx = this._cy = -100; this._px = this._py = 0;
  }

  /** Called every frame. */
  frame(dt, { bands, progress, ndc, elapsed, audioOn }) {
    // smooth custom cursor
    this._px += (this._cx - this._px) * Math.min(1, dt * 18);
    this._py += (this._cy - this._py) * Math.min(1, dt * 18);
    this.el.cursor.style.transform = `translate(${this._px}px, ${this._py}px)`;

    // coords + clock
    this.el.coords.textContent = `X ${ndc.x >= 0 ? '+' : ''}${ndc.x.toFixed(2)}  Y ${ndc.y >= 0 ? '+' : ''}${ndc.y.toFixed(2)}`;
    const s = Math.floor(elapsed);
    this.el.clock.textContent = `T+${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;

    // meter
    const n = this.bars.length;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      const v = audioOn
        ? (k < 0.4 ? bands.bass : k < 0.75 ? bands.mid : bands.high) * (0.55 + 0.45 * Math.sin(elapsed * 9 + i * 1.7))
        : 0.12 + 0.08 * Math.sin(elapsed * 2 + i);
      this.bars[i].style.height = `${3 + Math.min(1, Math.max(0, v)) * 11}px`;
    }

    // rail progress fill
    const rr = this.el.rail.getBoundingClientRect();
    if (rr.height > 40 && window.innerWidth >= 900) {
      const first = this.railButtons[0].offsetTop + this.railButtons[0].offsetHeight / 2;
      const last = this.railButtons[this.railButtons.length - 1].offsetTop + this.railButtons[this.railButtons.length - 1].offsetHeight / 2;
      this.railFill.style.top = `${first}px`;
      this.railFill.style.height = `${(last - first) * (progress / (this.albums.length - 1))}px`;
    }
  }

  /** Point every play link at the chosen streaming service. */
  _links() {
    const sv = SERVICES.find((x) => x.id === this.service);
    const a = this.albums[Math.max(0, this.index)];
    this.svcButtons.forEach((b) => b.classList.toggle('on', b.dataset.svc === this.service));
    const album = $('album-play');
    album.href = sv.url(`Radiohead ${a.title.toLowerCase()} album`);
    album.setAttribute('aria-label', `Play ${a.title} on ${sv.name}`);
    this.el.tracks.querySelectorAll('a.play').forEach((l) => {
      l.href = sv.url(`Radiohead ${l.dataset.track}`);
      l.setAttribute('aria-label', `Play ${l.dataset.track} on ${sv.name}`);
    });
  }

  setSound(on, started) {
    this.el.sound.setAttribute('aria-pressed', String(on));
    this.el.soundLabel.textContent = on ? 'SOUND ON' : started ? 'MUTED' : 'SOUND OFF';
  }

  setAlbum(i) {
    if (i === this.index) return;
    const first = this.index === -1;
    this.index = i;
    const a = this.albums[i];
    const { el } = this;

    // accent colours (transitioned in CSS via @property)
    const root = document.documentElement.style;
    root.setProperty('--accent', a.palette[0]);
    root.setProperty('--accent2', a.palette[1]);
    root.setProperty('--accent3', a.palette[2]);

    this.railButtons.forEach((b, k) => b.classList.toggle('active', k === i));
    document.title = `${a.title} (${a.year}) — THE RADIOHEAD ARCHIVE`;

    const render = () => {
      // title split into words → characters for staggered entrance
      let c = 0;
      el.title.innerHTML = a.title.split(' ').map((w) =>
        `<span class="w">${[...w].map((ch) => `<span class="ch" style="--i:${c++}">${ch}</span>`).join('')}</span>`).join(' ');
      el.title.classList.remove('out');
      el.title.setAttribute('aria-label', a.title);

      el.blurb.textContent = a.blurb;
      el.producer.textContent = a.producer;
      el.label.textContent = a.label;
      el.blurb.classList.remove('fade-in'); void el.blurb.offsetWidth; el.blurb.classList.add('fade-in');
      el.info.querySelector('.meta').classList.remove('fade-in'); void el.blurb.offsetWidth; el.info.querySelector('.meta').classList.add('fade-in');

      el.tracks.innerHTML = '';
      a.tracks.forEach((t, k) => {
        const li = document.createElement('li');
        li.tabIndex = 0;
        li.style.setProperty('--i', k);
        const name = document.createElement('span');
        name.className = 'tn'; name.textContent = t;
        const play = document.createElement('a');
        play.className = 'play'; play.textContent = '\u25B6'; play.dataset.track = t;
        play.target = '_blank'; play.rel = 'noopener noreferrer';
        play.addEventListener('click', (e) => e.stopPropagation());
        li.append(name, play);
        const fire = () => {
          li.classList.add('hit'); setTimeout(() => li.classList.remove('hit'), 350);
          this.h.onTrack(i, k);
        };
        li.addEventListener('click', fire);
        li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
        el.tracks.appendChild(li);
      });

      scramble(el.idx, pad2(i + 1), 500);
      scramble(el.year, String(a.year), 650);
      scramble(el.code, a.codename, 900);
      el.count.textContent = `${a.tracks.length} TRACKS`;
      this._links();
      this._typeLog(a.log);
    };

    if (first) { render(); return; }
    el.title.classList.add('out');
    clearTimeout(this._swap);
    this._swap = setTimeout(render, 240);
  }

  _typeLog(lines) {
    const log = this.el.log;
    clearTimeout(this._logT);
    log.innerHTML = '';
    let li = 0, ci = 0, row = null;
    const tick = () => {
      if (li >= lines.length) { return; }
      if (!row) { row = document.createElement('div'); row.className = 'caret'; log.appendChild(row); }
      row.textContent = lines[li].slice(0, ++ci);
      if (ci >= lines[li].length) { row.classList.remove('caret'); row = null; li++; ci = 0; this._logT = setTimeout(tick, 220); }
      else this._logT = setTimeout(tick, 16);
    };
    this._logT = setTimeout(tick, 400);
  }
}
