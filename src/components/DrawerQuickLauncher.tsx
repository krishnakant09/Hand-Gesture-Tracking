import React from "react";
import type { AppSettings } from "../types";
import type { DrawerTabId } from "./ControlDrawer";
import {
  Sliders,
  Volume2,
  VolumeX,
  Brush,
  ChevronRight,
  Sparkles,
  Palette,
  Layers,
} from "lucide-react";

interface DrawerQuickLauncherProps {
  settings: AppSettings;
  onOpenDrawer: (tab: DrawerTabId) => void;
  onToggleAudio: () => void;
  onToggleDrawing: () => void;
}

export const DrawerQuickLauncher: React.FC<DrawerQuickLauncherProps> = ({
  settings,
  onOpenDrawer,
  onToggleAudio,
  onToggleDrawing,
}) => {
  return (
    <div className="hud-card quick-launcher-card">
      <div className="quick-launcher-header">
        <div className="quick-launcher-title-wrap">
          <div className="quick-launcher-badge-icon">
            <Sliders style={{ width: "14px", height: "14px", color: "var(--cyan-glow)" }} />
          </div>
          <div>
            <h3 className="quick-launcher-title">Control Drawer Hub</h3>
            <p className="quick-launcher-subtitle">Sound FX • Air Drawing • Vision Tuning</p>
          </div>
        </div>

        <button
          onClick={() => onOpenDrawer("all")}
          className="hud-btn hud-btn-primary quick-launcher-all-btn"
          title="Open Control Drawer with all tools"
        >
          <Layers style={{ width: "13px", height: "13px" }} />
          <span>Open Drawer</span>
          <ChevronRight style={{ width: "12px", height: "12px" }} />
        </button>
      </div>

      <div className="quick-launcher-grid">
        {/* Card 1: Sound FX Engine */}
        <div
          className={`launcher-item ${settings.soundEnabled ? "active" : ""}`}
          onClick={() => onOpenDrawer("sound")}
          role="button"
          tabIndex={0}
        >
          <div className="launcher-item-top">
            <div className="launcher-item-icon-box sound">
              {settings.soundEnabled ? (
                <Volume2 style={{ width: "16px", height: "16px" }} />
              ) : (
                <VolumeX style={{ width: "16px", height: "16px" }} />
              )}
            </div>
            <div className="launcher-item-meta">
              <span className="launcher-item-label">Sound FX Engine</span>
              <span className="launcher-item-sub">
                {settings.soundTheme.toUpperCase()} • {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
          </div>

          <div className="launcher-item-footer">
            <button
              className={`launcher-pill-toggle ${settings.soundEnabled ? "on" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleAudio();
              }}
            >
              {settings.soundEnabled ? "ACTIVE" : "MUTED"}
            </button>
            <span className="launcher-open-link">
              Tune <ChevronRight style={{ width: "12px", height: "12px" }} />
            </span>
          </div>
        </div>

        {/* Card 2: Air Drawing */}
        <div
          className={`launcher-item ${settings.drawingEnabled ? "active" : ""}`}
          onClick={() => onOpenDrawer("drawing")}
          role="button"
          tabIndex={0}
        >
          <div className="launcher-item-top">
            <div
              className="launcher-item-icon-box drawing"
              style={{
                borderColor: settings.drawingEnabled ? settings.drawColor : undefined,
                color: settings.drawingEnabled ? settings.drawColor : undefined,
              }}
            >
              <Brush style={{ width: "16px", height: "16px" }} />
            </div>
            <div className="launcher-item-meta">
              <span className="launcher-item-label">Air Drawing</span>
              <span className="launcher-item-sub">
                {settings.drawingEnabled ? `${settings.brushSize}px Brush` : "Point to Draw"}
              </span>
            </div>
          </div>

          <div className="launcher-item-footer">
            <button
              className={`launcher-pill-toggle ${settings.drawingEnabled ? "on" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDrawing();
              }}
            >
              {settings.drawingEnabled ? "ENABLED" : "OFF"}
            </button>
            <span className="launcher-open-link">
              Studio <ChevronRight style={{ width: "12px", height: "12px" }} />
            </span>
          </div>
        </div>

        {/* Card 3: Visual Tracking Controls */}
        <div
          className="launcher-item"
          onClick={() => onOpenDrawer("tracking")}
          role="button"
          tabIndex={0}
        >
          <div className="launcher-item-top">
            <div className="launcher-item-icon-box tracking">
              <Palette style={{ width: "16px", height: "16px" }} />
            </div>
            <div className="launcher-item-meta">
              <span className="launcher-item-label">Visual Controls</span>
              <span className="launcher-item-sub">
                Theme: {settings.theme.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="launcher-item-footer">
            <span
              style={{
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                color: "var(--cyan-glow)",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Sparkles style={{ width: "11px", height: "11px" }} />
              6 Overlays
            </span>
            <span className="launcher-open-link">
              Tweak <ChevronRight style={{ width: "12px", height: "12px" }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
