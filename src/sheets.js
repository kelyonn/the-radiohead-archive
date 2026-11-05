import { ALBUMS } from './data.js';
import { TIMELINE, BAND, COLLABORATORS, STORIES, PHOTOS } from './content.js';

const plateFiles = import.meta.glob('./assets/plates/*.jpg', { eager: true, query: '?url', import: 'default' });
const VIEW_ORDER = { '': 0, b: 1, c: 2 };
const VIEW_NAME = { '': 'FRONT', b: 'ORBIT', c: 'CLOSE-UP' };
const PLATES = Object.keys(plateFiles).map((k) => {
  const m = k.match(/(\d+)(?:_([a-z]))?\.jpg$/);
  return { src: plateFiles[k], album: +m[1] - 1, view: m[2] || '' };
}).sort((a, b) => a.album - b.album || VIEW_ORDER[a.view] - VIEW_ORDER[b.view]);
const plateFor = (album, view) => (PLATES.find((p) => p.album === album && p.view === view) || PLATES.find((p) => p.album === album))?.src;

const photoFiles = import.meta.glob('./assets/photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
const LOCAL_PHOTOS = Object.keys(photoFiles).sort().map((k) => ({
  src: photoFiles[k],
  caption: k.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
}));

const STORY_ALBUM = [0, 0, 2, 2, 3, 4, 6, 8, 2];
const MEMBER_ALBUM = [0, 3, 2, 6, 8];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = (n) => n.replace(/[^A-Za-z ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2);
const accent = (i) => ALBUMS[Math.min(ALBUMS.length - 1, Math.max(0, i))].palette[0];

const VIEWS = {
  timeline: {
    title: 'TIMELINE', sub: '1985 → TODAY',
    render: () => `
      <ol class="tl">
        ${TIMELINE.map((e, i) => `
          <li class="tl-item" style="--c:${accent(e.album)};--i:${i}">
            <div class="tl-year">${e.year}</div>
            <div class="tl-body">
              <h3>${esc(e.title)}</h3>
              <p>${esc(e.text)}</p>
              ${plateFor(e.album, ['', 'b', 'c'][i % 3]) ? `<img class="tl-thumb" src="${plateFor(e.album, ['', 'b', 'c'][i % 3])}" alt="" loading="lazy">` : ''}
              <button type="button" class="chip" data-album="${e.album}">VIEW ${esc(ALBUMS[e.album].title)} &rarr;</button>
            </div>
          </li>`).join('')}
      </ol>`,
  },
  band: {
    title: 'THE BAND', sub: 'FIVE MEMBERS · TWO COLLABORATORS',
    render: () => `
      <div class="grid members">
        ${BAND.map((m, i) => `
          <article class="member" style="--c:${accent(MEMBER_ALBUM[i])};--i:${i};--img:url('${plateFor(MEMBER_ALBUM[i], 'c') || ''}')">
            <div class="mono" aria-hidden="true">${initials(m.name)}</div>
            <h3>${esc(m.name)}</h3>
            <div class="role">${esc(m.role)} · b. ${m.born}</div>
            <p>${esc(m.text)}</p>
          </article>`).join('')}
      </div>
      <h2 class="sub-h">COLLABORATORS</h2>
      <div class="grid collabs">
        ${COLLABORATORS.map((m, i) => `
          <article class="member small" style="--c:${accent(2 + i * 3)};--i:${i}">
            <h3>${esc(m.name)}</h3><div class="role">${esc(m.role)}</div><p>${esc(m.text)}</p>
          </article>`).join('')}
      </div>`,
  },
  stories: {
    title: 'STORIES', sub: 'NINE SHORT READS',
    render: () => `
      <div class="stories">
        ${STORIES.map((s, i) => `
          <article class="story" style="--c:${accent(STORY_ALBUM[i])};--i:${i}">
            ${plateFor(STORY_ALBUM[i], 'c') ? `<img class="story-img" src="${plateFor(STORY_ALBUM[i], 'c')}" alt="" loading="lazy">` : ''}
            <div class="tag">${esc(s.tag)}</div>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.text)}</p>
          </article>`).join('')}
      </div>`,
  },
  gallery: {
    title: 'GALLERY', sub: 'PLATES · PHOTOGRAPHS',
    render: () => `
      <h2 class="sub-h">PARTICLE PLATES <small>${PLATES.length} original generative artworks \u00B7 click to enlarge</small></h2>
      <div class="plates">
        ${PLATES.map((p, i) => `
          <figure class="plate" style="--c:${accent(p.album)};--i:${Math.min(i, 14)}">
            <button type="button" class="plate-btn" data-plate="${i}" aria-label="Enlarge ${esc(ALBUMS[p.album].title)} plate, ${VIEW_NAME[p.view].toLowerCase()}"><img src="${p.src}" alt="Generative particle plate for ${esc(ALBUMS[p.album].title)}, ${VIEW_NAME[p.view].toLowerCase()} view" loading="lazy"></button>
            <figcaption><b>${String(p.album + 1).padStart(2, '0')}</b> ${esc(ALBUMS[p.album].title)} <span>${VIEW_NAME[p.view]}</span></figcaption>
          </figure>`).join('') || '<p class="empty">Plates are generated when the site is built.</p>'}
      </div>
      <h2 class="sub-h">PHOTOGRAPHS <small>your own photos, plus free-licence images from Wikimedia Commons</small></h2>
      <div class="photos">
        ${LOCAL_PHOTOS.map((p, i) => `
          <figure class="photo" style="--i:${i}">
            <div class="photo-frame"><img src="${p.src}" alt="${esc(p.caption)}" loading="lazy"></div>
            <figcaption>${esc(p.caption)}<span>From this archive</span></figcaption>
          </figure>`).join('')}
        ${PHOTOS.map((p, i) => `
          <figure class="photo" style="--i:${i}">
            <div class="photo-frame">
              <img src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.file)}?width=900" alt="${esc(p.caption)}" loading="lazy" referrerpolicy="no-referrer">
              <div class="photo-fallback">Photo loads from Wikimedia Commons</div>
            </div>
            <figcaption>${esc(p.caption)}<span>${esc(p.license)} · <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file)}" target="_blank" rel="noopener noreferrer">credit &amp; file page</a></span></figcaption>
          </figure>`).join('')}
      </div>`,
  },
};

