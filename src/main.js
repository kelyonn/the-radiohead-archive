import '../style.css';
import { ALBUMS } from './data.js';
import { SHAPES } from './shapes.js';
import { Stage } from './stage.js';
import { AudioEngine } from './audio.js';
import { UI } from './ui.js';
import { Sheets, Player } from './sheets.js';

const N = ALBUMS.length;
const mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const slug = (a) => a.id.replace(/_/g, '-');
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const gateStatus = document.getElementById('gate-status');
const gateBar = document.getElementById('gate-bar');
const setLoad = (p, text) => { gateBar.style.width = `${p}%`; if (text) gateStatus.textContent = text; };

const audio = new AudioEngine();
let stage = null;
let ui = null;
let started = false;
let enteredAt = 0;
let activeIndex = 0;
let audioTimer = 0;
let sheets = null;
let player = null;

// ---- scroll <-> album mapping ---------------------------------------------
const perAlbum = () => Math.max(1, (document.documentElement.scrollHeight - innerHeight) / (N - 1));
const scrollProgress = () => Math.min(N - 1, Math.max(0, scrollY / perAlbum()));
function goTo(i, instant = false) {
  i = Math.min(N - 1, Math.max(0, i));
  scrollTo({ top: i * perAlbum(), behavior: instant || reduced ? 'auto' : 'smooth' });
}

function onAlbumChange(i) {
  activeIndex = i;
  ui.setAlbum(i);
  try { history.replaceState(null, '', `#${slug(ALBUMS[i])}`); } catch (_) {}
  player?.setAlbum(i);
  clearTimeout(audioTimer);
  audioTimer = setTimeout(() => audio.setAlbum(i), 380); // wait for scrolling to settle
}

