import React from "react";
import { X, Check, Volume2 } from "lucide-react";
import { soundEffects } from "../services/soundEffects";

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGestureName?: string;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({
  isOpen,
  onClose,
  activeGestureName,
}) => {
  if (!isOpen) return null;

  const gestures = [
    {
      id: "OpenPalm",
      name: "Open Palm",
      emoji: "✋",
      desc: "Extend all five fingers outstretched and spread apart.",
      tips: "Keep your palm facing toward the camera lens.",
    },
    {
      id: "Fist",
      name: "Closed Fist",
      emoji: "✊",
      desc: "Curl all four fingers into the palm with the thumb folded.",
      tips: "Keep knuckles clearly visible.",
    },
    {
      id: "Pointing",
      name: "Pointing",
      emoji: "☝️",
      desc: "Extend only your index finger straight up, curl the others.",
      tips: "Keep index finger pointing upwards.",
    },
    {
      id: "ThumbsUp",
      name: "Thumbs Up",
      emoji: "👍",
      desc: "Point your thumb upward with remaining fingers curled.",
      tips: "Orient hand vertically.",
    },
    {
      id: "ThumbsDown",
      name: "Thumbs Down",
      emoji: "👎",
      desc: "Point your thumb downward with remaining fingers curled.",
      tips: "Point thumb downward towards bottom of frame.",
    },
    {
      id: "Peace",
      name: "Victory / Peace",
      emoji: "✌️",
      desc: "Extend index and middle fingers in a V shape, curl ring & pinky.",
      tips: "Traditional peace sign.",
    },
    {
      id: "RockOn",
      name: "Rock On / Horns",
      emoji: "🤘",
      desc: "Extend index and pinky fingers, curl middle and ring fingers.",
      tips: "Heavy metal horns pose.",
    },
    {
      id: "OK",
      name: "OK Sign",
      emoji: "👌",
      desc: "Touch thumb tip to index tip to form a circle, extend other 3 fingers.",
      tips: "Make a loop with index and thumb.",
    },
    {
      id: "CallMe",
      name: "Call Me / Shaka",
      emoji: "🤙",
      desc: "Extend thumb and pinky finger, curl index, middle, and ring.",
      tips: "Classic telephone or surfer shaka sign.",
    },
    {
      id: "Gun",
      name: "Finger Gun",
      emoji: "👉",
      desc: "Index pointed forward horizontally, thumb pointing upward.",
      tips: "Aim index finger horizontally.",
    },
    {
      id: "Pinch",
      name: "Pinch",
      emoji: "🤏",
      desc: "Bring thumb tip and index tip close together with fingers relaxed.",
      tips: "Fine motor pinch interaction.",
    },
    {
      id: "MiddleFinger",
      name: "Middle Finger",
      emoji: "🖕",
      desc: "Extend only your middle finger upright with remaining fingers folded into palm.",
      tips: "Raise middle finger vertically with knuckles forward.",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
      }}
      className="animate-fadeIn"
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "85vh",
          backgroundColor: "#0d1321",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "1.25rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            backgroundColor: "rgba(7, 9, 14, 0.7)",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>Supported Hand Gestures</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "1rem",
                  backgroundColor: "rgba(0, 242, 254, 0.15)",
                  color: "var(--cyan-glow)",
                  border: "1px solid rgba(0, 242, 254, 0.3)",
                }}
              >
                {gestures.length} Total
              </span>
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Perform these hand poses in camera view for instant neural detection
            </p>
          </div>
          <button
            onClick={onClose}
            className="hud-btn"
            style={{ padding: "0.4rem", borderRadius: "0.6rem" }}
          >
            <X style={{ width: "1.1rem", height: "1.1rem" }} />
          </button>
        </div>

        {/* Body / List */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {gestures.map((g) => {
            const isActive = activeGestureName === g.id;
            return (
              <div
                key={g.id}
                style={{
                  padding: "0.85rem",
                  borderRadius: "0.85rem",
                  border: isActive
                    ? "1px solid var(--cyan-glow)"
                    : "1px solid var(--border-subtle)",
                  backgroundColor: isActive
                    ? "rgba(0, 242, 254, 0.08)"
                    : "rgba(11, 15, 25, 0.6)",
                  boxShadow: isActive ? "0 0 15px rgba(0, 242, 254, 0.2)" : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    flexShrink: 0,
                  }}
                >
                  {g.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ffffff" }}>
                      {g.name}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playGestureSound(g.id, true);
                        }}
                        className="hud-btn"
                        style={{
                          padding: "0.2rem 0.45rem",
                          fontSize: "0.68rem",
                          borderRadius: "0.4rem",
                          background: "rgba(0, 242, 254, 0.12)",
                          borderColor: "rgba(0, 242, 254, 0.3)",
                          color: "var(--cyan-glow)",
                        }}
                        title={`Preview ${g.name} sound effect`}
                      >
                        <Volume2 style={{ width: "11px", height: "11px" }} />
                        <span>FX</span>
                      </button>
                      {isActive && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontSize: "0.65rem",
                            fontFamily: "var(--font-mono)",
                            color: "var(--cyan-glow)",
                            fontWeight: 700,
                          }}
                        >
                          <Check style={{ width: "11px", height: "11px" }} /> MATCH
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem", lineHeight: 1.3 }}>
                    {g.desc}
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "rgba(0, 242, 254, 0.8)", marginTop: "0.25rem", fontStyle: "italic" }}>
                    Tip: {g.tips}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.85rem 1.5rem",
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "rgba(7, 9, 14, 0.7)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            className="hud-btn hud-btn-primary"
            style={{ padding: "0.5rem 1.25rem" }}
          >
            Dismiss Guide
          </button>
        </div>
      </div>
    </div>
  );
};
