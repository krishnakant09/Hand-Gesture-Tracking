import { describe, it, expect } from "vitest";
import type { TrackedHand, NormalizedLandmark } from "../../types";
import {
  createDrawingState,
  updateAirDrawing,
  clearDrawing,
  detectShape,
  SMOOTHING_ALPHA,
  type DrawingSettings,
  type Point,
} from "../airDrawing";

// --- Test helpers -----------------------------------------------------------

type CtxCall =
  | { op: "save" | "restore" | "beginPath" | "stroke" | "fill" }
  | { op: "moveTo"; x: number; y: number }
  | { op: "lineTo"; x: number; y: number }
  | { op: "arc"; x: number; y: number; r: number }
  | { op: "clearRect"; x: number; y: number; w: number; h: number };

interface MockCtx {
  ctx: CanvasRenderingContext2D;
  calls: CtxCall[];
}

function createMockCtx(): MockCtx {
  const calls: CtxCall[] = [];
  const ctx = {
    save: () => calls.push({ op: "save" }),
    restore: () => calls.push({ op: "restore" }),
    beginPath: () => calls.push({ op: "beginPath" }),
    moveTo: (x: number, y: number) => calls.push({ op: "moveTo", x, y }),
    lineTo: (x: number, y: number) => calls.push({ op: "lineTo", x, y }),
    stroke: () => calls.push({ op: "stroke" }),
    fill: () => calls.push({ op: "fill" }),
    arc: (x: number, y: number, r: number) => calls.push({ op: "arc", x, y, r }),
    clearRect: (x: number, y: number, w: number, h: number) =>
      calls.push({ op: "clearRect", x, y, w, h }),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    lineCap: "",
    lineJoin: "",
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

function makeHand(gestureName: string, tipX: number, tipY: number): TrackedHand {
  const lms: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));
  lms[8] = { x: tipX, y: tipY, z: 0 }; // index fingertip
  return {
    id: 0,
    handedness: "Right",
    score: 0.9,
    landmarks: lms,
    fingerStates: { thumb: false, index: true, middle: false, ring: false, pinky: false },
    gesture: { name: gestureName, label: gestureName, emoji: "", confidence: 0.9, description: "" },
    boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
  };
}

const W = 100;
const H = 100;

const settingsOn: DrawingSettings = {
  drawingEnabled: true,
  drawColor: "#00f2fe",
  brushSize: 4,
  mirror: false,
};

const settingsOff: DrawingSettings = { ...settingsOn, drawingEnabled: false };

// --- Tests ------------------------------------------------------------------

