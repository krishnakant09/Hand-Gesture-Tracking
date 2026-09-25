import React, { useEffect, useState, useRef } from "react";
import type { AppSettings, SoundTheme } from "../types";
import { soundEffects } from "../services/soundEffects";
import {
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  Wind,
  Play,
  Upload,
  Music,
  Trash2,
} from "lucide-react";

interface SoundFxPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeGestureName?: string;
}

export const SoundFxPanel: React.FC<SoundFxPanelProps> = ({
  settings,
  onUpdateSettings,
  activeGestureName,
}) => {
  const [lastPlayedGesture, setLastPlayedGesture] = useState<string | null>(null);
  const [isPlayingVisual, setIsPlayingVisual] = useState<boolean>(false);
  const [targetGesture, setTargetGesture] = useState<string>("Gun");
  const [, setCustomVersion] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Soundbank options
  const soundThemes: { id: SoundTheme; label: string; icon: string; desc: string }[] = [
    { id: "scifi", label: "Sci-Fi HUD", icon: "⚡", desc: "Laser blasters, kinetic thuds, cyber chimes" },
    { id: "arcade", label: "8-Bit Arcade", icon: "🕹️", desc: "Retro chiptune, 1-up coins, jump hits" },
    { id: "zen", label: "Zen Bells", icon: "🔔", desc: "Singing bowls, crystal dings, harmonic tones" },
    { id: "mechanical", label: "Mechanical", icon: "⚙️", desc: "Tactile switch clicks, camera shutters" },
  ];

  // Soundboard previews
  const soundboardItems = [
    { name: "Gun", label: "Gun", emoji: "👉", tag: "Laser Pew" },
    { name: "Fist", label: "Fist", emoji: "✊", tag: "Impact Thud" },
    { name: "Pinch", label: "Pinch", emoji: "🤏", tag: "Snap Click" },
    { name: "ThumbsUp", label: "Thumbs Up", emoji: "👍", tag: "Success Fanfare" },
    { name: "ThumbsDown", label: "Thumbs Down", emoji: "👎", tag: "Reject Buzz" },
    { name: "Peace", label: "Peace", emoji: "✌️", tag: "Dual Harmony" },
    { name: "RockOn", label: "Rock On", emoji: "🤘", tag: "Power Chord" },
    { name: "Pointing", label: "Pointing", emoji: "☝️", tag: "Sonar Blip" },
    { name: "OpenPalm", label: "Open Palm", emoji: "✋", tag: "Aura Sweep" },
    { name: "OK", label: "OK Sign", emoji: "👌", tag: "Crystal Ding" },
    { name: "CallMe", label: "Call Me", emoji: "🤙", tag: "Comm Chirp" },
    { name: "MiddleFinger", label: "Middle Finger", emoji: "🖕", tag: "Censor Bleep" },
    { name: "Whoosh", label: "Air Swipe", emoji: "💨", tag: "Motion Whoosh" },
  ];

  // Listen to engine triggers to flash visualizer bars
  useEffect(() => {
    const unsub = soundEffects.onSoundTrigger((gesture) => {
      setLastPlayedGesture(gesture);
      setIsPlayingVisual(true);
      const timer = setTimeout(() => {
        setIsPlayingVisual(false);
      }, 350);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  const handleTestSound = (gestureName: string) => {
    // If audio is muted in settings, turn it on so the user hears what they clicked
    if (!settings.soundEnabled) {
      onUpdateSettings({ soundEnabled: true });
      soundEffects.setEnabled(true);
    }
    if (gestureName === "Whoosh") {
      soundEffects.playMotionWhoosh(0.8);
    } else {
      soundEffects.playGestureSound(gestureName, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    onUpdateSettings({ soundVolume: vol });
    soundEffects.setVolume(vol);
  };

  const handleThemeSelect = (themeId: SoundTheme) => {
    onUpdateSettings({ soundTheme: themeId });
    soundEffects.setTheme(themeId);
    // Play a preview blip
    soundEffects.playGestureSound("Pointing", true);
  };

  const toggleSoundEnabled = () => {
    const next = !settings.soundEnabled;
    onUpdateSettings({ soundEnabled: next });
    soundEffects.setEnabled(next);
    if (next) {
      soundEffects.playGestureSound("Pointing", true);
    }
  };

  const toggleMotionWhoosh = () => {
    const next = !settings.motionWhoosh;
    onUpdateSettings({ motionWhoosh: next });
    if (next) {
      soundEffects.playMotionWhoosh(0.7);
    }
  };

  return (
    <div className="hud-card" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      {/* Header with Visualizer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              backgroundColor: settings.soundEnabled ? "rgba(0, 242, 254, 0.15)" : "rgba(100, 116, 139, 0.15)",
              border: `1px solid ${settings.soundEnabled ? "var(--cyan-glow)" : "var(--border-subtle)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: settings.soundEnabled ? "var(--cyan-glow)" : "var(--text-dim)",
              boxShadow: settings.soundEnabled ? "0 0 10px rgba(0, 242, 254, 0.25)" : "none",
            }}
          >
            {settings.soundEnabled ? (
              <Volume2 style={{ width: "16px", height: "16px" }} />
            ) : (
              <VolumeX style={{ width: "16px", height: "16px" }} />
            )}
          </div>
          <div>
            <h3
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              Sound FX Engine
              {settings.soundEnabled && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "var(--emerald-bright)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                  }}
                >
                  LIVE
                </span>
              )}
            </h3>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Interactive procedural audio for hand gestures & motions
            </p>
          </div>
        </div>

        {/* Dynamic Mini Waveform Equalizer Bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "3px",
            height: "20px",
            padding: "2px 6px",
            background: "rgba(11, 15, 25, 0.7)",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)",
          }}
          title={lastPlayedGesture ? `Last Sound: ${lastPlayedGesture}` : "Audio Visualizer"}
        >
          {[1, 2, 3, 4, 5].map((bar) => {
            const heights = isPlayingVisual
              ? [16, 12, 18, 14, 10]
              : [4, 6, 4, 7, 4];
            return (
              <span
                key={bar}
                style={{
                  width: "3px",
                  height: `${heights[bar - 1]}px`,
                  backgroundColor: isPlayingVisual ? "var(--cyan-glow)" : "rgba(56, 189, 248, 0.3)",
                  borderRadius: "2px",
                  transition: "height 0.12s ease, background-color 0.15s ease",
                  boxShadow: isPlayingVisual ? "0 0 6px var(--cyan-glow)" : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Main Master Controls (Power Toggle & Volume) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.3fr",
          gap: "0.75rem",
          alignItems: "center",
          background: "rgba(11, 15, 25, 0.5)",
          padding: "0.75rem",
          borderRadius: "0.85rem",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Master Audio Toggle */}
        <button
          onClick={toggleSoundEnabled}
          className={`toggle-btn ${settings.soundEnabled ? "active" : ""}`}
          style={{ justifyContent: "center" }}
        >
          {settings.soundEnabled ? (
            <>
              <Radio style={{ width: "13px", height: "13px", color: "var(--cyan-glow)" }} />
              <span>FX Enabled</span>
            </>
          ) : (
            <>
              <VolumeX style={{ width: "13px", height: "13px" }} />
              <span>FX Muted</span>
            </>
          )}
        </button>

        {/* Master Volume Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Sliders style={{ width: "11px", height: "11px" }} /> Volume
            </span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan-glow)", fontWeight: 600 }}>
              {Math.round(settings.soundVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundVolume}
            onChange={handleVolumeChange}
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
      </div>

      {/* Soundbank Presets */}
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
            <Sparkles style={{ width: "12px", height: "12px", color: "var(--cyan-glow)" }} />
            Sound Theme Preset
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", textTransform: "capitalize" }}>
            Active: {settings.soundTheme}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
          {soundThemes.map((st) => {
            const isSelected = settings.soundTheme === st.id;
            return (
              <button
                key={st.id}
                onClick={() => handleThemeSelect(st.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "0.75rem",
                  backgroundColor: isSelected ? "rgba(0, 242, 254, 0.12)" : "rgba(15, 23, 42, 0.5)",
                  border: `1px solid ${isSelected ? "var(--cyan-glow)" : "var(--border-subtle)"}`,
                  color: isSelected ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 0 10px rgba(0, 242, 254, 0.2)" : "none",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{st.icon}</span>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {st.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Motion Air-Whoosh Action Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.55rem 0.75rem",
          background: "rgba(11, 15, 25, 0.4)",
          borderRadius: "0.75rem",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Wind style={{ width: "15px", height: "15px", color: settings.motionWhoosh ? "var(--cyan-glow)" : "var(--text-dim)" }} />
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-main)" }}>
              Motion Swipe Air-Whoosh
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-dim)" }}>
              Play whoosh audio when moving hand rapidly across screen
            </div>
          </div>
        </div>
        <button
          onClick={toggleMotionWhoosh}
          className={`toggle-btn ${settings.motionWhoosh ? "active" : ""}`}
          style={{ padding: "0.3rem 0.7rem", fontSize: "0.72rem" }}
        >
          {settings.motionWhoosh ? "ON" : "OFF"}
        </button>
      </div>

      {/* Interactive Soundboard & Live Action Audio Tester */}
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
            <Play style={{ width: "12px", height: "12px", color: "var(--cyan-glow)" }} />
            Action FX Soundboard (Click to Test)
          </span>
          {activeGestureName && (
            <span style={{ fontSize: "0.65rem", color: "var(--cyan-glow)", fontFamily: "var(--font-mono)" }}>
              Active Hand: {activeGestureName}
            </span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.4rem",
            maxHeight: "200px",
            overflowY: "auto",
            paddingRight: "2px",
          }}
        >
          {soundboardItems.map((item) => {
            const isCurrentlyActive = activeGestureName === item.name || lastPlayedGesture === item.name;
            const hasCustom = soundEffects.hasCustomAudio(item.name);
            return (
              <button
                key={item.name}
                onClick={() => handleTestSound(item.name)}
                title={`Click to test ${item.tag} FX ${hasCustom ? "(Custom File Loaded)" : ""}`}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.45rem 0.2rem",
                  borderRadius: "0.6rem",
                  backgroundColor: isCurrentlyActive
                    ? "rgba(0, 242, 254, 0.22)"
                    : "rgba(15, 23, 42, 0.6)",
                  border: `1px solid ${
                    hasCustom
                      ? "var(--purple-bright)"
                      : isCurrentlyActive
                      ? "var(--cyan-glow)"
                      : "rgba(56, 189, 248, 0.15)"
                  }`,
                  color: isCurrentlyActive ? "#ffffff" : "var(--text-main)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  transform: isCurrentlyActive ? "scale(1.03)" : "none",
                  boxShadow: isCurrentlyActive ? "0 0 10px rgba(0, 242, 254, 0.3)" : "none",
                }}
              >
                {hasCustom && (
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "3px",
                      fontSize: "0.55rem",
                      color: "var(--purple-bright)",
                    }}
                    title="Custom Audio File"
                  >
                    🎵
                  </span>
                )}
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{item.emoji}</span>
                <span
                  style={{
                    fontSize: "0.64rem",
                    fontWeight: 600,
                    marginTop: "0.25rem",
                    color: isCurrentlyActive ? "var(--cyan-glow)" : "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "0.52rem",
                    color: hasCustom ? "var(--purple-bright)" : "var(--text-dim)",
                    lineHeight: 1,
                    marginTop: "2px",
                    fontWeight: hasCustom ? 700 : 400,
                  }}
                >
                  {hasCustom ? "CUSTOM" : item.tag.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Audio Uploader Section */}
      <div
        style={{
          background: "rgba(11, 15, 25, 0.6)",
          padding: "0.75rem",
          borderRadius: "0.85rem",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.74rem", fontWeight: 700, color: "var(--text-main)" }}>
            <Music style={{ width: "13px", height: "13px", color: "var(--purple-bright)" }} />
            <span>Custom Audio File Mapper</span>
          </div>
          <span style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>
            MP3 / WAV / OGG
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Action Selector */}
          <select
            value={targetGesture}
            onChange={(e) => setTargetGesture(e.target.value)}
            style={{
              flex: 1,
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "0.5rem",
              padding: "0.4rem 0.6rem",
              color: "var(--text-main)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            {soundboardItems.map((item) => (
              <option key={item.name} value={item.name}>
                {item.emoji} {item.label} {soundEffects.hasCustomAudio(item.name) ? "★ [Custom Loaded]" : ""}
              </option>
            ))}
          </select>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const ok = await soundEffects.loadCustomAudioFromFile(targetGesture, file);
              if (ok) {
                soundEffects.playGestureSound(targetGesture, true);
                setCustomVersion((v) => v + 1);
              }
              // Reset input
              e.target.value = "";
            }}
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hud-btn hud-btn-primary"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.72rem", flexShrink: 0 }}
            title="Upload audio clip from computer"
          >
            <Upload style={{ width: "12px", height: "12px" }} />
            <span>Upload</span>
          </button>

          {/* Remove custom audio button (if present) */}
          {soundEffects.hasCustomAudio(targetGesture) && (
            <button
              onClick={() => {
                soundEffects.removeCustomAudio(targetGesture);
                setCustomVersion((v) => v + 1);
              }}
              className="hud-btn"
              style={{
                padding: "0.4rem 0.55rem",
                color: "var(--rose-bright)",
                borderColor: "rgba(244, 63, 94, 0.3)",
              }}
              title="Reset to procedural synth sound"
            >
              <Trash2 style={{ width: "12px", height: "12px" }} />
            </button>
          )}
        </div>

        {/* Current status info */}
        <div style={{ fontSize: "0.66rem", color: "var(--text-dim)", display: "flex", justifyContent: "space-between" }}>
          <span>
            {soundEffects.hasCustomAudio(targetGesture) ? (
              <span style={{ color: "var(--purple-bright)", fontWeight: 600 }}>
                🎵 Using: {soundEffects.getCustomAudioName(targetGesture)}
              </span>
            ) : (
              <span>Using built-in procedural synthesizer</span>
            )}
          </span>
          <span style={{ fontStyle: "italic" }}>
            Or drop in <code style={{ color: "var(--cyan-glow)" }}>public/sounds/</code>
          </span>
        </div>
      </div>
    </div>
  );
};
