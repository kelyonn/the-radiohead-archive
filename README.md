# THE RADIOHEAD ARCHIVE

An interactive WebGL experience visualizing Radiohead's discography through the lens of "Digital Decay" - a brutalist, terminal-inspired interface that morphs between three iconic eras.

![Radiohead Archive](https://img.shields.io/badge/Status-Active-success)
![Three.js](https://img.shields.io/badge/Three.js-r150-blue)
![GSAP](https://img.shields.io/badge/GSAP-3.12+-green)

## 🎨 Concept

**THE RADIOHEAD ARCHIVE** is a single-page interactive experience that acts as a "Terminal Interface" exploring Radiohead's history. The application uses scroll-based navigation to transition between three iconic albums, each with its own visual identity and procedural audio atmosphere.

### Core Features

- **Scroll-Based Morphing**: Smooth transitions between eras triggered by scroll position
- **Procedural Audio**: Era-specific soundscapes generated using Web Audio API
- **Brutalist UI**: Terminal-inspired interface with CRT scanline effects
- **Album Information**: Complete track listings, descriptions, and album artwork
- **Progress Tracking**: Visual scroll indicator showing current era

## 🎵 The Eras

| Era | Year | Visual Theme | Audio Vibe |
|-----|------|--------------|------------|
| **In Rainbows** | 2007 | Nebula | Warm Arpeggios + Static |
| **OK Computer** | 1997 | Grid | Dial-up Drone + Robotic Beeps |
| **Kid A** | 2000 | Terrain | Wind + Sub-bass |

## 🛠️ Tech Stack

- **Three.js** (r150+) - WebGL rendering
- **GSAP** (3.12+) - Animation and transitions
- **Web Audio API** - Procedural sound generation
- **Vanilla JavaScript** (ES Modules) - No frameworks
- **CSS3** - Brutalist styling with CRT effects

## 📁 Project Structure

```
/the-radiohead-archive
│
├── index.html              # Entry point with UI structure
├── style.css               # Brutalist UI & CRT effects
│
└── src
    ├── main.js             # Application bootstrapper & scroll handler
    ├── data.js             # Album data (eras, tracks, descriptions)
    ├── audioManager.js     # Web Audio API controller
    │
    └── visuals
        ├── SceneManager.js     # Three.js scene/camera/renderer
        └── ShapeGenerators.js  # Particle shape generators (nebula, grid, terrain)
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser with WebGL support
- A local web server (for ES modules)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/the-radiohead-archive.git
cd the-radiohead-archive
```

2. Start a local server:

**Python:**
```bash
python3 -m http.server 8000
```

**Node.js:**
```bash
npx serve
```

**PHP:**
```bash
php -S localhost:8000
```

3. Open in browser:
```
http://localhost:8000
```

## 🎮 Usage

### Navigation

- **Scroll Down**: Progress through eras (In Rainbows → OK Computer → Kid A)
- **Scroll Indicator**: Click era labels on the right side to jump to specific sections
- **Audio Button**: Click "INITIALIZE_AUDIO" to enable procedural audio

### Features

- **Smooth Transitions**: All UI elements (poster, title, description, tracks) transition together
- **Procedural Audio**: Each era has unique soundscape that changes automatically
- **Terminal Log**: System messages appear in the bottom-left terminal
- **Progress Bar**: Visual indicator shows scroll progress through eras

## 🎨 Visual Design

### "Digital Decay" Aesthetic

- **Color Scheme**: Terminal green (#00ff41) on black background
- **Typography**: Space Mono / Courier New (monospace)
- **Effects**: 
  - CRT scanline overlay
  - Flickering system status
  - Glitch-inspired animations
  - Mix-blend-mode exclusion for UI layer

### UI Elements

- **Header**: "RADIOHEAD" title with "SYSTEM: ONLINE" status
- **Center**: Album poster, title, year, description, and track list
- **Terminal Log**: Bottom-left system messages
- **Scroll Indicator**: Right-side progress bar with era labels
- **Audio Button**: Bottom-right initialization button

## 🔊 Audio System

The audio system generates procedural soundscapes for each era:

- **In Rainbows**: Warm sine and triangle oscillators (220Hz, 330Hz)
- **OK Computer**: Mechanical square and sawtooth waves (100Hz, 200Hz)
- **Kid A**: Low-frequency sine with LFO modulation (60Hz base)

All audio is generated client-side using Web Audio API - no copyrighted material is used.

## 📝 Legal & Compliance

This is an **unofficial fan project** for educational purposes only.

- No affiliation with Radiohead or their record labels
- No copyrighted audio files hosted
- All audio is procedurally generated
- Album artwork sourced from public archives (Cover Art Archive)
- Educational use only

## 🎯 Roadmap

### Phase 1: The Shell ✅
- [x] File structure and scaffolding
- [x] Three.js scene initialization
- [x] Brutalist UI implementation
- [x] Loading screen with progress tracking

### Phase 2: The Logic ✅
- [x] Scroll-based morphing system
- [x] Shape generators (Nebula, Grid, Terrain)
- [x] GSAP timeline transitions
- [x] Era-specific content display

### Phase 3: The Interaction (Planned)
- [ ] GLSL shaders for mouse interaction
- [ ] Enhanced Web Audio API reactivity
- [ ] Particle system with audio visualization

### Phase 4: Polish (Planned)
- [ ] Post-processing effects (Bloom, Film Grain)
- [ ] Mobile responsiveness
- [ ] Performance optimization

## 🐛 Known Issues

- Three.js r150 deprecation warning (will migrate to ES modules in future)
- Some album artwork may fail to load due to CORS (using Cover Art Archive as fallback)

## 🤝 Contributing

This is a personal portfolio project, but suggestions and feedback are welcome!

## 📄 License

This project is for educational purposes only. All Radiohead album artwork, titles, and related content are property of their respective owners.

## 🙏 Acknowledgments

- Radiohead for their incredible music
- Cover Art Archive / MusicBrainz for album artwork
- Three.js community
- GSAP for amazing animation tools

---

**UNOFFICIAL FAN PROJECT. EDUCATIONAL USE ONLY.**