describe("airDrawing — updateAirDrawing", () => {
  it("draws a dot at the start of a new stroke (no connecting line)", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    updateAirDrawing(ctx, [makeHand("Pointing", 0.2, 0.3)], settingsOn, W, H, state);

    // A dot uses arc + fill, never lineTo
    expect(calls.some((c) => c.op === "arc")).toBe(true);
    expect(calls.some((c) => c.op === "fill")).toBe(true);
    expect(calls.some((c) => c.op === "lineTo")).toBe(false);
    expect(state.isPenDown).toBe(true);
    expect(state.prevPoint).toEqual({ x: 20, y: 30 });
  });

  it("draws a connecting segment between consecutive pointing frames", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    updateAirDrawing(ctx, [makeHand("Pointing", 0.2, 0.3)], settingsOn, W, H, state);
    updateAirDrawing(ctx, [makeHand("Pointing", 0.24, 0.32)], settingsOn, W, H, state);

    // Second frame should produce a line segment from the previous point to the
    // EMA-smoothed current point.
    const smoothedX = 20 * (1 - SMOOTHING_ALPHA) + 24 * SMOOTHING_ALPHA;
    const smoothedY = 30 * (1 - SMOOTHING_ALPHA) + 32 * SMOOTHING_ALPHA;

    expect(calls.some((c) => c.op === "moveTo" && c.x === 20 && c.y === 30)).toBe(true);
    expect(
      calls.some((c) => c.op === "lineTo" && c.x === smoothedX && c.y === smoothedY),
    ).toBe(true);
    expect(calls.some((c) => c.op === "stroke")).toBe(true);
  });

  it("lifts the pen on Fist and does NOT connect across the gap when resuming", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    updateAirDrawing(ctx, [makeHand("Pointing", 0.2, 0.3)], settingsOn, W, H, state);
    updateAirDrawing(ctx, [makeHand("Fist", 0.5, 0.5)], settingsOn, W, H, state); // pen up
    updateAirDrawing(ctx, [makeHand("Pointing", 0.7, 0.7)], settingsOn, W, H, state); // resume

    // Resuming should start a fresh stroke (dot), not a line from the old point.
    const lastDrawOps = calls.filter((c) => c.op === "lineTo" || c.op === "arc");
    expect(lastDrawOps.some((c) => c.op === "arc")).toBe(true);
    expect(lastDrawOps.some((c) => c.op === "lineTo")).toBe(false);
  });

  it("resets state when no hand is detected, so the next stroke starts fresh", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    updateAirDrawing(ctx, [makeHand("Pointing", 0.2, 0.3)], settingsOn, W, H, state);
    updateAirDrawing(ctx, [], settingsOn, W, H, state); // hand lost
    expect(state.prevPoint).toBeNull();
    expect(state.isPenDown).toBe(false);

    updateAirDrawing(ctx, [makeHand("Pointing", 0.8, 0.8)], settingsOn, W, H, state);
    // Should be a dot, not a line bridging to the old (0.2,0.3) point.
    expect(calls.some((c) => c.op === "lineTo")).toBe(false);
  });

  it("is a no-op when drawing is disabled", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    updateAirDrawing(ctx, [makeHand("Pointing", 0.2, 0.3)], settingsOff, W, H, state);

    expect(calls.length).toBe(0);
    expect(state.isPenDown).toBe(false);
    expect(state.prevPoint).toBeNull();
  });

  it("does not draw for non-pointing gestures", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    updateAirDrawing(ctx, [makeHand("OpenPalm", 0.2, 0.3)], settingsOn, W, H, state);

    expect(calls.some((c) => c.op === "stroke" || c.op === "fill")).toBe(false);
    expect(state.isPenDown).toBe(false);
  });
});

describe("airDrawing — clearDrawing", () => {
  it("clears the canvas and resets stroke state", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    updateAirDrawing(ctx, [makeHand("Pointing", 0.2, 0.3)], settingsOn, W, H, state);
    expect(state.prevPoint).not.toBeNull();

    clearDrawing(ctx, W, H, state);

    expect(calls.some((c) => c.op === "clearRect")).toBe(true);
    expect(state.prevPoint).toBeNull();
    expect(state.isPenDown).toBe(false);
  });
});

