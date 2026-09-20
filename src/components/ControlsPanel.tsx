import React from "react";
import type { AppSettings, ThemeName } from "../types";
import { Sliders, Eye, Zap, Palette, FlipHorizontal, Box, Hash } from "lucide-react";

interface ControlsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const themes: { id: ThemeName; label: string; dotColor: string }[] = [
    { id: "cyber", label: "Cyber Neon", dotColor: "#00f2fe" },
    { id: "emerald", label: "Emerald Bio", dotColor: "#10b981" },
    { id: "sunset", label: "Sunset Coral", dotColor: "#ff5e62" },
    { id: "matrix", label: "Matrix Green", dotColor: "#00ff66" },
  ];

  return (
    <div className="hud-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Sliders style={{ width: "1.1rem", height: "1.1rem", color: "var(--cyan-glow)" }} />
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-main)" }}>
          Visual Tracking Controls
        </h3>
      </div>

      {/* Feature Toggles */}
      <div className="controls-grid">
        <button
          onClick={() => onUpdateSettings({ showSkeleton: !settings.showSkeleton })}
          className={`toggle-btn ${settings.showSkeleton ? "active" : ""}`}
        >
          <Eye style={{ width: "13px", height: "13px" }} />
          <span>Skeletal Bones</span>
        </button>

        <button
          onClick={() => onUpdateSettings({ showJoints: !settings.showJoints })}
          className={`toggle-btn ${settings.showJoints ? "active" : ""}`}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "currentColor" }} />
          <span>21 Keypoints</span>
        </button>

        <button
          onClick={() => onUpdateSettings({ showGlow: !settings.showGlow })}
          className={`toggle-btn ${settings.showGlow ? "active" : ""}`}
        >
          <Zap style={{ width: "13px", height: "13px" }} />
          <span>Neon Aura</span>
        </button>

        <button
          onClick={() => onUpdateSettings({ showBoundingBox: !settings.showBoundingBox })}
          className={`toggle-btn ${settings.showBoundingBox ? "active" : ""}`}
        >
          <Box style={{ width: "13px", height: "13px" }} />
          <span>Target Box</span>
        </button>

        <button
          onClick={() => onUpdateSettings({ showLandmarkIndices: !settings.showLandmarkIndices })}
          className={`toggle-btn ${settings.showLandmarkIndices ? "active" : ""}`}
        >
          <Hash style={{ width: "13px", height: "13px" }} />
          <span>Index #</span>
        </button>

        <button
          onClick={() => onUpdateSettings({ mirror: !settings.mirror })}
          className={`toggle-btn ${settings.mirror ? "active" : ""}`}
        >
          <FlipHorizontal style={{ width: "13px", height: "13px" }} />
          <span>Mirror Feed</span>
        </button>
      </div>

      {/* Theme Picker */}
      <div style={{ marginTop: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.45rem" }}>
          <Palette style={{ width: "13px", height: "13px", color: "var(--cyan-glow)" }} />
          <span>Hologram Palette</span>
        </div>
        <div className="theme-grid">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onUpdateSettings({ theme: t.id })}
              className={`theme-pill ${settings.theme === t.id ? "active" : ""}`}
            >
              <span className="color-dot" style={{ backgroundColor: t.dotColor, boxShadow: `0 0 8px ${t.dotColor}` }} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
