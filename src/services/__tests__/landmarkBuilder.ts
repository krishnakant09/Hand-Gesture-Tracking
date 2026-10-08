import type { NormalizedLandmark } from "../../types";

/**
 * Test helper that builds a plausible 21-landmark MediaPipe hand so that
 * `analyzeFingerStates` / `recognizeGesture` distance heuristics fire as expected.
 *
 * Landmark topology (MediaPipe):
 *   0 wrist | thumb 1-4 (tip 4) | index 5-8 (tip 8) | middle 9-12 (tip 12)
 *   ring 13-16 (tip 16) | pinky 17-20 (tip 20)
 *
 * Coordinate convention: wrist near bottom-center (y ~0.9), extended fingertips
 * point up (smaller y), curled fingertips fold back near the palm (larger y).
 */
export type ThumbMode = "extended" | "curled" | "tucked";

export interface HandSpec {
  thumb?: ThumbMode; // default "curled"
  index?: boolean;
  middle?: boolean;
  ring?: boolean;
  pinky?: boolean;
  overrides?: Partial<Record<number, NormalizedLandmark>>;
}

const THUMB_POS: Record<ThumbMode, NormalizedLandmark[]> = {
  // Thumb out to the side (clearly extended).
  extended: [
    { x: 0.43, y: 0.85, z: 0 },
    { x: 0.40, y: 0.82, z: 0 },
    { x: 0.37, y: 0.8, z: 0 },
    { x: 0.34, y: 0.78, z: 0 },
  ],
  // Thumb wrapped across the middle/ring fingers (as in a fist or "horns").
  curled: [
    { x: 0.43, y: 0.85, z: 0 },
    { x: 0.40, y: 0.82, z: 0 },
    { x: 0.48, y: 0.81, z: 0 },
    { x: 0.52, y: 0.8, z: 0 },
  ],
  // Thumb folded across the palm near the index MCP (as in a "4" count).
  tucked: [
    { x: 0.43, y: 0.85, z: 0 },
    { x: 0.40, y: 0.82, z: 0 },
    { x: 0.44, y: 0.77, z: 0 },
    { x: 0.46, y: 0.73, z: 0 },
  ],
};

function setFinger(
  lm: NormalizedLandmark[],
  mcpIdx: number,
  x: number,
  mcpY: number,
  extended: boolean,
) {
  lm[mcpIdx] = { x, y: mcpY, z: 0 };
  if (extended) {
    lm[mcpIdx + 1] = { x, y: mcpY - 0.1, z: 0 }; // pip
    lm[mcpIdx + 2] = { x, y: mcpY - 0.16, z: 0 }; // dip
    lm[mcpIdx + 3] = { x, y: mcpY - 0.22, z: 0 }; // tip
  } else {
    lm[mcpIdx + 1] = { x, y: mcpY - 0.04, z: 0 }; // pip (knuckle raised)
    lm[mcpIdx + 2] = { x, y: mcpY + 0.01, z: 0 }; // dip folding back
    lm[mcpIdx + 3] = { x, y: mcpY + 0.03, z: 0 }; // tip near palm
  }
}

export function buildHand(spec: HandSpec = {}): NormalizedLandmark[] {
  const lm: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0,
    y: 0,
    z: 0,
  }));

  // Wrist
  lm[0] = { x: 0.5, y: 0.9, z: 0 };

  // Thumb (landmarks 1-4)
  const thumb = THUMB_POS[spec.thumb ?? "curled"];
  lm[1] = { ...thumb[0] };
  lm[2] = { ...thumb[1] };
  lm[3] = { ...thumb[2] };
  lm[4] = { ...thumb[3] };

  // Four fingers
  setFinger(lm, 5, 0.44, 0.72, spec.index ?? false);
  setFinger(lm, 9, 0.5, 0.7, spec.middle ?? false);
  setFinger(lm, 13, 0.56, 0.72, spec.ring ?? false);
  setFinger(lm, 17, 0.62, 0.74, spec.pinky ?? false);

  // Apply any explicit per-landmark overrides (e.g. Vulcan V-spread, OK touch).
  if (spec.overrides) {
    const entries = Object.entries(spec.overrides) as [string, NormalizedLandmark][];
    for (const [idx, pt] of entries) {
      lm[Number(idx)] = { ...pt };
    }
  }

  return lm;
}