describe("airDrawing — Shape Auto-Assist (Smart Shapes)", () => {
  function generateCirclePoints(cx: number, cy: number, r: number, count = 24): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const jitter = (Math.sin(i * 3) - 0.5) * 1.5;
      points.push({
        x: cx + (r + jitter) * Math.cos(angle),
        y: cy + (r + jitter) * Math.sin(angle),
      });
    }
    points.push({ ...points[0] });
    return points;
  }

  function generateRectPoints(x: number, y: number, w: number, h: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= 6; i++) points.push({ x: x + (w * i) / 6, y });
    for (let i = 1; i <= 6; i++) points.push({ x: x + w, y: y + (h * i) / 6 });
    for (let i = 5; i >= 0; i--) points.push({ x: x + (w * i) / 6, y: y + h });
    for (let i = 5; i >= 0; i--) points.push({ x, y: y + (h * i) / 6 });
    return points;
  }

  function generateTrianglePoints(p1: Point, p2: Point, p3: Point): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= 6; i++) points.push({ x: p1.x + ((p2.x - p1.x) * i) / 6, y: p1.y + ((p2.y - p1.y) * i) / 6 });
    for (let i = 1; i <= 6; i++) points.push({ x: p2.x + ((p3.x - p2.x) * i) / 6, y: p2.y + ((p3.y - p2.y) * i) / 6 });
    for (let i = 1; i <= 6; i++) points.push({ x: p3.x + ((p1.x - p3.x) * i) / 6, y: p3.y + ((p1.y - p3.y) * i) / 6 });
    return points;
  }

  function generateLinePoints(x1: number, y1: number, x2: number, y2: number, count = 12): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
    return points;
  }

  it("detects a circular stroke as a Circle", () => {
    const circlePts = generateCirclePoints(150, 150, 50);
    const shape = detectShape(circlePts, "#00f2fe", 4);
    expect(shape).not.toBeNull();
    expect(shape?.type).toBe("circle");
    expect(shape?.label).toBe("Circle");
    expect(shape?.stroke.center).toBeDefined();
    expect(Math.abs((shape?.stroke.radius || 0) - 50)).toBeLessThan(5);
  });

  it("detects a rectangular stroke as a Rectangle", () => {
    const rectPts = generateRectPoints(100, 100, 80, 60);
    const shape = detectShape(rectPts, "#00f2fe", 4);
    expect(shape).not.toBeNull();
    expect(shape?.type).toBe("rectangle");
    expect(shape?.label).toBe("Rectangle");
    expect(shape?.stroke.rect?.width).toBe(80);
    expect(shape?.stroke.rect?.height).toBe(60);
  });

  it("detects a 3-corner closed polygon as a Triangle", () => {
    const triPts = generateTrianglePoints({ x: 100, y: 150 }, { x: 150, y: 50 }, { x: 200, y: 150 });
    const shape = detectShape(triPts, "#00f2fe", 4);
    expect(shape).not.toBeNull();
    expect(shape?.type).toBe("triangle");
    expect(shape?.label).toBe("Triangle");
    expect(shape?.stroke.triangle).toHaveLength(3);
  });

  it("detects a continuous linear stroke as a Straight Line", () => {
    const linePts = generateLinePoints(50, 50, 200, 200);
    const shape = detectShape(linePts, "#00f2fe", 4);
    expect(shape).not.toBeNull();
    expect(shape?.type).toBe("line");
    expect(shape?.label).toBe("Straight Line");
    expect(shape?.stroke.line?.start).toEqual({ x: 50, y: 50 });
    expect(shape?.stroke.line?.end).toEqual({ x: 200, y: 200 });
  });

  it("snaps a completed stroke on pen lift when shapeAssist is active", () => {
    const { ctx, calls } = createMockCtx();
    const state = createDrawingState();
    let detectedCallbackShape: string | null = null;

    // Simulate drawing points of a circle
    const circlePts = generateCirclePoints(50, 50, 25);
    for (const pt of circlePts) {
      updateAirDrawing(
        ctx,
        [makeHand("Pointing", pt.x / 100, pt.y / 100)],
        { ...settingsOn, shapeAssist: true },
        W,
        H,
        state,
        (detected) => {
          detectedCallbackShape = detected.label;
        },
      );
    }

    // Lift pen with Fist
    updateAirDrawing(
      ctx,
      [makeHand("Fist", 0.5, 0.5)],
      { ...settingsOn, shapeAssist: true },
      W,
      H,
      state,
      (detected) => {
        detectedCallbackShape = detected.label;
      },
    );

    expect(detectedCallbackShape).toBe("Circle");
    expect(state.strokes.length).toBe(1);
    expect(state.strokes[0].type).toBe("circle");
    // Canvas was redrawn with snapped stroke
    expect(calls.some((c) => c.op === "clearRect")).toBe(true);
  });

  it("preserves freehand stroke when shapeAssist is toggled off", () => {
    const { ctx } = createMockCtx();
    const state = createDrawingState();
    let detectedCallbackShape: string | null = null;

    const circlePts = generateCirclePoints(50, 50, 25);
    for (const pt of circlePts) {
      updateAirDrawing(
        ctx,
        [makeHand("Pointing", pt.x / 100, pt.y / 100)],
        { ...settingsOn, shapeAssist: false },
        W,
        H,
        state,
        (detected) => {
          detectedCallbackShape = detected.label;
        },
      );
    }

    // Lift pen with Fist
    updateAirDrawing(
      ctx,
      [makeHand("Fist", 0.5, 0.5)],
      { ...settingsOn, shapeAssist: false },
      W,
      H,
      state,
      (detected) => {
        detectedCallbackShape = detected.label;
      },
    );

    expect(detectedCallbackShape).toBeNull();
    expect(state.strokes.length).toBe(1);
    expect(state.strokes[0].type).toBe("freehand");
  });
});

