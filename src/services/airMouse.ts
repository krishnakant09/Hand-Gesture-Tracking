import type { TrackedHand } from "../types";

/**
 * Touchless "Air Mouse" & Holographic Spatial Buttons Engine.
 *
 * Provides:
 * 1. Air cursor tracking from index fingertip with smooth exponential filtering.
 * 2. Fine motor Pinch click detection (thumb + index fingertips proximity).
 * 3. Dual-finger vertical scroll detection.
 * 4. Spatial Hologram Buttons on the camera viewport with hover, circular dwell progress,
 *    and instant pinch-click triggering.
 */

export interface CursorPosition {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  screenX: number; // Viewport pixels
  screenY: number; // Viewport pixels
}

export interface HologramButtonDef {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  x: number; // Relative center/top-left 0..1
  y: number; // Relative center/top-left 0..1
  width: number; // Relative 0..1
  height: number; // Relative 0..1
  badge?: string;
}

export interface HologramButtonState extends HologramButtonDef {
  isHovered: boolean;
  isPressed: boolean;
  dwellProgress: number; // 0..1 progress bar
}

export interface AirMouseState {
  cursor: CursorPosition | null;
  smoothedX: number;
  smoothedY: number;
  isPinching: boolean;
  wasPinching: boolean;
  pinchDistance: number;
  activeGesture: string;
  hoveredButtonId: string | null;
  dwellStartTime: number | null;
  dwellProgress: number;
  lastClickTime: number;
  isScrolling: boolean;
  scrollDeltaY: number;
}

/** Threshold in normalized 3D space between thumb tip (4) and index tip (8) for pinch */
export const PINCH_CLICK_THRESHOLD = 0.068;

/** Dwell time in milliseconds to trigger button without pinch */
export const DWELL_CLICK_MS = 600;

/** Exponential smoothing alpha (0 = frozen, 1 = raw instant) */
export const MOUSE_SMOOTHING = 0.35;

export function createAirMouseState(): AirMouseState {
  return {
    cursor: null,
    smoothedX: 0.5,
    smoothedY: 0.5,
    isPinching: false,
    wasPinching: false,
    pinchDistance: 1,
    activeGesture: "Unknown",
    hoveredButtonId: null,
    dwellStartTime: null,
    dwellProgress: 0,
    lastClickTime: 0,
    isScrolling: false,
    scrollDeltaY: 0,
  };
}

/**
 * Calculates 3D Euclidean distance between landmark 4 (Thumb tip) and 8 (Index tip).
 */
export function calculatePinchDistance(hand: TrackedHand): number {
  const lms = hand?.landmarks;
  if (!lms || lms.length < 9) return 1;
  const thumb = lms[4];
  const index = lms[8];
  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;
  const dz = (thumb.z || 0) - (index.z || 0);
  return Math.hypot(dx, dy, dz);
}

/**
 * Checks if a normalized point (px, py) falls inside a rectangular relative bounding box.
 */
export function isPointInsideRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Process a detection frame and update Air Mouse & Holographic Button interaction states.
 */
export function updateAirMouse(
  hands: TrackedHand[],
  state: AirMouseState,
  containerWidth: number,
  containerHeight: number,
  mirror: boolean,
  buttons: HologramButtonDef[],
  now: number,
  onButtonClick?: (buttonId: string) => void,
  onClickTrigger?: (pos: CursorPosition) => void,
): void {
  // If no hands detected, reset cursor and dwell states
  if (!hands || hands.length === 0) {
    state.cursor = null;
    state.isPinching = false;
    state.wasPinching = false;
    state.hoveredButtonId = null;
    state.dwellStartTime = null;
    state.dwellProgress = 0;
    state.isScrolling = false;
    return;
  }

  const primaryHand = hands[0];
  const lms = primaryHand.landmarks;
  if (!lms || lms.length < 9) {
    state.cursor = null;
    return;
  }

  // 1. Calculate raw cursor point from index fingertip (landmark 8)
  const tip = lms[8];
  const rawX = mirror ? 1 - tip.x : tip.x;
  const rawY = tip.y;

  // 2. Exponential Moving Average smoothing
  state.smoothedX = state.smoothedX * (1 - MOUSE_SMOOTHING) + rawX * MOUSE_SMOOTHING;
  state.smoothedY = state.smoothedY * (1 - MOUSE_SMOOTHING) + rawY * MOUSE_SMOOTHING;

  const curPos: CursorPosition = {
    x: state.smoothedX,
    y: state.smoothedY,
    screenX: state.smoothedX * containerWidth,
    screenY: state.smoothedY * containerHeight,
  };
  state.cursor = curPos;

  // 3. Pinch detection
  const pinchDist = calculatePinchDistance(primaryHand);
  state.pinchDistance = pinchDist;
  const isPinchNow = pinchDist < PINCH_CLICK_THRESHOLD;

  const isClickTriggered = isPinchNow && !state.wasPinching;
  state.isPinching = isPinchNow;

  // 4. Dual-finger scroll check (Peace / 2 fingers up gesture with vertical motion)
  const fingers = primaryHand.fingerStates;
  if (fingers && fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    state.isScrolling = true;
    const midTip = lms[12];
    const avgY = (tip.y + midTip.y) / 2;
    // Map vertical movement to delta
    state.scrollDeltaY = (avgY - 0.5) * 20;
  } else {
    state.isScrolling = false;
    state.scrollDeltaY = 0;
  }

  // 5. Test interaction with Holographic Spatial Buttons
  let currentlyHoveredId: string | null = null;

  for (const btn of buttons) {
    if (isPointInsideRect(curPos.x, curPos.y, btn.x, btn.y, btn.width, btn.height)) {
      currentlyHoveredId = btn.id;
      break;
    }
  }

  if (currentlyHoveredId) {
    if (state.hoveredButtonId !== currentlyHoveredId) {
      // Just entered a new button
      state.hoveredButtonId = currentlyHoveredId;
      state.dwellStartTime = now;
      state.dwellProgress = 0;
    } else {
      // Continuing hover: advance dwell progress
      if (state.dwellStartTime !== null) {
        const elapsed = now - state.dwellStartTime;
        state.dwellProgress = Math.min(1, elapsed / DWELL_CLICK_MS);

        // Dwell click trigger!
        if (state.dwellProgress >= 1) {
          state.dwellStartTime = null;
          state.dwellProgress = 0;
          state.lastClickTime = now;
          onButtonClick?.(currentlyHoveredId);
        }
      }
    }

    // Instant pinch click trigger while hovering!
    if (isClickTriggered) {
      state.dwellStartTime = null;
      state.dwellProgress = 0;
      state.lastClickTime = now;
      onButtonClick?.(currentlyHoveredId);
    }
  } else {
    // Not hovering any spatial button
    state.hoveredButtonId = null;
    state.dwellStartTime = null;
    state.dwellProgress = 0;

    // Air mouse free click trigger
    if (isClickTriggered) {
      state.lastClickTime = now;
      onClickTrigger?.(curPos);
    }
  }

  state.wasPinching = isPinchNow;
}
