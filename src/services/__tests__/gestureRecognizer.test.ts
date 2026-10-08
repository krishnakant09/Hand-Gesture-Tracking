import { describe, it, expect } from "vitest";
import { recognizeGesture, analyzeFingerStates } from "../gestureRecognizer";
import { buildHand } from "./landmarkBuilder";

describe("recognizeGesture — existing gestures (harness validation)", () => {
  it("recognizes Open Palm when all fingers are extended", () => {
    const lm = buildHand({
      thumb: "extended",
      index: true,
      middle: true,
      ring: true,
      pinky: true,
    });
    expect(recognizeGesture(lm, "Right").name).toBe("OpenPalm");
  });

  it("recognizes Fist when all fingers are curled", () => {
    const lm = buildHand({
      thumb: "curled",
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    });
    expect(recognizeGesture(lm, "Right").name).toBe("Fist");
  });

  it("recognizes Peace when index + middle are extended and others curled", () => {
    const lm = buildHand({
      thumb: "curled",
      index: true,
      middle: true,
      ring: false,
      pinky: false,
    });
    expect(recognizeGesture(lm, "Right").name).toBe("Peace");
  });
});

describe("analyzeFingerStates — harness validation", () => {
  it("reports all fingers extended for an open palm", () => {
    const lm = buildHand({
      thumb: "extended",
      index: true,
      middle: true,
      ring: true,
      pinky: true,
    });
    const state = analyzeFingerStates(lm);
    expect(state).toEqual({
      thumb: true,
      index: true,
      middle: true,
      ring: true,
      pinky: true,
    });
  });

  it("reports all fingers curled for a fist", () => {
    const lm = buildHand({
      thumb: "curled",
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    });
    const state = analyzeFingerStates(lm);
    expect(state.thumb).toBe(false);
    expect(state.index).toBe(false);
    expect(state.middle).toBe(false);
    expect(state.ring).toBe(false);
    expect(state.pinky).toBe(false);
  });
});

describe("recognizeGesture — new static gestures", () => {
  it("recognizes Vulcan Salute (V-gap between middle & ring, all four extended)", () => {
    const lm = buildHand({
      thumb: "extended",
      index: true,
      middle: true,
      ring: true,
      pinky: true,
      overrides: {
        12: { x: 0.46, y: 0.48, z: 0 }, // middle tip pulled toward index
        16: { x: 0.6, y: 0.5, z: 0 }, // ring tip pulled toward pinky
      },
    });
    expect(recognizeGesture(lm, "Right").name).toBe("Vulcan");
  });

  it("recognizes I Love You (thumb + index + pinky extended, middle & ring curled)", () => {
    const lm = buildHand({
      thumb: "extended",
      index: true,
      middle: false,
      ring: false,
      pinky: true,
    });
    expect(recognizeGesture(lm, "Right").name).toBe("ILY");
  });

  it("recognizes Four Fingers (four extended, thumb tucked across palm)", () => {
    const lm = buildHand({
      thumb: "tucked",
      index: true,
      middle: true,
      ring: true,
      pinky: true,
    });
    expect(recognizeGesture(lm, "Right").name).toBe("Four");
  });

  it("does NOT classify an evenly-spread open palm as Vulcan", () => {
    const lm = buildHand({
      thumb: "extended",
      index: true,
      middle: true,
      ring: true,
      pinky: true,
    });
    expect(recognizeGesture(lm, "Right").name).toBe("OpenPalm");
  });

  it("still recognizes Rock On with a curled thumb (not misread as ILY)", () => {
    const lm = buildHand({
      thumb: "curled",
      index: true,
      middle: false,
      ring: false,
      pinky: true,
    });
    expect(recognizeGesture(lm, "Right").name).toBe("RockOn");
  });
});