// ---- boot -----------------------------------------------------------------
async function boot() {
  ui = new UI(ALBUMS, {
    onNavigate: (i) => goTo(i),
    onTrack: (ai, ti) => { audio.pluck(ai, ti); stage?.ping(0.9); },
    onSound: toggleSound,
    onListen: () => player.open(),
  });
  sheets = new Sheets({
    onAlbum: (i) => goTo(i),
    onOpen: () => { stage?.ping(0.5); },
    onClose: () => {},
  });
  player = new Player({
    onOpen: () => { if (audio.ready && !audio.muted) { audio.setMuted(true); ui.setSound(false, true); } },
  });
  player.setAlbum(hashIndex());
  const menuBtn = document.getElementById('menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = document.getElementById('menu').classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  ui.setAlbum(hashIndex());
  ui.setSound(false, false);

  setLoad(4, 'CREATING WEBGL CONTEXT');
  const count = mobile ? 42000 : innerWidth > 1800 ? 120000 : 90000;
  try {
    stage = new Stage(document.getElementById('stage'), { count, mobile, albums: ALBUMS });
  } catch (err) {
    console.error('WebGL unavailable:', err);
    document.body.classList.add('no-webgl');
    setLoad(100, 'WEBGL UNAVAILABLE — RUNNING IN LITE MODE');
  }

  if (stage) {
    const shapes = [];
    for (let i = 0; i < N; i++) {
      setLoad(8 + (i / N) * 86, `SCULPTING ${ALBUMS[i].title}`);
      await nextFrame();
      shapes.push(SHAPES[ALBUMS[i].shape](count));
    }
    stage.setShapes(shapes);
    if (reduced) stage.reduced = true;
    setLoad(100, 'ARCHIVE READY');
  }

  document.getElementById('gate-actions').hidden = false;
  document.getElementById('enter-sound').addEventListener('click', () => enter(true));
  document.getElementById('enter-silent').addEventListener('click', () => enter(false));
  document.getElementById('enter-sound').focus({ preventScroll: true });

  bindInput();
  requestAnimationFrame(loop);
}

function hashIndex() {
  const h = location.hash.replace('#', '');
  const i = ALBUMS.findIndex((a) => slug(a) === h);
  return i >= 0 ? i : 0;
}

async function enter(withSound) {
  if (started) return;
  started = true;
  enteredAt = performance.now();
  document.body.classList.remove('booting');
  document.getElementById('gate').classList.add('gone');
  goTo(hashIndex(), true);
  stage?.setProgress(scrollProgress());
  if (stage) { stage.progress = stage.targetProgress; }
  if (withSound) {
    audio.pendingAlbum = activeIndex;
    const ok = await audio.start();
    ui.setSound(ok, ok);
  }
}

async function toggleSound() {
  if (!audio.ready) {
    const ok = await audio.start();
    audio.muted = false;
    ui.setSound(ok, ok);
    return;
  }
  audio.setMuted(!audio.muted);
  ui.setSound(!audio.muted, true);
}

// ---- input ----------------------------------------------------------------
const ndc = { x: 0, y: 0 };
function bindInput() {
  addEventListener('scroll', () => {
    if (!started) return;
    document.body.classList.toggle('scrolled', scrollY > 30);
    const p = scrollProgress();
    stage?.setProgress(p);
    const i = Math.round(p);
    if (i !== activeIndex) onAlbumChange(i);
  }, { passive: true });

  addEventListener('pointermove', (e) => {
    ndc.x = (e.clientX / innerWidth) * 2 - 1;
    ndc.y = -((e.clientY / innerHeight) * 2 - 1);
    stage?.setPointer(ndc.x, ndc.y, true);
  }, { passive: true });
  document.addEventListener('pointerleave', () => stage?.setPointer(ndc.x, ndc.y, false));
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, li')) return;
    stage?.ping(0.7);
  });

  addEventListener('keydown', (e) => {
    if (!started || e.metaKey || e.ctrlKey || e.altKey) return;
    if (sheets?.isOpen) { if (e.key === 'Escape') sheets.close(); return; }
    const k = e.key;
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(k) || (k === ' ' && !e.shiftKey && !e.target.closest('button, li'))) { e.preventDefault(); goTo(activeIndex + 1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(k) || (k === ' ' && e.shiftKey)) { e.preventDefault(); goTo(activeIndex - 1); }
    else if (k === 'Home') { e.preventDefault(); goTo(0); }
    else if (k === 'End') { e.preventDefault(); goTo(N - 1); }
    else if (/^[1-9]$/.test(k)) goTo(+k - 1);
    else if (k.toLowerCase() === 'm') toggleSound();
  });

  addEventListener('resize', () => { stage?.resize(); });
  document.addEventListener('visibilitychange', () => {
    if (!audio.ready) return;
    if (document.hidden) audio.ctx.suspend(); else if (!audio.muted) audio.ctx.resume();
  });
}

// ---- main loop + adaptive quality ------------------------------------------
let last = performance.now();
let acc = 0, frames = 0, slow = 0, fast = 0, quality = 1;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const bands = audio.bands();
  if (stage) {
    stage.setAudio(bands.bass, bands.mid, bands.high);
    stage.update(dt);
  }
  ui.frame(dt, {
    bands, ndc, progress: stage ? stage.progress : scrollProgress(),
    elapsed: started ? (now - enteredAt) / 1000 : 0, audioOn: audio.ready && !audio.muted,
  });

  // adapt resolution + particle count to keep ~60fps
  acc += dt; frames++;
  if (acc >= 1.5 && stage) {
    const fps = frames / acc;
    acc = 0; frames = 0;
    if (fps < 42) { slow++; fast = 0; } else if (fps > 57) { fast++; slow = 0; } else { slow = fast = 0; }
    if (slow >= 2 && quality > 0.4) { quality = Math.max(0.4, quality - 0.15); stage.setQuality(quality); slow = 0; }
    if (fast >= 4 && quality < 1) { quality = Math.min(1, quality + 0.1); stage.setQuality(quality); fast = 0; }
  }
  requestAnimationFrame(loop);
}

window.__stage = () => stage;
boot();