export class Sheets {
  constructor({ onAlbum, onOpen, onClose }) {
    this.onAlbum = onAlbum; this.onOpen = onOpen; this.onClose = onClose;
    this.root = document.getElementById('sheet');
    this.titleEl = document.getElementById('sheet-title');
    this.subEl = document.getElementById('sheet-sub');
    this.body = document.getElementById('sheet-body');
    this.light = document.getElementById('lightbox');
    this.current = null;

    document.getElementById('sheet-close').addEventListener('click', () => this.close());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close(); });
    this.body.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-album]');
      if (chip) { const i = +chip.dataset.album; this.close(); this.onAlbum(i); return; }
      const plate = e.target.closest('[data-plate]');
      if (plate) this.zoom(+plate.dataset.plate);
    });
    // broken remote images fall back to a designed placeholder
    this.body.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG' && e.target.closest('.photo-frame')) e.target.closest('.photo-frame').classList.add('failed');
    }, true);
    this.light.addEventListener('click', () => this.light.classList.remove('open'));
    document.querySelectorAll('[data-sheet]').forEach((b) =>
      b.addEventListener('click', () => { this.open(b.dataset.sheet); document.getElementById('menu')?.classList.remove('open'); }));
    this.bindFocusTrap();
  }

  get isOpen() { return !!this.current; }

  bindFocusTrap() {
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); this.light.classList.contains('open') ? this.light.classList.remove('open') : this.close(); }
    });
  }

  open(name) {
    const v = VIEWS[name];
    if (!v) return;
    this.current = name;
    this.opener = document.activeElement;
    this.titleEl.textContent = v.title;
    this.subEl.textContent = v.sub;
    this.body.innerHTML = v.render();
    this.body.scrollTop = 0;
    this.root.classList.add('open');
    this.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sheet-open');
    document.getElementById('sheet-close').focus({ preventScroll: true });
    this.onOpen?.(name);
  }

  close() {
    if (!this.current) return;
    this.current = null;
    this.root.classList.remove('open');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sheet-open');
    this.light.classList.remove('open');
    this.opener?.focus?.({ preventScroll: true });
    this.onClose?.();
  }

  zoom(i) {
    const img = this.light.querySelector('img');
    img.src = PLATES[i];
    img.alt = `${ALBUMS[i].title} plate`;
    this.light.querySelector('figcaption').textContent = `${String(i + 1).padStart(2, '0')} — ${ALBUMS[i].title} (${ALBUMS[i].year})`;
    this.light.classList.add('open');
  }
}

/** In-site Spotify player. Loads the current album embed on demand and follows album changes. */
export class Player {
  constructor({ onOpen }) {
    this.root = document.getElementById('player');
    this.frameWrap = document.getElementById('player-frame');
    this.nameEl = document.getElementById('player-name');
    this.expandBtn = document.getElementById('player-expand');
    this.openBtns = document.querySelectorAll('[data-listen]');
    this.onOpen = onOpen;
    this.index = 0;
    this.isOpen = false;
    this.tall = false;
    this.loadedId = null;

    document.getElementById('player-close').addEventListener('click', () => this.close());
    this.expandBtn.addEventListener('click', () => this.setTall(!this.tall));
    this.openBtns.forEach((b) => b.addEventListener('click', () => this.open()));
  }

  setAlbum(i) {
    this.index = i;
    this.nameEl.textContent = ALBUMS[i].title;
    if (this.isOpen) {
      clearTimeout(this._t);
      this._t = setTimeout(() => this._load(), 650); // wait for scrolling to settle
    }
  }

  setTall(t) {
    this.tall = t;
    this.root.classList.toggle('tall', t);
    this.expandBtn.setAttribute('aria-pressed', String(t));
    this.expandBtn.textContent = t ? 'COMPACT' : 'TRACKLIST';
    const f = this.frameWrap.querySelector('iframe');
    if (f) f.height = t ? 352 : 152;
  }

  open() {
    this.isOpen = true;
    this.root.classList.add('open');
    document.body.classList.add('player-open');
    this._load();
    this.onOpen?.();
  }

  close() {
    this.isOpen = false;
    this.root.classList.remove('open');
    document.body.classList.remove('player-open');
    this.frameWrap.innerHTML = '';
    this.loadedId = null;
  }

  _load() {
    const id = ALBUMS[this.index].spotify;
    if (!id || id === this.loadedId) return;
    this.loadedId = id;
    this.frameWrap.innerHTML = '';
    const f = document.createElement('iframe');
    f.src = `https://open.spotify.com/embed/album/${id}?utm_source=generator&theme=0`;
    f.title = `${ALBUMS[this.index].title} on Spotify`;
    f.width = '100%';
    f.height = this.tall ? 352 : 152;
    f.frameBorder = '0';
    f.loading = 'lazy';
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    this.frameWrap.appendChild(f);
  }
}
