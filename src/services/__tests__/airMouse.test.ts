import { describe, it, expect, vi } from "vitest";
import type { TrackedHand, NormalizedLandmark } from "../../types";
import {
  createAirMouseState,
  calculatePinchDistance,
  isPointInsideRect,
  updateAirMouse,
  PINCH_CLICK_THRESHOLD,
  type HologramButtonDef,
} from "../airMouse";

function makeHandWithFingers(thumb: { x: number; y: number; z?: number }, index: { x: number; y: number; z?: number }): TrackedHand {
  const lms: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  lms[4] = { x: thumb.x, y: thumb.y, z: thumb.z || 0 }; // Thumb tip
  lms[8] = { x: index.x, y: index.y, z: index.z || 0 }; // Index tip
  return {
    id: 0,
    handedness: "Right",
    score: 0.95,
    landmarks: lms,
    fingerStates: { thumb: true, index: true, middle: false, ring: false, pinky: false },
    gesture: { name: "Pinch", label: "Pinch", emoji: "🤏", confidence: 0.9, description: "" },
    boundingBox: { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 },
  };
}

describe("airMouse — calculatePinchDistance & isPointInsideRect", () => {
  it("computes accurate 3D distance between thumb and index tip", () => {
    const hand = makeHandWithFingers({ x: 0.5, y: 0.5, z: 0 }, { x: 0.53, y: 0.54, z: 0 });
    const dist = calculatePinchDistance(hand);
    expect(dist).toBeCloseTo(0.05, 2);
    expect(dist).toBeLessThan(PINCH_CLICK_THRESHOLD);
  });

  it("returns large distance when fingers are spread apart", () => {
    const hand = makeHandWithFingers({ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.8 });
    const dist = calculatePinchDistance(hand);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeGreaterThan(PINCH_CLICK_THRESHOLD);
  });

  it("checks bounding box collision correctly", () => {
    expect(isPointInsideRect(0.5, 0.5, 0.4, 0.4, 0.2, 0.2)).toBe(true);
    expect(isPointInsideRect(0.2, 0.2, 0.4, 0.4, 0.2, 0.2)).toBe(false);
    expect(isPointInsideRect(0.4, 0.4, 0.4, 0.4, 0.2, 0.2)).toBe(true);
  });
});

describe("airMouse — updateAirMouse", () => {
  const testButtons: HologramButtonDef[] = [
    {
      id: "btn-test",
      label: "TEST",
      icon: "Sparkles",
      x: 0.4,
      y: 0.4,
      width: 0.2,
      height: 0.2,
    },
  ];

  it("tracks cursor position from index fingertip with EMA smoothing", () => {
    const state = createAirMouseState();
    const hand = makeHandWithFingers({ x: 0.8, y: 0.8 }, { x: 0.6, y: 0.4 });

    updateAirMouse([hand], state, 1000, 500, false, testButtons, 1000);

    expect(state.cursor).not.toBeNull();
    expect(state.cursor?.x).toBeCloseTo(0.535, 2);
    expect(state.cursor?.y).toBeCloseTo(0.465, 2);
    expect(state.cursor?.screenX).toBeCloseTo(535, 0);
    expect(state.cursor?.screenY).toBeCloseTo(232, 0);
  });

  it("detects pinch click on free canvas when fingers touch", () => {
    const state = createAirMouseState();
    const onFreeClick = vi.fn();
    // Pinch outside of testButtons (at x=0.1, y=0.1)
    const hand = makeHandWithFingers({ x: 0.1, y: 0.1 }, { x: 0.12, y: 0.12 });

    updateAirMouse([hand], state, 1000, 500, false, testButtons, 1000, undefined, onFreeClick);

    expect(state.isPinching).toBe(true);
    expect(onFreeClick).toHaveBeenCalledTimes(1);
  });

  it("advances dwell progress when hovering over spatial button and triggers at threshold", () => {
    const state = createAirMouseState();
    const onButtonClick = vi.fn();
    // Position fingertip inside testButtons (at x=0.5, y=0.5)
    const hand = makeHandWithFingers({ x: 0.8, y: 0.8 }, { x: 0.5, y: 0.5 });

    // Frame 1 at t=0
    updateAirMouse([hand], state, 1000, 500, false, testButtons, 0, onButtonClick);
    expect(state.hoveredButtonId).toBe("btn-test");
    expect(state.dwellProgress).toBe(0);

    // Frame 2 at t=300 (halfway)
    updateAirMouse([hand], state, 1000, 500, false, testButtons, 300, onButtonClick);
    expect(state.dwellProgress).toBeCloseTo(0.5, 1);
    expect(onButtonClick).not.toHaveBeenCalled();

    // Frame 3 at t=650 (dwell complete)
    updateAirMouse([hand], state, 1000, 500, false, testButtons, 650, onButtonClick);
    expect(onButtonClick).toHaveBeenCalledWith("btn-test");
  });

  it("triggers instant button click when user pinches while hovering", () => {
    const state = createAirMouseState();
    const onButtonClick = vi.fn();
    // Hovering inside button with pinch active
    const hand = makeHandWithFingers({ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.51 });

    updateAirMouse([hand], state, 1000, 500, false, testButtons, 100, onButtonClick);

    expect(state.hoveredButtonId).toBe("btn-test");
    expect(onButtonClick).toHaveBeenCalledWith("btn-test");
  });

  it("clears cursor state when hand is removed", () => {
    const state = createAirMouseState();
    const hand = makeHandWithFingers({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 });
    updateAirMouse([hand], state, 1000, 500, false, testButtons, 100);
    expect(state.cursor).not.toBeNull();

    // Empty hands
    updateAirMouse([], state, 1000, 500, false, testButtons, 200);
    expect(state.cursor).toBeNull();
    expect(state.hoveredButtonId).toBeNull();
    expect(state.isPinching).toBe(false);
  });
});
