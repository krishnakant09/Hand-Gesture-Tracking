import type { TrackedHand } from "../types";

/**
 * Air-drawing engine.
 *
 * Maintains lightweight stroke state across detection frames and renders onto a
 * PERSISTENT canvas (never cleared per-frame) so drawn strokes remain visible at
 * near-zero cost. The pen is "down" only while the primary hand is performing the
 * `Pointing` gesture; any other gesture (e.g. Fist) lifts the pen so the next
 * stroke starts fresh without bridging across the gap.
 */

export interface Point {
  x: number;
  y: number;
}

export interface DrawingState {
  prevPoint: Point | null;
  isPenDown: boolean;
}

export interface DrawingSettings {
  drawingEnabled: boolean;
  drawColor: string;
  brushSize: number;
  mirror: boolean;
}

/** Exponential moving-average factor for fingertip smoothing (0 = frozen, 1 = raw). */
export const SMOOTHING_ALPHA = 0.5;

export function createDrawingState(): DrawingState {
  return { prevPoint: null, isPenDown: false };
}

/**
 * Map the primary hand's index fingertip (landmark 8) to canvas pixels,
 * applying the same mirror convention used by the skeletal overlay.
 */
export function getDrawingPoint(
  hand: TrackedHand,
  width: number,
  height: number,
  mirror: boolean,
): Point | null {
  const lms = hand?.landmarks;
  if (!lms || lms.length < 9) return null;
  const tip = lms[8];
  const x = mirror ? (1 - tip.x) * width : tip.x * width;
  const y = tip.y * height;
  return { x, y };
}

function smooth(raw: Point, state: DrawingState): Point {
  if (!state.prevPoint) return raw;
  const a = SMOOTHING_ALPHA;
  return {
    x: state.prevPoint.x * (1 - a) + raw.x * a,
    y: state.prevPoint.y * (1 - a) + raw.y * a,
  };
}

/**
 * Advance one detection frame: draw a new segment/dot onto `ctx` when the pen is
 * down, or lift the pen otherwise. Mutates `state` in place.
 */
export function updateAirDrawing(
  ctx: CanvasRenderingContext2D,
  hands: TrackedHand[],
  settings: DrawingSettings,
  width: number,
  height: number,
  state: DrawingState,
): void {
  if (!settings.drawingEnabled) return;

  // No hand visible: lift the pen and forget the last point.
  if (!hands || hands.length === 0) {
    state.isPenDown = false;
    state.prevPoint = null;
    return;
  }

  const point = getDrawingPoint(hands[0], width, height, settings.mirror);
  if (!point) {
    state.isPenDown = false;
    state.prevPoint = null;
    return;
  }

  // Pen is only down while pointing.
  if (hands[0].gesture?.name !== "Pointing") {
    state.isPenDown = false;
    state.prevPoint = null;
    return;
  }

  const cur = smooth(point, state);

  ctx.save();
  ctx.strokeStyle = settings.drawColor;
  ctx.fillStyle = settings.drawColor;
  ctx.lineWidth = settings.brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (state.prevPoint && state.isPenDown) {
    // Continue an existing stroke.
    ctx.beginPath();
    ctx.moveTo(state.prevPoint.x, state.prevPoint.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
  } else {
    // Start of a new stroke: stamp a dot so single taps are visible.
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, settings.brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  state.prevPoint = cur;
  state.isPenDown = true;
}

/** Wipe the persistent drawing canvas and reset stroke state (Clear button). */
export function clearDrawing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: DrawingState,
): void {
  ctx.clearRect(0, 0, width, height);
  state.prevPoint = null;
  state.isPenDown = false;
}
