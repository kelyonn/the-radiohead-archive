# Product Requirements Document (PRD)
## Project: THE RADIOHEAD ARCHIVE (v1.0)

| Attribute | Details |
| :--- | :--- |
| **Concept** | An interactive WebGL operating system visualizing the "Digital Decay" of Radiohead's history. |
| **Core Mechanic** | **"The Disintegration Scroll"** – Eras are destroyed and rebuilt via particle manipulation (Morphing). |
| **Primary Goal** | To build a technically advanced portfolio piece using Three.js (WebGL), Shaders (GLSL), and Audio Analysis. |
| **Tech Stack** | Three.js (r150+), GSAP (3.12+), Web Audio API, Vanilla JS (ES Modules). |
| **Deployment** | GitHub Pages / Netlify (Static Hosting). |

---

## 1. Core Architecture
The application acts as a single-page **"Terminal Interface."** There is no traditional navigation bar. The user explores the history by scrolling, which mutates the 3D environment in real-time.

### 1.1 The Visual Engine (Three.js)
* **Particle System:** A single `BufferGeometry` containing **15,000 - 50,000 vertices**.
* **Transitions (Morphing):** Objects are not destroyed/created. We animate the `position` attributes of the *same* particles to new coordinates to form new shapes.
* **Shaders:** Custom Vertex Shaders (GLSL) will handle the "Explosion" and "Morph" math on the GPU for 60FPS performance.

### 1.2 The Audio Engine (Web Audio API)
* **Safety Protocol:** No copyrighted MP3s are hosted to prevent DMCA issues.
* **Procedural Sound:** The app generates "Atmospheres" (White Noise, Sine Drones, Oscillators) that match the era's vibe using the Web Audio API.
* **Reactivity:** The visual particles pulse in size/color based on real-time audio frequency data (`analyser.getByteFrequencyData`).

---

## 2. Visual Identity ("Digital Decay")
* **Aesthetic:** Brutalist, High Contrast, Glitch Art.
* **Typography:** Monospaced / Terminal Fonts (e.g., 'Space Mono', 'Courier New').
* **UI Elements:**
    * **System Log:** A text box that types out cryptic lore/data about each album.
    * **Scanlines:** A CSS overlay (`pointer-events: none`) to simulate CRT monitor texture.
    * **Status Indicators:** Blinking cursors and "SYSTEM: ONLINE" markers.

---

## 3. The Eras (Content Map)

| Era | Year | Visual Theme | Visual Behavior | Audio Vibe |
| :--- | :--- | :--- | :--- | :--- |
| **In Rainbows** | 2007 | **Nebula** | Exploding color spectrum. Organic, floating movement. | Warm Arpeggios + Static. |
| **OK Computer** | 1997 | **Grid** | Schematic wireframes. Blue/White colors. Twitchy, mechanical motion. | Dial-up Drone + Robotic Beeps. |
| **Kid A** | 2000 | **Terrain** | Low-poly jagged mountains. Ice White. Frozen, slow distortion. | Wind + Sub-bass. |

---

## 4. Legal & Compliance
To ensure this remains a portfolio piece and not a target for takedowns:
* **Disclaimer:** A fixed footer must state: *"Unofficial Fan Project. Educational Use Only. No affiliation with Radiohead."*
* **Copyright:**
    * No use of official band logos (use generative particle approximations).
    * No hosting of master recordings (use procedural soundalikes or Spotify embeds).

---

## 5. Implementation Roadmap

### **Phase 1: The Shell (Current)**
* Scaffold the file structure (`src/`, `index.html`, `style.css`).
* Initialize the Three.js Scene, Camera, and Renderer.
* Build the "In Rainbows" Particle Cloud (Random Distribution).
* Implement the Brutalist UI and System Log.

### **Phase 2: The Logic**
* Implement the **Scroll-based Morphing** logic using GSAP Timelines.
* Define the target coordinates for the "Grid" and "Terrain" shapes.

### **Phase 3: The Interaction**
* Write **GLSL Shaders** for mouse interaction (Magnetic Repulsion).
* Implement the **Web Audio API** engine for procedural sound.

### **Phase 4: Polish**
* Add Post-Processing effects (Bloom, Film Grain, Chromatic Aberration).
* Mobile responsiveness and performance optimization.