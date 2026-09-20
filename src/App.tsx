import { useEffect, useState, useRef, useCallback } from "react";
import { HandLandmarker } from "@mediapipe/tasks-vision";
import type { TrackedHand, AppSettings } from "./types";
import { initializeHandLandmarker } from "./services/handLandmarker";
import { soundEffects } from "./services/soundEffects";
import { CameraView } from "./components/CameraView";
import { GestureHud } from "./components/GestureHud";
import { ControlsPanel } from "./components/ControlsPanel";
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

  // Audio & Modals
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const lastGestureRef = useRef<string>("");

  // Settings
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
  });

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

  // Audio feedback when new gesture triggers
  const handleHandsDetected = useCallback(
    (hands: TrackedHand[]) => {
      setTrackedHands(hands);

      if (hands.length > 0 && isAudioEnabled) {
        const primaryGesture = hands[0].gesture.name;
        if (primaryGesture !== "Unknown" && primaryGesture !== lastGestureRef.current) {
          lastGestureRef.current = primaryGesture;
          soundEffects.playGestureChime();
        }
      } else if (hands.length === 0) {
        lastGestureRef.current = "";
      }
    },
    [isAudioEnabled]
  );

  const toggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    soundEffects.setEnabled(next);
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
          {/* Audio Chime Toggle */}
          <button
            onClick={toggleAudio}
            className="hud-btn"
            title={isAudioEnabled ? "Mute Gesture Audio" : "Enable Gesture Audio Chimes"}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 style={{ width: "15px", height: "15px", color: "var(--cyan-glow)" }} />
                <span>Audio On</span>
              </>
            ) : (
              <>
                <VolumeX style={{ width: "15px", height: "15px" }} />
                <span>Audio Off</span>
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
