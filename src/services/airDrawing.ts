import type { TrackedHand } from "../types";

/**
 * Air-drawing engine with Shape Auto-Assist (Smart Shapes).
 *
 * Maintains stroke state across detection frames and renders onto a
 * persistent canvas. The pen is "down" while the primary hand is performing
 * `Pointing`. When the pen lifts (e.g. Fist or hand released), if `shapeAssist`
 * is enabled, the completed stroke is analyzed and snapped into clean geometric
 * shapes (Circle, Rectangle, Triangle, or Straight Line).
 */

export interface Point {
  x: number;
  y: number;
}

export type ShapeType = "freehand" | "circle" | "rectangle" | "triangle" | "line";

export interface DrawnStroke {
  type: ShapeType;
  color: string;
  brushSize: number;
  points?: Point[];
  center?: Point;
  radius?: number;
  rect?: { x: number; y: number; width: number; height: number };
  line?: { start: Point; end: Point };
  triangle?: [Point, Point, Point];
}

export interface DetectedShape {
  type: ShapeType;
  label: string;
  stroke: DrawnStroke;
}

export interface DrawingState {
  prevPoint: Point | null;
  isPenDown: boolean;
  currentStrokePoints: Point[];
  strokes: DrawnStroke[];
  lastDetectedShape: string | null;
}

export interface DrawingSettings {
  drawingEnabled: boolean;
  drawColor: string;
  brushSize: number;
  mirror: boolean;
  shapeAssist?: boolean;
}

/** Exponential moving-average factor for fingertip smoothing (0 = frozen, 1 = raw). */
export const SMOOTHING_ALPHA = 0.5;

export function createDrawingState(): DrawingState {
  return {
    prevPoint: null,
    isPenDown: false,
    currentStrokePoints: [],
    strokes: [],
    lastDetectedShape: null,
  };
}

