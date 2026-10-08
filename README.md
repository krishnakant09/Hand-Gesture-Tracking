# Aura Vision 🖐️⚡

> **Real-Time Hand Landmarker, Kinematic Gesture Recognition Engine, Procedural Audio Synthesizer & Mid-Air Drawing Studio**  
> Powered by MediaPipe Vision Tasks, WebGL/WASM acceleration, React 19, TypeScript, and Vite.

---

## 🌟 Overview

**Aura Vision** is a futuristic, cyberpunk-styled computer vision web application that tracks hands in real time through your webcam. It detects 21 3D skeletal landmarks, classifies complex kinematic hand gestures, generates interactive procedural audio feedback, and allows you to draw in mid-air using fingertip motion tracking.

All tools and tuning parameters are accessible through a slide-over **Control Drawer** and a sidebar **Quick Launcher Hub**.

---

## ✨ Key Features

### 1. 🤖 21 3D Landmark Tracking (MediaPipe Vision)
- **GPU & WebAssembly Accelerated**: Runs client-side in the browser using WebGL and WebAssembly.
- **Resilient Multi-Tier Initialization**: Automatic fallback strategy across local WASM, local model weights, and Google Cloud CDN endpoints.
- **Configurable Overlays**:
  - 🦴 Skeletal bone links & joints
  - 🟢 21 Keypoint landmarks
  - ⚡ Dynamic neon auras & glows
  - 🎯 Target bounding boxes & confidence meters
  - 🔢 Landmark index numbers (0–20)
  - 🪞 Mirrored video feed toggle

### 2. 🖐️ Kinematic Gesture Recognition
Heuristic-based recognition engine evaluating 3D Euclidean distances, finger flexion angles, and thumb opposition in real time:
- ✋ **Open Palm** · All fingers extended & spread
- ✊ **Closed Fist** · All fingers curled into palm
- ☝️ **Pointing** · Index finger extended upright
- 👍 **Thumbs Up** · Thumb pointing up, fingers curled
- 👎 **Thumbs Down** · Thumb pointing down, fingers curled
- ✌️ **Peace / Victory** · Index and middle fingers in V-shape
- 🤘 **Rock On** · Index and pinky extended
- 🤟 **I Love You (ASL)** · Thumb, index, and pinky extended
- 👌 **OK Sign** · Thumb tip touching index tip loop
- 🖖 **Vulcan Salute** · Split V between middle and ring fingers
- 4️⃣ **Four Fingers** · 4 fingers raised with thumb tucked
- 👉 **Finger Gun** · Index pointing forward horizontally
- 🤏 **Pinch** · Fine motor pinch between thumb & index
- 🤙 **Call Me / Shaka** · Thumb and pinky extended

### 3. 🎵 Procedural Sound FX Engine
- **Web Audio API Synthesizer**: Zero external audio dependencies needed for out-of-the-box sound effects.
- **4 Soundbank Themes**:
  - ⚡ **Sci-Fi HUD** · Laser blasters, kinetic thuds, cyber chimes
  - 🕹️ **8-Bit Arcade** · Retro chiptune coins, jump hits, 1-ups
  - 🔔 **Zen Bells** · Singing bowls, crystal dings, harmonic tones
  - ⚙️ **Mechanical** · Tactile switch clicks, camera shutters
- **Dynamic Motion Whoosh**: Synthesizes air whoosh sounds on rapid hand swipes and waves based on wrist kinematic velocity.
- **Interactive Soundboard**: Test and preview audio triggers directly with a dynamic equalizer waveform visualizer.
- **Custom Audio Uploader**: Map your own audio files (`.mp3`, `.wav`, `.ogg`) to any gesture.

### 4. ✏️ Mid-Air Drawing Canvas & Shape Auto-Assist
- **Air Paint Mode**: Point your index finger to draw in mid-air; curl your fingers into a fist to lift the pen without drawing.
- **📐 Shape Auto-Assist (Smart Shapes)**:
  - Automatically analyzes completed strokes on pen lift using Ramer-Douglas-Peucker simplification and geometric Shoelace polygon classification.
  - Snaps rough hand-drawn strokes into perfect vector shapes:
    - ⭕ **Circles**: Clean geometric circles evaluated via low centroid radial variance.
    - ⬛ **Rectangles / Squares**: Crisp 4-corner bounding boxes.
    - 🔺 **Triangles**: Sharp 3-vertex polygons.
    - 📏 **Straight Lines**: Snaps linear paths with high start-to-end directness.
  - Visual toast notification (`✨ Auto-Snapped Circle`) and audio chime confirmation on snap.
