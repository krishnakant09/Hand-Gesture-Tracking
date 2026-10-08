import React, { useEffect, useCallback } from "react";
import type { AppSettings } from "../types";
import { SoundFxPanel } from "./SoundFxPanel";
import { DrawingPanel } from "./DrawingPanel";
import { ControlsPanel } from "./ControlsPanel";
import {
  X,
  Volume2,
  VolumeX,
  Brush,
  Sliders,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";

export type DrawerTabId = "sound" | "drawing" | "tracking" | "all";

interface ControlDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DrawerTabId;
  onTabChange: (tab: DrawerTabId) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeGestureName?: string;
  onClearDrawing: () => void;
}

export const ControlDrawer: React.FC<ControlDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  settings,
  onUpdateSettings,
  activeGestureName,
  onClearDrawing,
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll slightly on mobile/small viewports when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("drawer-open");
    } else {
      document.body.classList.remove("drawer-open");
    }
    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [isOpen]);

  const tabs: {
    id: DrawerTabId;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: "sound",
      label: "Sound FX",
      icon: settings.soundEnabled ? (
        <Volume2 style={{ width: "15px", height: "15px" }} />
      ) : (
        <VolumeX style={{ width: "15px", height: "15px" }} />
      ),
      badge: settings.soundEnabled ? "LIVE" : "OFF",
      badgeColor: settings.soundEnabled ? "var(--emerald-bright)" : "var(--text-dim)",
    },
    {
      id: "drawing",
      label: "Air Draw",
      icon: <Brush style={{ width: "15px", height: "15px" }} />,
      badge: settings.drawingEnabled ? "ON" : "OFF",
      badgeColor: settings.drawingEnabled ? "var(--cyan-glow)" : "var(--text-dim)",
    },
    {
      id: "tracking",
      label: "Visuals",
      icon: <Sliders style={{ width: "15px", height: "15px" }} />,
      badge: settings.theme.toUpperCase(),
      badgeColor: "var(--purple-bright)",
    },
    {
      id: "all",
      label: "All Tools",
      icon: <Layers style={{ width: "15px", height: "15px" }} />,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Drawer Panel */}
      <aside
        className={`drawer-container ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Aura Vision Control Drawer"
      >
        {/* Drawer Header */}
        <header className="drawer-header">
          <div className="drawer-title-row">
            <div className="drawer-title-group">
              <div className="drawer-brand-icon">
                <Sparkles style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <h2 className="drawer-title">AURA CONTROL DRAWER</h2>
                <p className="drawer-subtitle">
                  Real-time audio engine, air drawing & visual tracking
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="drawer-esc-hint">ESC</span>
              <button
                onClick={onClose}
                className="drawer-close-btn"
                title="Close Drawer (Esc)"
                aria-label="Close drawer"
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
          </div>

          {/* Tab Navigation Strip */}
          <nav className="drawer-tabs-nav" aria-label="Control Drawer Tabs">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={`drawer-tab-btn ${isActive ? "active" : ""}`}
                  type="button"
                >
                  <span className="drawer-tab-icon">{t.icon}</span>
                  <span className="drawer-tab-label">{t.label}</span>
                  {t.badge && (
                    <span
                      className="drawer-tab-badge"
                      style={{
                        color: t.badgeColor,
                        borderColor: t.badgeColor ? `${t.badgeColor}40` : undefined,
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Drawer Scrollable Content Area */}
        <div className="drawer-content-scroll">
          {/* Active Tab: Sound FX Engine */}
          {(activeTab === "sound" || activeTab === "all") && (
            <section className="drawer-section">
              {activeTab === "all" && (
                <div className="drawer-section-header">
                  <div className="section-title-wrap">
                    <Volume2 style={{ width: "15px", height: "15px", color: "var(--cyan-glow)" }} />
                    <h4>Sound FX Engine HUD</h4>
                  </div>
                  <span className="section-status-tag">
                    {settings.soundEnabled ? "Audio Active" : "Audio Muted"}
                  </span>
                </div>
              )}
              <SoundFxPanel
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                activeGestureName={activeGestureName}
              />
            </section>
          )}

          {/* Active Tab: Air Drawing */}
          {(activeTab === "drawing" || activeTab === "all") && (
            <section className="drawer-section">
              {activeTab === "all" && (
                <div className="drawer-section-header">
                  <div className="section-title-wrap">
                    <Brush style={{ width: "15px", height: "15px", color: "var(--cyan-glow)" }} />
                    <h4>Air Drawing Engine</h4>
                  </div>
                  <span className="section-status-tag">
                    {settings.drawingEnabled ? "Drawing Enabled" : "Drawing Inactive"}
                  </span>
                </div>
              )}
              <DrawingPanel
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                onClear={onClearDrawing}
              />
            </section>
          )}

          {/* Active Tab: Visual Tracking Controls */}
          {(activeTab === "tracking" || activeTab === "all") && (
            <section className="drawer-section">
              {activeTab === "all" && (
                <div className="drawer-section-header">
                  <div className="section-title-wrap">
                    <Sliders style={{ width: "15px", height: "15px", color: "var(--cyan-glow)" }} />
                    <h4>Visual Tracking Controls</h4>
                  </div>
                  <span className="section-status-tag">
                    Theme: {settings.theme.toUpperCase()}
                  </span>
                </div>
              )}
              <ControlsPanel
                settings={settings}
                onUpdateSettings={onUpdateSettings}
              />
            </section>
          )}
        </div>

        {/* Drawer Footer with Quick Master Toggles */}
        <footer className="drawer-footer">
          <div className="drawer-footer-actions">
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`drawer-quick-toggle ${settings.soundEnabled ? "active" : ""}`}
              title="Toggle Sound Effects"
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 style={{ width: "14px", height: "14px", color: "var(--cyan-glow)" }} />
                  <span>FX On</span>
                </>
              ) : (
                <>
                  <VolumeX style={{ width: "14px", height: "14px" }} />
                  <span>FX Muted</span>
                </>
              )}
            </button>

            <button
              onClick={() => onUpdateSettings({ drawingEnabled: !settings.drawingEnabled })}
              className={`drawer-quick-toggle ${settings.drawingEnabled ? "active" : ""}`}
              title="Toggle Air Drawing"
            >
              <Brush
                style={{
                  width: "14px",
                  height: "14px",
                  color: settings.drawingEnabled ? "var(--cyan-glow)" : "currentColor",
                }}
              />
              <span>Draw: {settings.drawingEnabled ? "ON" : "OFF"}</span>
            </button>
          </div>

          <button onClick={onClose} className="drawer-done-btn">
            <Check style={{ width: "14px", height: "14px" }} />
            <span>Apply & Close</span>
          </button>
        </footer>
      </aside>
    </>
  );
};