/**
 * Map the primary hand's index fingertip (landmark 8) to canvas pixels.
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

/** Distance helper */
function dist(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/** Perpendicular distance from point p to line segment (a, b) */
function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const mag = Math.hypot(dx, dy);
  if (mag === 0) return dist(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / mag;
}

/**
 * Ramer-Douglas-Peucker (RDP) polyline simplification algorithm.
 */
export function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = ramerDouglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = ramerDouglasPeucker(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

/**
 * Shoelace formula to compute polygon area.
 */
export function shoelaceArea(points: Point[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Shape Auto-Assist detection algorithm.
 * Evaluates path geometry, closure, radial variance, and vertex distribution.
 */
export function detectShape(
  points: Point[],
  color: string,
  brushSize: number,
): DetectedShape | null {
  if (points.length < 8) return null;

  // Calculate total path length
  let pathLen = 0;
  for (let i = 1; i < points.length; i++) {
    pathLen += dist(points[i - 1], points[i]);
  }
  if (pathLen < 30) return null;

  const startPt = points[0];
  const endPt = points[points.length - 1];
  const endpointDist = dist(startPt, endPt);

  // Bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  if (Math.max(width, height) < 18) return null;
  const diag = Math.hypot(width, height);
  const bboxArea = width * height;

  // 1. STRAIGHT LINE DETECTION
  // Ratio of direct endpoint distance to total length
  const directness = endpointDist / pathLen;
  if (directness > 0.88 && pathLen >= 35) {
    return {
      type: "line",
      label: "Straight Line",
      stroke: {
        type: "line",
        color,
        brushSize,
        line: { start: startPt, end: endPt },
      },
    };
  }

  // Check closure for polygons/circles
  const isClosed =
    endpointDist / pathLen < 0.28 ||
    endpointDist < 0.35 * Math.max(width, height);

  if (!isClosed) {
    return null;
  }

  // Centroid
  const n = points.length;
  const cx = sumX / n;
  const cy = sumY / n;
  const center: Point = { x: cx, y: cy };

  // Calculate radial distances from centroid
  let sumR = 0;
  const radii: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const r = dist(points[i], center);
    radii[i] = r;
    sumR += r;
  }
  const meanR = sumR / n;

  let sumVar = 0;
  for (let i = 0; i < n; i++) {
    const diff = radii[i] - meanR;
    sumVar += diff * diff;
  }
  const stdR = Math.sqrt(sumVar / n);
  const radialVarRatio = stdR / (meanR || 1);
  const aspect = width / (height || 1);

  // 2. POLYGON & CIRCLE ANALYSIS
  const closedPts = [...points, startPt];
  const simplified = ramerDouglasPeucker(closedPts, 0.08 * diag);
  const corners = simplified.slice(0, -1);

  // A. Triangle: 3 dominant vertices
  if (corners.length === 3) {
    const [p1, p2, p3] = corners;
    const a1 = dist(p1, p2);
    const a2 = dist(p2, p3);
    const a3 = dist(p3, p1);
    if (Math.min(a1, a2, a3) > 15) {
      return {
        type: "triangle",
        label: "Triangle",
        stroke: {
          type: "triangle",
          color,
          brushSize,
          triangle: [p1, p2, p3],
        },
      };
    }
  }

  // B. Rectangle: 4 dominant corners and high bounding-box fill ratio
  const polyArea = shoelaceArea(points);
  const fillRatio = bboxArea > 0 ? polyArea / bboxArea : 0;
  const perimeter = 2 * (width + height);
  const perimeterRatio = perimeter > 0 ? pathLen / perimeter : 0;

  if (
    (corners.length === 4 || (fillRatio >= 0.72 && perimeterRatio >= 0.75 && perimeterRatio <= 1.35)) &&
    radialVarRatio >= 0.12
  ) {
    return {
      type: "rectangle",
      label: "Rectangle",
      stroke: {
        type: "rectangle",
        color,
        brushSize,
        rect: { x: minX, y: minY, width, height },
      },
    };
  }

  // C. Circle: Low radial variance from centroid and balanced aspect ratio
  if (radialVarRatio < 0.13 && aspect >= 0.65 && aspect <= 1.55 && meanR >= 12) {
    return {
      type: "circle",
      label: "Circle",
      stroke: {
        type: "circle",
        color,
        brushSize,
        center,
        radius: Math.round(meanR),
      },
    };
  }

  return null;
}

/**
 * Render an individual stroke item onto a canvas context.
 */
export function renderStroke(ctx: CanvasRenderingContext2D, stroke: DrawnStroke): void {
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (stroke.type === "circle" && stroke.center && stroke.radius) {
    ctx.beginPath();
    ctx.arc(stroke.center.x, stroke.center.y, stroke.radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stroke.type === "rectangle" && stroke.rect) {
    ctx.beginPath();
    ctx.strokeRect(stroke.rect.x, stroke.rect.y, stroke.rect.width, stroke.rect.height);
  } else if (stroke.type === "line" && stroke.line) {
    ctx.beginPath();
    ctx.moveTo(stroke.line.start.x, stroke.line.start.y);
    ctx.lineTo(stroke.line.end.x, stroke.line.end.y);
    ctx.stroke();
  } else if (stroke.type === "triangle" && stroke.triangle) {
    const [p1, p2, p3] = stroke.triangle;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.stroke();
  } else if (stroke.points && stroke.points.length > 0) {
    const pts = stroke.points;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, stroke.brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Clear canvas and redraw all stored strokes cleanly.
 */
export function redrawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: DrawnStroke[],
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of strokes) {
    renderStroke(ctx, stroke);
  }
}

/**
 * Finalize the current active stroke:
 * Runs shape detection if enabled and snaps the stroke if recognized.
 */
export function finalizeCurrentStroke(
  ctx: CanvasRenderingContext2D,
  settings: DrawingSettings,
  width: number,
  height: number,
  state: DrawingState,
  onShapeDetected?: (shape: DetectedShape) => void,
): void {
  if (!state.isPenDown || !state.currentStrokePoints || state.currentStrokePoints.length === 0) {
    state.isPenDown = false;
    state.prevPoint = null;
    return;
  }

  const rawPts = state.currentStrokePoints;
  let finalStroke: DrawnStroke = {
    type: "freehand",
    points: rawPts,
    color: settings.drawColor,
    brushSize: settings.brushSize,
  };

  const useShapeAssist = settings.shapeAssist !== false;

  if (useShapeAssist && rawPts.length >= 8) {
    const detected = detectShape(rawPts, settings.drawColor, settings.brushSize);
    if (detected) {
      finalStroke = detected.stroke;
      state.lastDetectedShape = detected.label;
      onShapeDetected?.(detected);
    }
  }

  if (!state.strokes) {
    state.strokes = [];
  }
  state.strokes.push(finalStroke);

  // If a shape was recognized, clear the rough sketch and redraw cleanly with the snapped shape
  if (finalStroke.type !== "freehand") {
    redrawAllStrokes(ctx, state.strokes, width, height);
  }

  state.currentStrokePoints = [];
  state.prevPoint = null;
  state.isPenDown = false;
}

/**
 * Advance one detection frame:
 * Draws incrementally when pen is down; finalizes stroke when pen lifts.
 */
export function updateAirDrawing(
  ctx: CanvasRenderingContext2D,
  hands: TrackedHand[],
  settings: DrawingSettings,
  width: number,
  height: number,
  state: DrawingState,
  onShapeDetected?: (shape: DetectedShape) => void,
): void {
  if (!settings.drawingEnabled) return;

  // Initialize arrays if missing
  if (!state.currentStrokePoints) state.currentStrokePoints = [];
  if (!state.strokes) state.strokes = [];

  // No hand visible: lift pen and finalize stroke
  if (!hands || hands.length === 0) {
    if (state.isPenDown) {
      finalizeCurrentStroke(ctx, settings, width, height, state, onShapeDetected);
    } else {
      state.prevPoint = null;
    }
    return;
  }

  const point = getDrawingPoint(hands[0], width, height, settings.mirror);
  if (!point) {
    if (state.isPenDown) {
      finalizeCurrentStroke(ctx, settings, width, height, state, onShapeDetected);
    } else {
      state.prevPoint = null;
    }
    return;
  }

  // Pen is only down while Pointing
  if (hands[0].gesture?.name !== "Pointing") {
    if (state.isPenDown) {
      finalizeCurrentStroke(ctx, settings, width, height, state, onShapeDetected);
    } else {
      state.prevPoint = null;
    }
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
    // Continue stroke
    ctx.beginPath();
    ctx.moveTo(state.prevPoint.x, state.prevPoint.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    state.currentStrokePoints.push(cur);
  } else {
    // Start of new stroke
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, settings.brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    state.currentStrokePoints = [cur];
  }
  ctx.restore();

  state.prevPoint = cur;
  state.isPenDown = true;
}

/** Wipe the persistent drawing canvas and reset all stroke history. */
export function clearDrawing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: DrawingState,
): void {
  ctx.clearRect(0, 0, width, height);
  state.prevPoint = null;
  state.isPenDown = false;
  state.currentStrokePoints = [];
  state.strokes = [];
  state.lastDetectedShape = null;
}