- **Customization**:
  - Cyber color palette presets (Cyan, Magenta, Amber, Purple, Emerald, White)
  - Color picker for custom HEX colors
  - Brush size slider (1px – 20px)
  - Shape Auto-Assist master toggle
  - One-click canvas clearing with smooth fading

### 5. 🎛️ Slide-Over Control Drawer
- **Dedicated Off-Canvas Drawer**: Smooth slide-in glassmorphism panel (`min(520px, 100vw)`) accessible via:
  - Header toolbar button (`Control Drawer`)
  - Floating cyber tab on the right edge of the screen
  - Quick Launcher cards in the sidebar
- **Organized Tab Navigation**:
  - 🔊 **Sound FX Engine**: Theme selection, volume slider, visualizer, soundboard, and custom file uploads.
  - ✏️ **Air Draw Studio**: Brush controls, palette selection, canvas management.
  - 🎛️ **Visual Controls**: Overlay toggles, mirror mode, and 4 hologram themes (*Cyber Neon, Emerald Bio, Sunset Coral, Matrix Green*).
  - 📑 **All Tools**: Unified stacked view of all three engines in a single scrollable panel.
- **Keyboard Shortcuts**: Press `Escape` or click the blurred backdrop to dismiss.
- **Quick Footer Controls**: Instant audio mute/unmute and air draw toggles with an "Apply & Close" button.

### 6. 📊 Real-Time Biometric HUD & Gesture Guide
- **Telemetry Readout**: Live FPS, latency (ms), and active tracking confidence.
- **Finger State Indicators**: Five live pills indicating open/closed state for Thumb, Index, Middle, Ring, and Pinky.
- **Coordinates Inspector**: Expandable live 21-landmark coordinate inspector (`x`, `y`, `z`).
- **Interactive Gesture Guide Modal**: Comprehensive gesture guide with posture instructions and audio samples.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Vision AI**: [@mediapipe/tasks-vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) (v1.0.1)
- **Icons**: [lucide-react](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed on your machine.
- A functional webcam with browser camera permissions granted.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/krishnakant09/Hand-Gesture-Tracking.git
   cd Hand-Gesture-Tracking
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Type-checks with `tsc` and compiles the production bundle |
| `npm run preview` | Locally previews the production build output in `dist/` |
| `npm run lint` | Runs `oxlint src` for fast static code analysis |
| `npm run test` | Runs the Vitest test suite in interactive watch mode |
| `npm run test:run` | Executes all unit tests once and reports results |

---

## 📁 Project Structure

```
├── public/                     # Static assets, WebAssembly modules, and sound guides
│   ├── models/                 # MediaPipe hand_landmarker.task model file
│   ├── wasm/                   # MediaPipe Vision WebAssembly runtime binaries
│   └── sounds/                 # Sound engine assets & documentation
├── src/
│   ├── components/             # UI Components
│   │   ├── CameraView.tsx      # Video feed, skeletal landmark canvas & air drawing overlay
│   │   ├── ControlDrawer.tsx   # Slide-over drawer housing Sound, Drawing & Visual controls
│   │   ├── DrawerQuickLauncher.tsx # Sidebar companion cards for one-click drawer launch
│   │   ├── GestureHud.tsx      # Live telemetry, finger states & gesture badge readout
│   │   ├── SoundFxPanel.tsx    # Sound synthesizer, soundboard, themes & audio uploader
│   │   ├── DrawingPanel.tsx    # Air drawing palette, brush size & canvas clearing
│   │   ├── ControlsPanel.tsx   # Visual overlay toggles and hologram themes
│   │   └── GestureGuideModal.tsx # Interactive visual reference modal for all gestures
│   ├── services/               # Core Vision, Heuristic & Audio Engines
│   │   ├── handLandmarker.ts   # MediaPipe HandLandmarker lifecycle & CDN fallback pipeline
│   │   ├── gestureRecognizer.ts# Kinematic rule engine for 14+ hand gestures
│   │   ├── soundEffects.ts     # Procedural Web Audio synthesizer & soundbank manager
│   │   ├── canvasDrawer.ts     # Holographic skeleton, aura, and bounding box renderer
│   │   └── airDrawing.ts       # Smoothed mid-air stroke interpolator & drawing state
│   ├── types.ts                # TypeScript interfaces & application types
│   ├── App.tsx                 # Root application component & layout state
│   ├── index.css               # Futuristic cyberpunk glassmorphism design system
│   └── main.tsx                # React root entry point
├── package.json
└── tsconfig.json
```

---

## 🔒 Privacy & Security

- **100% Client-Side Processing**: Camera video feeds are processed entirely inside your local browser via WebGL/WASM. No video or biometric data is ever sent to or stored on external servers.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
