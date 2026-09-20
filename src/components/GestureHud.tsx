import React, { useState } from "react";
import type { TrackedHand } from "../types";
import { Activity, Gauge, HandMetal, ChevronDown, ChevronUp, Check, Circle } from "lucide-react";

interface GestureHudProps {
  hands: TrackedHand[];
  fps: number;
  latencyMs: number;
}

export const GestureHud: React.FC<GestureHudProps> = ({ hands, fps, latencyMs }) => {
  const [showLandmarks, setShowLandmarks] = useState<boolean>(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      {/* 3 Metric Summary Cards */}
      <div className="metric-grid">
        {/* Frame Rate */}
        <div className="metric-item">
          <div>
            <div className="metric-label">Frame Rate</div>
            <div className="metric-val" style={{ color: "var(--cyan-glow)" }}>
              {fps} <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 400 }}>FPS</span>
            </div>
          </div>
          <Gauge style={{ width: "1.4rem", height: "1.4rem", color: "rgba(0, 242, 254, 0.4)" }} />
        </div>

        {/* Inference Latency */}
        <div className="metric-item">
          <div>
            <div className="metric-label">Latency</div>
            <div className="metric-val" style={{ color: "var(--emerald-bright)" }}>
              {latencyMs} <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 400 }}>ms</span>
            </div>
          </div>
          <Activity style={{ width: "1.4rem", height: "1.4rem", color: "rgba(16, 185, 129, 0.4)" }} />
        </div>

        {/* Detected Targets */}
        <div className="metric-item">
          <div>
            <div className="metric-label">Detected</div>
            <div className="metric-val" style={{ color: "var(--purple-bright)" }}>
              {hands.length} <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 400 }}>{hands.length === 1 ? "Hand" : "Hands"}</span>
            </div>
          </div>
          <HandMetal style={{ width: "1.4rem", height: "1.4rem", color: "rgba(168, 85, 247, 0.4)" }} />
        </div>
      </div>

      {/* Main Gesture Readout Cards */}
      {hands.length === 0 ? (
        <div
          className="hud-card"
          style={{
            borderStyle: "dashed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "2rem 1.5rem",
            gap: "0.6rem",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(30, 41, 59, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
            }}
          >
            🖐️
          </div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
            Show Hand to Camera
          </h4>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", maxWidth: "340px", lineHeight: 1.4 }}>
            Position one or both hands in front of the lens. MediaPipe detects 21 joints in real time!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {hands.map((hand) => {
            const fingers = hand.fingerStates;
            const fingerList = [
              { name: "Thumb", open: fingers.thumb },
              { name: "Index", open: fingers.index },
              { name: "Middle", open: fingers.middle },
              { name: "Ring", open: fingers.ring },
              { name: "Pinky", open: fingers.pinky },
            ];

            return (
              <div key={hand.id} className="gesture-result-card">
                {/* Hand Identity & Confidence Tag */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.2rem 0.65rem",
                      borderRadius: "1rem",
                      background: "rgba(0, 242, 254, 0.12)",
                      border: "1px solid rgba(0, 242, 254, 0.3)",
                      color: "var(--cyan-glow)",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--cyan-glow)",
                        boxShadow: "0 0 6px var(--cyan-glow)",
                      }}
                    />
                    {hand.handedness} Hand
                  </div>

                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Match: {Math.round(hand.score * 100)}%
                  </span>
                </div>

                {/* Main Gesture Display */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div className="gesture-icon-box">
                    {hand.gesture.emoji}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
                      {hand.gesture.label}
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {hand.gesture.description}
                    </p>
                  </div>
                </div>

                {/* Finger Articulation Matrix */}
                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 700,
                      color: "var(--text-dim)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Individual Finger State
                  </div>
                  <div className="finger-grid">
                    {fingerList.map((f) => (
                      <div key={f.name} className={`finger-pill ${f.open ? "open" : ""}`}>
                        <div>{f.name}</div>
                        <div style={{ marginTop: "0.2rem", display: "flex", justifyContent: "center" }}>
                          {f.open ? (
                            <Check style={{ width: "10px", height: "10px", strokeWidth: 3 }} />
                          ) : (
                            <Circle style={{ width: "7px", height: "7px", opacity: 0.3 }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div style={{ marginTop: "0.85rem" }}>
                  <div
                    style={{
                      width: "100%",
                      height: "4px",
                      borderRadius: "2px",
                      background: "rgba(15, 23, 42, 0.8)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round(hand.gesture.confidence * 100)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, var(--cyan-glow), var(--emerald-bright))",
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 21 Keypoints Telemetry Inspector */}
      {hands.length > 0 && (
        <div>
          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className="telemetry-btn"
          >
            <span>21 Keypoints 3D Telemetry</span>
            {showLandmarks ? <ChevronUp style={{ width: "14px", height: "14px" }} /> : <ChevronDown style={{ width: "14px", height: "14px" }} />}
          </button>

          {showLandmarks && (
            <div className="telemetry-content">
              {hands.map((h, i) => (
                <div key={i} style={{ marginBottom: i < hands.length - 1 ? "1rem" : 0 }}>
                  <div style={{ color: "var(--cyan-glow)", fontWeight: 700, marginBottom: "0.3rem" }}>
                    {h.handedness} Hand:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.35rem" }}>
                    {h.landmarks.map((lm, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(15, 23, 42, 0.7)",
                          padding: "0.25rem 0.4rem",
                          borderRadius: "0.35rem",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "var(--text-dim)" }}>#{idx}</span>
                        <span>{lm.x.toFixed(2)}, {lm.y.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
