import React, { useEffect, useRef, useState, useCallback } from "react";
import { HandLandmarker } from "@mediapipe/tasks-vision";
import type { TrackedHand, AppSettings, NormalizedLandmark } from "../types";
import { detectHandsForVideo } from "../services/handLandmarker";
import { recognizeGesture, analyzeFingerStates } from "../services/gestureRecognizer";
import { drawHandOverlay } from "../services/canvasDrawer";
import { Camera, CameraOff, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

interface CameraViewProps {
  landmarker: HandLandmarker | null;
  settings: AppSettings;
  onHandsDetected: (hands: TrackedHand[]) => void;
  onFpsUpdate: (fps: number, latencyMs: number) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  landmarker,
  settings,
  onHandsDetected,
  onFpsUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isStreamReady, setIsStreamReady] = useState<boolean>(false);

  // FPS tracking refs
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number | null>(null);

  // 1. Enumerate available video devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(cameras);
      if (cameras.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(cameras[0].deviceId);
      }
    } catch (e) {
      console.warn("Could not list video devices:", e);
    }
  }, [selectedDeviceId]);

  // 2. Start webcam stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsStreamReady(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API is not supported in this browser environment.");
      return;
    }

    try {
      if (videoRef.current?.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsStreamReady(true);
        };
      }
      setIsCameraActive(true);
      await getDevices();
    } catch (err: any) {
      console.error("Webcam access error:", err);
      let msg = "Could not access camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission denied. Please allow camera access in your browser to enable hand tracking.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No webcam device detected on your system.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Webcam is currently in use by another application.";
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, [selectedDeviceId, getDevices]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStreamReady(false);
    onHandsDetected([]);
  }, [onHandsDetected]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // 3. Real-time Detection Loop
  useEffect(() => {
    if (!isCameraActive || !isStreamReady || !landmarker) return;

    let isRunning = true;

    const processFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        // Match internal canvas coordinate size to video native feed
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const startTime = performance.now();
        const results = detectHandsForVideo(landmarker, video, startTime);
        const latency = performance.now() - startTime;

        const trackedHands: TrackedHand[] = [];

        if (results && results.landmarks && results.landmarks.length > 0) {
          results.landmarks.forEach((lms, idx) => {
            const rawHandedness = results.handednesses?.[idx]?.[0];
            const handednessStr = rawHandedness
              ? rawHandedness.categoryName
              : idx === 0
              ? "Right"
              : "Left";
            const handedness = (handednessStr === "Left" ? "Left" : "Right") as "Left" | "Right";
            const score = rawHandedness ? rawHandedness.score : 0.92;

            const fingerStates = analyzeFingerStates(lms as NormalizedLandmark[]);
            const gesture = recognizeGesture(lms as NormalizedLandmark[], handedness);

            const xs = lms.map((p) => p.x);
            const ys = lms.map((p) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            trackedHands.push({
              id: idx,
              handedness,
              score,
              landmarks: lms as NormalizedLandmark[],
              worldLandmarks: results.worldLandmarks?.[idx] as NormalizedLandmark[],
              fingerStates,
              gesture,
              boundingBox: {
                minX,
                minY,
                maxX,
                maxY,
                width: maxX - minX,
                height: maxY - minY,
              },
            });
          });
        }

        // Draw Skeletal overlays
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawHandOverlay(ctx, trackedHands, canvas.width, canvas.height, settings);
        }

        // Notify parent state
        onHandsDetected(trackedHands);

        // Update FPS & latency metrics
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastFpsTimeRef.current >= 500) {
          const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current));
          onFpsUpdate(fps, Math.round(latency));
          frameCountRef.current = 0;
          lastFpsTimeRef.current = now;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, isStreamReady, landmarker, settings, onHandsDetected, onFpsUpdate]);

  return (
    <div className="camera-wrapper">
      {/* Video Feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: settings.mirror ? "scaleX(-1)" : "none",
          transition: "opacity 0.3s ease",
          opacity: isStreamReady ? 1 : 0,
        }}
      />

      {/* Real-time HTML5 Skeletal Canvas Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />

      {/* Cyberpunk Grid Overlay */}
      {isStreamReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0, 242, 254, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 254, 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Loading or Error State */}
      {(!isCameraActive || cameraError || !isStreamReady) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "rgba(7, 9, 14, 0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 10,
            textAlign: "center",
          }}
        >
          {cameraError ? (
            <div
              style={{
                maxWidth: "420px",
                padding: "1.5rem",
                borderRadius: "1rem",
                background: "rgba(127, 29, 29, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <AlertCircle style={{ width: "2.5rem", height: "2.5rem", color: "#f87171" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fecaca" }}>
                Camera Access Needed
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#fca5a5", lineHeight: 1.4 }}>
                {cameraError}
              </p>
              <button
                onClick={startCamera}
                className="hud-btn hud-btn-primary"
                style={{ marginTop: "0.5rem" }}
              >
                <RefreshCw style={{ width: "1rem", height: "1rem" }} /> Re-enable Camera
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ position: "relative", width: "54px", height: "54px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "3px solid rgba(0, 242, 254, 0.2)",
                    borderTopColor: "var(--cyan-glow)",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <Sparkles
                  style={{
                    position: "absolute",
                    inset: 0,
                    margin: "auto",
                    width: "22px",
                    height: "22px",
                    color: "var(--cyan-glow)",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0" }}>
                Activating Optical Sensor Stream...
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Allow camera permissions in your browser if prompted
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Quick Controls Bar */}
      <div
        style={{
          position: "absolute",
          bottom: "1rem",
          left: "1rem",
          right: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 5,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => (isCameraActive ? stopCamera() : startCamera())}
            className="hud-btn"
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.75rem",
              borderColor: isCameraActive ? "rgba(244, 63, 94, 0.4)" : "rgba(16, 185, 129, 0.4)",
              color: isCameraActive ? "#fda4af" : "#6ee7b7",
            }}
          >
            {isCameraActive ? (
              <>
                <CameraOff style={{ width: "0.9rem", height: "0.9rem" }} /> Pause Video
              </>
            ) : (
              <>
                <Camera style={{ width: "0.9rem", height: "0.9rem" }} /> Resume Video
              </>
            )}
          </button>

          {videoDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border-subtle)",
                color: "#e2e8f0",
                fontSize: "0.75rem",
                padding: "0.45rem 0.75rem",
                borderRadius: "0.6rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {videoDevices.map((dev, i) => (
                <option key={dev.deviceId || i} value={dev.deviceId}>
                  {dev.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Live Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "0.75rem",
            background: "rgba(13, 19, 33, 0.8)",
            border: "1px solid var(--border-subtle)",
            backdropFilter: "blur(12px)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isStreamReady ? "var(--cyan-glow)" : "var(--amber-bright)",
              boxShadow: isStreamReady ? "0 0 8px var(--cyan-glow)" : "none",
            }}
          />
          <span>{isStreamReady ? "REAL-TIME TRACKING" : "STANDBY"}</span>
        </div>
      </div>
    </div>
  );
};
