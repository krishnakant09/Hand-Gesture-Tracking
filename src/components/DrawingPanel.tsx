import React from "react";
import type { AppSettings } from "../types";
import { Brush, Palette, Eraser, Trash2, Wand2 } from "lucide-react";

interface DrawingPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClear: () => void;
}

const COLOR_PRESETS = ["#00f2fe", "#ff007f", "#f59e0b", "#a78bfa", "#10b981", "#ffffff"];

export const DrawingPanel: React.FC<DrawingPanelProps> = ({
  settings,
  onUpdateSettings,
  onClear,
}) => {
  return (
    <div className="hud-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header + master toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              backgroundColor: settings.drawingEnabled
                ? "rgba(0, 242, 254, 0.15)"
                : "rgba(100, 116, 139, 0.15)",
              border: `1px solid ${
                settings.drawingEnabled ? "var(--cyan-glow)" : "var(--border-subtle)"
              }`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: settings.drawingEnabled ? "var(--cyan-glow)" : "var(--text-dim)",
              boxShadow: settings.drawingEnabled ? "0 0 10px rgba(0, 242, 254, 0.25)" : "none",
            }}
          >
            <Brush style={{ width: "16px", height: "16px" }} />
          </div>
          <div>
            <h3
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-main)",
              }}
            >
              Air Drawing Studio
            </h3>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Point to draw · Fist to lift pen
            </p>
          </div>
        </div>

        <button
          onClick={() => onUpdateSettings({ drawingEnabled: !settings.drawingEnabled })}
          className={`toggle-btn ${settings.drawingEnabled ? "active" : ""}`}
          style={{ padding: "0.3rem 0.7rem", fontSize: "0.72rem" }}
        >
          {settings.drawingEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Controls (only meaningful while drawing is enabled) */}
      <div
        style={{
          opacity: settings.drawingEnabled ? 1 : 0.45,
          pointerEvents: settings.drawingEnabled ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        {/* Shape Auto-Assist (Smart Shapes) Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(11, 15, 25, 0.6)",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: settings.shapeAssist
                  ? "rgba(0, 242, 254, 0.2)"
                  : "rgba(100, 116, 139, 0.15)",
                border: `1px solid ${
                  settings.shapeAssist ? "var(--cyan-glow)" : "var(--border-subtle)"
                }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: settings.shapeAssist ? "var(--cyan-glow)" : "var(--text-dim)",
              }}
            >
              <Wand2 style={{ width: "13px", height: "13px" }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>Shape Auto-Assist</span>
                {settings.shapeAssist && (
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontFamily: "var(--font-mono)",
                      color: "var(--emerald-bright)",
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      padding: "0.05rem 0.35rem",
                      borderRadius: "4px",
                    }}
                  >
                    SMART
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>
                Snaps rough circles, boxes, triangles & lines
              </p>
            </div>
          </div>

          <button
            onClick={() => onUpdateSettings({ shapeAssist: !settings.shapeAssist })}
            className={`toggle-btn ${settings.shapeAssist ? "active" : ""}`}
            style={{ padding: "0.25rem 0.65rem", fontSize: "0.68rem" }}
          >
            {settings.shapeAssist ? "ON" : "OFF"}
          </button>
        </div>
        {/* Color swatches + custom picker */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "0.45rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Palette style={{ width: "12px", height: "12px", color: "var(--cyan-glow)" }} />
              Brush Color
            </span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan-glow)" }}>
              {settings.drawColor.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
            {COLOR_PRESETS.map((c) => {
              const selected = settings.drawColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => onUpdateSettings({ drawColor: c })}
                  title={c}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "7px",
                    backgroundColor: c,
                    border: selected ? "2px solid #ffffff" : "2px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    boxShadow: selected ? `0 0 10px ${c}` : "none",
                    transition: "all 0.15s ease",
                    padding: 0,
                  }}
                />
              );
            })}

            {/* Native color picker for custom colors */}
            <label
              style={{
                position: "relative",
                width: "26px",
                height: "26px",
                borderRadius: "7px",
                border: "2px dashed rgba(56, 189, 248, 0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
              title="Custom color"
            >
              <Eraser style={{ width: "13px", height: "13px", color: "var(--text-muted)" }} />
              <input
                type="color"
                value={settings.drawColor}
                onChange={(e) => onUpdateSettings({ drawColor: e.target.value })}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </label>
          </div>
        </div>

        {/* Brush size slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Brush Size</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan-glow)", fontWeight: 600 }}>
              {settings.brushSize}px
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={settings.brushSize}
            onChange={(e) => onUpdateSettings({ brushSize: Number(e.target.value) })}
            style={{
              width: "100%",
              accentColor: "var(--cyan-glow)",
              cursor: "pointer",
              height: "4px",
              background: "rgba(56, 189, 248, 0.2)",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Clear canvas button */}
        <button
          onClick={onClear}
          className="hud-btn"
          style={{
            justifyContent: "center",
            color: "var(--rose-bright)",
            borderColor: "rgba(244, 63, 94, 0.3)",
          }}
        >
          <Trash2 style={{ width: "13px", height: "13px" }} />
          <span>Clear Canvas</span>
        </button>
      </div>
    </div>
  );
};
