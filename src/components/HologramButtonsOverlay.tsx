import React from "react";
import type { AppSettings } from "../types";
import type { AirMouseState, HologramButtonDef } from "../services/airMouse";
import {
  Brush,
  Trash2,
  Volume2,
  VolumeX,
  Palette,
  Sliders,
  Sparkles,
} from "lucide-react";

interface HologramButtonsOverlayProps {
  settings: AppSettings;
  airMouseState: AirMouseState;
  buttons: HologramButtonDef[];
  onTriggerButton: (id: string) => void;
}

export const HologramButtonsOverlay: React.FC<HologramButtonsOverlayProps> = ({
  settings,
  airMouseState,
  buttons,
  onTriggerButton,
}) => {
  const { cursor, isPinching, isScrolling, hoveredButtonId, dwellProgress } = airMouseState;

  // Icon mapping helper
  const renderButtonIcon = (btnId: string) => {
    switch (btnId) {
      case "toggle-draw":
        return (
          <Brush
            style={{
              width: "15px",
              height: "15px",
              color: settings.drawingEnabled ? "var(--cyan-glow)" : "var(--text-muted)",
            }}
          />
        );
      case "clear-canvas":
        return <Trash2 style={{ width: "15px", height: "15px", color: "var(--rose-bright)" }} />;
      case "toggle-audio":
        return settings.soundEnabled ? (
          <Volume2 style={{ width: "15px", height: "15px", color: "var(--cyan-glow)" }} />
        ) : (
          <VolumeX style={{ width: "15px", height: "15px", color: "var(--text-dim)" }} />
        );
      case "cycle-theme":
        return <Palette style={{ width: "15px", height: "15px", color: "var(--purple-bright)" }} />;
      case "open-drawer":
        return <Sliders style={{ width: "15px", height: "15px", color: "var(--cyan-glow)" }} />;
      default:
        return <Sparkles style={{ width: "15px", height: "15px" }} />;
    }
  };

  return (
    <div className="hologram-overlay-container" aria-hidden="true">
      {/* 1. Floating Holographic Spatial Buttons */}
      {settings.hologramButtonsEnabled && (
        <div className="hologram-buttons-rack">
          {buttons.map((btn) => {
            const isHovered = hoveredButtonId === btn.id;

            return (
              <div
                key={btn.id}
                className={`hologram-btn-card ${isHovered ? "hovered" : ""} ${
                  isHovered && isPinching ? "pressed" : ""
                }`}
                style={{
                  left: `${btn.x * 100}%`,
                  top: `${btn.y * 100}%`,
                  width: `${btn.width * 100}%`,
                  height: `${btn.height * 100}%`,
                }}
                onClick={() => onTriggerButton(btn.id)}
              >
                {/* Dwell Progress Ring SVG when hovered */}
                {isHovered && dwellProgress > 0 && (
                  <svg className="dwell-ring" viewBox="0 0 36 36">
                    <path
                      className="dwell-ring-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="dwell-ring-stroke"
                      strokeDasharray={`${dwellProgress * 100}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                )}

                <div className="hologram-btn-content">
                  <div className="hologram-btn-icon-wrap">{renderButtonIcon(btn.id)}</div>
                  <div className="hologram-btn-text">
                    <span className="hologram-btn-title">{btn.label}</span>
                    {btn.sublabel && (
                      <span className="hologram-btn-subtitle">{btn.sublabel}</span>
                    )}
                  </div>
                </div>

                {/* Subtle cyber corner brackets */}
                <span className="corner-bracket tl" />
                <span className="corner-bracket br" />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Virtual Air Mouse Holographic Reticle / Cursor */}
      {settings.airMouseEnabled && cursor && (
        <div
          className={`air-mouse-cursor ${isPinching ? "pinching" : ""} ${
            isScrolling ? "scrolling" : ""
          } ${hoveredButtonId ? "on-target" : ""}`}
          style={{
            transform: `translate3d(${cursor.screenX}px, ${cursor.screenY}px, 0)`,
          }}
        >
          {/* Target Reticle Outer Ring & Crosshairs */}
          <div className="reticle-outer">
            <span className="crosshair-tick top" />
            <span className="crosshair-tick bottom" />
            <span className="crosshair-tick left" />
            <span className="crosshair-tick right" />
          </div>

          {/* Central Point */}
          <div className="reticle-core" />

          {/* Pinch Wave Animation */}
          {isPinching && <div className="pinch-pulse-wave" />}

          {/* Hover Status Tooltip Tag */}
          <div className="cursor-hud-pill">
            {isPinching ? (
              <span className="pinch-badge">CLICK</span>
            ) : isScrolling ? (
              <span className="scroll-badge">SCROLL</span>
            ) : hoveredButtonId ? (
              <span className="target-badge">TAP / PINCH</span>
            ) : (
              <span className="coord-badge">
                {Math.round(cursor.x * 100)}%·{Math.round(cursor.y * 100)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
