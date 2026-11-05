# THE RADIOHEAD ARCHIVE

An interactive WebGL archive of Radiohead's nine studio albums. One GPU particle cloud (90k+ points) is sculpted into a different 3D form for each record, and **scrolling disintegrates one era into the next**. Every album has its own colour palette, tracklist and a procedurally generated soundscape.

> Unofficial fan project. No affiliation with Radiohead. No recordings or artwork are hosted — all audio is synthesised in your browser.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (relative paths, works on GitHub Pages)
```

## Using it

| Action | Control |
| --- | --- |
| Next / previous album | Scroll, swipe, `↓ →` / `↑ ←`, `Space`, the side rail, or the ← → buttons on mobile |
| Jump to an album | `1`–`9`, or click it in the rail (links like `#kid-a` also work) |
| Play a tone / shockwave | Click a track, or click empty space |
| Push the particles | Move the pointer |
| Mute / unmute | `M` or the SOUND button |

## Sections

- **Listen** — an in-site Spotify player that follows the album you are viewing (uses Spotify's official embed; sign in there for full tracks, otherwise you get previews).
- **Timeline** — 1985 to today, linked back to each album.
- **Band** — the five members plus producer Nigel Godrich and artist Stanley Donwood.
- **Stories** — nine short, original reads.
- **Gallery** — generated particle plates (original artwork) and free-licence photographs from Wikimedia Commons, each with a credit link.

## Deploy (GitHub Pages)

A workflow in `.github/workflows/pages.yml` builds and publishes `dist/` on every push to `main`. Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Deploy (Vercel)

`vercel.json` is included, so deploying is zero-config: on vercel.com choose **Add New → Project**, import this repository, and press **Deploy**. Vercel detects Vite and publishes `dist/`; every push to `main` redeploys.

## What's inside

- **Particle engine** (`src/stage.js`, `src/shaders.js`) — all morphing, flow-field noise, pointer repulsion, shockwaves and audio reactivity run in the vertex shader. Scroll position *is* the morph amount, so it is fully scrubbable and reversible.
- **Nine sculptures** (`src/shapes.js`) — noisy sphere, double helix, wireframe motorway, faceted ice terrain, (3,5) torus knot, Lorenz attractor, spectrum arcs, recursive tree, crescent moon over rippling water.
- **Post-processing** — bloom, chromatic aberration, scroll-velocity glitch, grain, scanlines, vignette, ACES tone mapping.
- **Generative audio** (`src/audio.js`) — nine Web Audio patches (sequencers, FM, filtered noise, generated reverb) with crossfades; an analyser drives the visuals.
- **Adaptive quality** — pixel ratio and particle count scale automatically to hold ~60 fps; mobile gets a lighter budget; `prefers-reduced-motion` is respected; a lite mode appears if WebGL is unavailable.

Stack: Vite, Three.js, vanilla ES modules, bundled fonts (Anton, Space Mono).
