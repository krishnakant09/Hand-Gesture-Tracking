import { useEffect, useState, useRef, useCallback } from "react";
import { HandLandmarker } from "@mediapipe/tasks-vision";
import type { TrackedHand, AppSettings } from "./types";
import { initializeHandLandmarker } from "./services/handLandmarker";
import { soundEffects } from "./services/soundEffects";
import { CameraView } from "./components/CameraView";
import { GestureHud } from "./components/GestureHud";
import { ControlsPanel } from "./components/ControlsPanel";
import { SoundFxPanel } from "./components/SoundFxPanel";
import { GestureGuideModal } from "./components/GestureGuideModal";
import {
  Hand,
  BookOpen,
  Volume2,
  VolumeX,
  Cpu,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export function App() {
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initStatusText, setInitStatusText] = useState<string>("Initializing MediaPipe Vision...");
  const [, setInitProgress] = useState<number>(10);
  const [initError, setInitError] = useState<string | null>(null);

  // Real-time detection state
  const [trackedHands, setTrackedHands] = useState<TrackedHand[]>([]);
  const [fps, setFps] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Modals & Motion Tracking
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const lastGestureRef = useRef<string>("");
  const lastWristPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Settings with Sound FX
  const [settings, setSettings] = useState<AppSettings>({
    showSkeleton: true,
    showJoints: true,
    showGlow: true,
    showBoundingBox: true,
    showLandmarkIndices: false,
    showGestureBadgeOnCanvas: true,
    mirror: true,
    theme: "cyber",
    minConfidence: 0.5,
    maxHands: 2,
    soundEnabled: true,
    soundVolume: 0.7,
    soundTheme: "scifi",
    motionWhoosh: true,
  });

  // Sync settings with sound effects engine
  useEffect(() => {
    soundEffects.setEnabled(settings.soundEnabled);
    soundEffects.setVolume(settings.soundVolume);
    soundEffects.setTheme(settings.soundTheme);
  }, [settings.soundEnabled, settings.soundVolume, settings.soundTheme]);

  // 1. Initialize MediaPipe Hand Landmarker
  const loadLandmarker = useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);
    try {
      const instance = await initializeHandLandmarker((msg, progress) => {
        setInitStatusText(msg);
        setInitProgress(progress);
      });
      setLandmarker(instance);
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Failed to load hand landmarker:", err);
      setInitError(
        err?.message || "Failed to initialize vision pipeline. Check network/WASM support."
      );
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadLandmarker();
  }, [loadLandmarker]);

  // Audio feedback when new gesture triggers or fast hand motion occurs
  const handleHandsDetected = useCallback(
    (hands: TrackedHand[]) => {
      setTrackedHands(hands);

      if (hands.length > 0) {
        const primaryGesture = hands[0].gesture.name;

        // 1. Trigger gesture-specific sound FX when hand pose changes
        if (settings.soundEnabled && primaryGesture !== "Unknown") {
          if (primaryGesture !== lastGestureRef.current) {
            lastGestureRef.current = primaryGesture;
            soundEffects.playGestureSound(primaryGesture);
          }
        }

        // 2. Dynamic Motion Air-Whoosh sound FX on rapid hand wave/swipe
        if (settings.soundEnabled && settings.motionWhoosh && hands[0].landmarks && hands[0].landmarks.length > 0) {
          const wrist = hands[0].landmarks[0];
          const now = performance.now();
          if (lastWristPosRef.current) {
            const dt = (now - lastWristPosRef.current.time) / 1000;
            if (dt > 0.015 && dt < 0.25) {
              const dx = wrist.x - lastWristPosRef.current.x;
              const dy = wrist.y - lastWristPosRef.current.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const speed = dist / dt; // screen distance per second
              if (speed > 1.6) { // fast hand swipe action
                const intensity = Math.min(1, (speed - 1.6) / 2.5);
                soundEffects.playMotionWhoosh(intensity);
              }
            }
          }
          lastWristPosRef.current = { x: wrist.x, y: wrist.y, time: now };
        }
      } else {
        lastGestureRef.current = "";
        lastWristPosRef.current = null;
      }
    },
    [settings.soundEnabled, settings.motionWhoosh]
  );

  const toggleAudio = () => {
    const next = !settings.soundEnabled;
    setSettings((prev) => ({ ...prev, soundEnabled: next }));
    soundEffects.setEnabled(next);
    if (next) {
      soundEffects.playGestureSound("Pointing", true);
    }
  };

  const updateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const activeGesture = trackedHands.length > 0 ? trackedHands[0].gesture.name : undefined;

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <Hand style={{ width: "24px", height: "24px" }} />
          </div>
          <div>
            <h1 className="brand-title">AURA VISION</h1>
            <p className="brand-subtitle">
              MediaPipe Real-Time Hand Landmarker & Gesture Engine
            </p>
          </div>
        </div>

        {/* Header Action Toolbar */}
        <div className="header-actions">
          {/* Audio FX Toggle */}
          <button
            onClick={toggleAudio}
            className={`hud-btn ${settings.soundEnabled ? "hud-btn-primary" : ""}`}
            title={settings.soundEnabled ? "Mute Action Sound FX" : "Enable Action Sound FX"}
          >
            {settings.soundEnabled ? (
              <>
                <Volume2 style={{ width: "15px", height: "15px", color: "var(--cyan-glow)" }} />
                <span>Audio FX On</span>
              </>
            ) : (
              <>
                <VolumeX style={{ width: "15px", height: "15px" }} />
                <span>Audio FX Off</span>
              </>
            )}
          </button>

          {/* Gesture Guide Reference */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="hud-btn hud-btn-primary"
          >
            <BookOpen style={{ width: "15px", height: "15px" }} />
            <span>Gesture Guide</span>
          </button>

          {/* Hardware acceleration badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.8rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(11, 15, 25, 0.7)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: isInitializing ? "var(--amber-bright)" : "var(--emerald-bright)",
            }}
          >
            <Cpu style={{ width: "14px", height: "14px" }} />
            <span>{isInitializing ? "COMPILING" : "GPU ACCELERATED"}</span>
          </div>
        </div>
      </header>

      {/* Model Initialization Banner (if loading or failed) */}
      {isInitializing && (
        <div
          className="hud-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.9rem 1.4rem",
            borderColor: "rgba(0, 242, 254, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: "2px solid rgba(0, 242, 254, 0.2)",
                borderTopColor: "var(--cyan-glow)",
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 500 }}>
              {initStatusText}
            </span>
          </div>
          <Sparkles style={{ width: "18px", height: "18px", color: "var(--cyan-glow)" }} />
        </div>
      )}

      {initError && (
        <div
          className="hud-card"
          style={{
            backgroundColor: "rgba(127, 29, 29, 0.3)",
            borderColor: "rgba(239, 68, 68, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#fca5a5" }}>
            <AlertTriangle style={{ width: "20px", height: "20px" }} />
            <span style={{ fontSize: "0.85rem" }}>{initError}</span>
          </div>
          <button onClick={loadLandmarker} className="hud-btn">
            <RefreshCw style={{ width: "14px", height: "14px" }} /> Retry
          </button>
        </div>
      )}

      {/* Main Vision Interface Grid */}
      <main className="main-dashboard">
        {/* Left Column: Live Camera & Skeletal Canvas Viewport */}
        <section className="camera-column">
          <CameraView
            landmarker={landmarker}
            settings={settings}
            onHandsDetected={handleHandsDetected}
            onFpsUpdate={(newFps, newLatency) => {
              setFps(newFps);
              setLatencyMs(newLatency);
            }}
          />
        </section>

        {/* Right Column: Gesture Readout & Visual Controls */}
        <aside className="sidebar-column">
          {/* Biometric & Gesture Recognition HUD */}
          <GestureHud
            hands={trackedHands}
            fps={fps}
            latencyMs={latencyMs}
          />

          {/* Sound FX Audio Engine & Interactive Soundboard */}
          <SoundFxPanel
            settings={settings}
            onUpdateSettings={updateSettings}
            activeGestureName={activeGesture}
          />

          {/* Overlay & Aesthetic Customizer */}
          <ControlsPanel
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        </aside>
      </main>

      {/* Footer Specs & Documentation */}
      <footer className="app-footer">
        <div>
          <span>Antigravity AI • MediaPipe Vision Tasks HandLandmarker v1.0.1</span>
        </div>
        <div className="footer-tags">
          <span className="tech-tag">21 3D Landmarks</span>
          <span className="tech-tag">WebGL / WebAssembly</span>
          <span className="tech-tag">Kinematic Gesture Heuristics</span>
        </div>
      </footer>

      {/* Interactive Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        activeGestureName={activeGesture}
      />
    </div>
  );
}

export default App;
