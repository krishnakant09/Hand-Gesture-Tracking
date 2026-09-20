import type { TrackedHand, AppSettings, ThemeColors, ThemeName } from "../types";

export const THEME_PALETTES: Record<ThemeName, ThemeColors> = {
  cyber: {
    primary: "#00f2fe",
    primaryGlow: "rgba(0, 242, 254, 0.8)",
    secondary: "#4facfe",
    secondaryGlow: "rgba(79, 172, 254, 0.6)",
    joints: "#ffffff",
    accent: "#ff007f",
    text: "#e0f2fe",
  },
  emerald: {
    primary: "#10b981",
    primaryGlow: "rgba(16, 185, 129, 0.8)",
    secondary: "#06b6d4",
    secondaryGlow: "rgba(6, 182, 212, 0.6)",
    joints: "#ffffff",
    accent: "#f59e0b",
    text: "#ecfdf5",
  },
  sunset: {
    primary: "#ff5e62",
    primaryGlow: "rgba(255, 94, 98, 0.8)",
    secondary: "#ff9966",
    secondaryGlow: "rgba(255, 153, 102, 0.6)",
    joints: "#ffffff",
    accent: "#c084fc",
    text: "#fff1f2",
  },
  matrix: {
    primary: "#00ff66",
    primaryGlow: "rgba(0, 255, 102, 0.85)",
    secondary: "#00cc55",
    secondaryGlow: "rgba(0, 204, 85, 0.6)",
    joints: "#ffffff",
    accent: "#38bdf8",
    text: "#f0fdf4",
  },
};

// Hand skeletal connections
const SKELETON_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm bridges
  [5, 9], [9, 13], [13, 17],
];

const FINGERTIPS = [4, 8, 12, 16, 20];
const PALM_POLYGON = [0, 1, 2, 5, 9, 13, 17];

export function drawHandOverlay(
  ctx: CanvasRenderingContext2D,
  hands: TrackedHand[],
  width: number,
  height: number,
  settings: AppSettings
) {
  ctx.clearRect(0, 0, width, height);

  if (!hands || hands.length === 0) return;

  const theme = THEME_PALETTES[settings.theme] || THEME_PALETTES.cyber;

  hands.forEach((hand) => {
    const lms = hand.landmarks;
    if (!lms || lms.length < 21) return;

    // Convert normalized landmarks to canvas pixel points
    const points = lms.map((lm) => {
      const px = settings.mirror ? (1 - lm.x) * width : lm.x * width;
      const py = lm.y * height;
      return { x: px, y: py, z: lm.z };
    });

    // 1. Draw subtle holographic palm mesh fill
    if (settings.showSkeleton) {
      ctx.save();
      ctx.beginPath();
      const first = points[PALM_POLYGON[0]];
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < PALM_POLYGON.length; i++) {
        const pt = points[PALM_POLYGON[i]];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fillStyle = theme.primaryGlow.replace("0.8", "0.08");
      ctx.fill();
      ctx.restore();
    }

    // 2. Draw Skeletal Connections
    if (settings.showSkeleton) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (settings.showGlow) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.primaryGlow;
      }

      SKELETON_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = points[startIdx];
        const p2 = points[endIdx];

        // Finger bone gradient
        const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, theme.secondary);
        grad.addColorStop(1, theme.primary);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });
      ctx.restore();
    }

    // 3. Draw Joint Nodes
    if (settings.showJoints) {
      ctx.save();
      points.forEach((pt, idx) => {
        const isFingertip = FINGERTIPS.includes(idx);
        const radius = isFingertip ? 6 : 4;

        if (settings.showGlow) {
          ctx.shadowBlur = isFingertip ? 16 : 8;
          ctx.shadowColor = isFingertip ? theme.accent : theme.primaryGlow;
        }

        // Outer halo
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = isFingertip ? theme.accent : theme.primary;
        ctx.fill();

        // Bright inner core
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius - 1, 0, Math.PI * 2);
        ctx.fillStyle = theme.joints;
        ctx.fill();

        // Landmark index numbers (if enabled)
        if (settings.showLandmarkIndices) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px 'JetBrains Mono', monospace";
          ctx.fillText(idx.toString(), pt.x + 7, pt.y - 4);
        }
      });
      ctx.restore();
    }

    // 4. Draw Sci-Fi Bounding Reticle
    if (settings.showBoundingBox) {
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.max(8, Math.min(...xs) - 25);
      const maxX = Math.min(width - 8, Math.max(...xs) + 25);
      const minY = Math.max(8, Math.min(...ys) - 30);
      const maxY = Math.min(height - 8, Math.max(...ys) + 25);
      const boxW = maxX - minX;
      const boxH = maxY - minY;
      const corner = Math.min(20, boxW * 0.2, boxH * 0.2);

      ctx.save();
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 2;
      if (settings.showGlow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.primaryGlow;
      }

      // Corner brackets (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
      ctx.beginPath();
      // TL
      ctx.moveTo(minX, minY + corner);
      ctx.lineTo(minX, minY);
      ctx.lineTo(minX + corner, minY);
      // TR
      ctx.moveTo(maxX - corner, minY);
      ctx.lineTo(maxX, minY);
      ctx.lineTo(maxX, minY + corner);
      // BR
      ctx.moveTo(maxX, maxY - corner);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(maxX - corner, maxY);
      // BL
      ctx.moveTo(minX + corner, maxY);
      ctx.lineTo(minX, maxY);
      ctx.lineTo(minX, maxY - corner);
      ctx.stroke();

      // Top corner label
      ctx.fillStyle = theme.primary;
      ctx.font = "600 11px system-ui, -apple-system, sans-serif";
      const tag = `${hand.handedness.toUpperCase()} [${Math.round(hand.score * 100)}%]`;
      ctx.fillText(tag, minX + 6, minY - 8);

      ctx.restore();
    }

    // 5. Floating Gesture Badge near Wrist / Hand
    if (settings.showGestureBadgeOnCanvas) {
      const wrist = points[0];
      const badgeX = Math.min(Math.max(wrist.x, 80), width - 110);
      const badgeY = Math.min(wrist.y + 42, height - 20);

      ctx.save();
      const badgeText = `${hand.gesture.emoji} ${hand.gesture.label}`;
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      const textMetrics = ctx.measureText(badgeText);
      const badgeW = textMetrics.width + 24;
      const badgeH = 28;

      const rx = badgeX - badgeW / 2;
      const ry = badgeY - badgeH / 2;

      // Dark glass background
      ctx.fillStyle = "rgba(10, 15, 29, 0.85)";
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 1.5;
      if (settings.showGlow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = theme.primaryGlow;
      }

      ctx.beginPath();
      ctx.roundRect(rx, ry, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      // Gesture label text
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, badgeX, badgeY);
      ctx.restore();
    }
  });
}
