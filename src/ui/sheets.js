import { ALBUMS } from '../data/data.js';
import { TIMELINE, BAND, COLLABORATORS, STORIES } from '../data/content.js';
import { CREDITS, pic } from '../data/pics.js';

const STORY_ALBUM = [0, 0, 2, 2, 3, 4, 6, 8, 2];
const figure = (slug, cls) => {
  const src = pic(slug), cr = CREDITS[slug];
  if (!src) return '';
  return `<figure class="${cls}"><img src="${src}" alt="" loading="lazy" decoding="async"><figcaption><a href="${cr.page}" target="_blank" rel="noopener noreferrer">${esc(cr.artist)} · ${esc(cr.license)}</a></figcaption></figure>`;
};
const MEMBER_ALBUM = [0, 3, 2, 6, 8];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
              ${figure(e.img, 'tl-pic')}
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
          <article class="member" style="--c:${accent(MEMBER_ALBUM[i])};--i:${i}">
            ${figure(m.img, 'member-pic')}
            <h3>${esc(m.name)}</h3>
            <div class="role">${esc(m.role)} · b. ${m.born}</div>
            <p>${esc(m.text)}</p>
          </article>`).join('')}
      </div>
      <h2 class="sub-h">COLLABORATORS</h2>
      <div class="grid collabs">
        ${COLLABORATORS.map((m, i) => `
          <article class="member small" style="--c:${accent(2 + i * 3)};--i:${i}">
            ${figure(m.img, 'member-pic')}<h3>${esc(m.name)}</h3><div class="role">${esc(m.role)}</div><p>${esc(m.text)}</p>
          </article>`).join('')}
      </div>`,
  },
  stories: {
    title: 'STORIES', sub: 'NINE SHORT READS',
    render: () => `
      <div class="stories">
        ${STORIES.map((s, i) => `
          <article class="story" style="--c:${accent(STORY_ALBUM[i])};--i:${i}">
            ${figure(s.img, 'story-pic')}
            <div class="tag">${esc(s.tag)}</div>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.text)}</p>
          </article>`).join('')}
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
    this.current = null;

    document.getElementById('sheet-close').addEventListener('click', () => this.close());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close(); });
    this.body.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-album]');
      if (chip) { const i = +chip.dataset.album; this.close(); this.onAlbum(i); return; }
    });
    document.querySelectorAll('[data-sheet]').forEach((b) =>
      b.addEventListener('click', () => { this.open(b.dataset.sheet); document.getElementById('menu')?.classList.remove('open'); }));
    this.bindFocusTrap();
  }

  get isOpen() { return !!this.current; }

  bindFocusTrap() {
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
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
    this.opener?.focus?.({ preventScroll: true });
    this.onClose?.();
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
