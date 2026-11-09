# The Radiohead Archive

An interactive WebGL tribute to Radiohead's nine studio albums. A single GPU particle cloud is sculpted into a different 3D form for each record, and scrolling dissolves one era into the next.

Each album has its own colour palette, tracklist, short mood note and a generative soundscape synthesised in the browser. Around the main view sit an in-site player, a timeline, a band profile page and a set of short stories.

> Unofficial fan project, with no affiliation to Radiohead. No recordings are hosted. All audio is synthesised in your browser, and photographs are free-licence images from Wikimedia Commons.

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Controls](#controls)
- [Visual modes](#visual-modes)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Photo credits](#photo-credits)
- [License](#license)

## Features

- **Nine morphing sculptures.** Noisy sphere, double helix, wireframe motorway, faceted ice terrain, (3,5) torus knot, Lorenz attractor, spectrum arcs, recursive tree and a crescent moon over water. Scroll position is the morph amount, so the transition is fully scrubbable and reversible.
- **Generative audio.** Nine Web Audio patches built from sequencers, FM synthesis, filtered noise and generated reverb, crossfaded as you move between albums.
- **Focused main screen.** Title, year, a one-line mood and a short note. Producer, label, a suggested first track and the full tracklist sit in a collapsible dropdown.
- **In-site player.** Uses Spotify's official embed and follows the album you are viewing. Sign in there for full tracks; otherwise you get previews.
- **Timeline, Band and Stories.** Twenty timeline entries from 1985 to today, five band members plus two key collaborators, and nine short original reads, each illustrated with a credited photograph.
- **Adaptive and accessible.** Particle count and pixel ratio scale to hold a steady frame rate, mobile gets a lighter budget, `prefers-reduced-motion` is respected, and a lite mode appears when WebGL is unavailable.

## Getting started

Requires Node 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve the production build locally
```

## Controls

| Action | Input |
| --- | --- |
| Next or previous album | Scroll, swipe, arrow keys, `Space`, the side rail, or the on-screen arrows on mobile |
| Jump to an album | `1` to `9`, or click it in the rail. Links such as `#kid-a` also work |
| Play a tone and send a shockwave | Click a track, or click empty space |
| Push the particles | Move the pointer |
| Mute or unmute | `M`, or the Sound button |
| Switch visual mode | The Calm / Reactive button in the header |

## Visual modes

The default **Calm** look is the same with sound on or off. **Reactive** lets the music drive the visuals, with the cloud pulsing and glowing to the bass at a reduced strength and brightness. The choice is remembered between visits.

## How it works

- **Particle engine** (`src/scene/stage.js`, `src/scene/shaders.js`). Morphing, flow-field noise, pointer repulsion, shockwaves and audio response all run in the vertex shader.
- **Sculptures** (`src/scene/shapes.js`). Procedural generators produce one static position buffer per album.
- **Post-processing.** Bloom, chromatic aberration, scroll-velocity glitch, grain, scanlines, vignette and ACES tone mapping.
- **Audio** (`src/audio.js`). Web Audio only, with no samples. An analyser feeds the Reactive mode.
- **Interface** (`src/ui/ui.js`, `src/ui/sheets.js`). Plain DOM, with no framework.

Stack: Vite, Three.js, vanilla ES modules, and bundled fonts (Anton, Space Mono).

## Project structure

```
index.html              Page shell and HUD markup
style.css               All styling
vite.config.js          Build config
vite.single.config.js   Optional single-file build
src/
  main.js               Boot, input, render loop
  audio.js              Generative soundscapes (Web Audio)
  scene/
    stage.js            Three.js scene and post-processing
    shaders.js          Particle, background and post shaders
    shapes.js           Sculpture generators
  data/
    data.js             Album data: tracks, palettes, mood notes
    content.js          Timeline, band and story text
    pics.js             Photo credit manifest
  ui/
    ui.js               Main-screen interface
    sheets.js           Timeline, Band and Stories sheets, and the player
  assets/pics/          Locally stored photographs
```

## Deployment

**GitHub Pages.** The workflow in `.github/workflows/pages.yml` builds and publishes `dist/` on every push to `main`. Enable it once under Settings, Pages, Source: GitHub Actions.

**Vercel.** `vercel.json` is included. Import the repository as a new project and deploy; Vercel detects Vite and redeploys on every push to `main`.

The build uses relative paths, so it also works from a sub-path.

## Photo credits

All photographs are from Wikimedia Commons under free licences (CC0, CC BY, CC BY-SA). Hover any image on the site for its author, licence and a link to the original file page. The full list is in `src/data/pics.js`.

## License

Copyright (c) 2026 Kalyan. All rights reserved. The code and written content may not be copied, modified, redistributed or reused without written permission; see [LICENSE](LICENSE). Third-party photographs and dependencies keep their own licenses, and Radiohead names and album titles belong to their owners and are used for identification only.
