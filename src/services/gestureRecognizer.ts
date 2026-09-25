import type { NormalizedLandmark, FingerStates, RecognizedGesture } from "../types";

function getDist(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function get2DDist(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function analyzeFingerStates(landmarks: NormalizedLandmark[]): FingerStates {
  if (!landmarks || landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false };
  }

  const wrist = landmarks[0];

  // Helper for non-thumb fingers:
  // tip index, pip index, mcp index
  const isExtended = (tipIdx: number, pipIdx: number, mcpIdx: number): boolean => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];

    const distTipWrist = getDist(tip, wrist);
    const distPipWrist = getDist(pip, wrist);
    const distTipMcp = getDist(tip, mcp);
    const distPipMcp = getDist(pip, mcp);

    return distTipWrist > distPipWrist * 1.12 && distTipMcp > distPipMcp * 1.15;
  };

  // Thumb analysis:
  // Thumb is extended when tip (4) is far from pinky base (17) and wrist (0) compared to MCP (2)
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const pinkyMcp = landmarks[17];

  const thumbToWrist = getDist(thumbTip, wrist);
  const thumbMcpToWrist = getDist(thumbMcp, wrist);
  const thumbToPinkyMcp = getDist(thumbTip, pinkyMcp);
  const thumbMcpToPinkyMcp = getDist(thumbMcp, pinkyMcp);

  const thumbExtended =
    thumbToWrist > thumbMcpToWrist * 1.2 && thumbToPinkyMcp > thumbMcpToPinkyMcp * 1.05;

  return {
    thumb: thumbExtended,
    index: isExtended(8, 6, 5),
    middle: isExtended(12, 10, 9),
    ring: isExtended(16, 14, 13),
    pinky: isExtended(20, 18, 17),
  };
}

export function recognizeGesture(
  landmarks: NormalizedLandmark[],
  handedness: 'Left' | 'Right' = 'Right'
): RecognizedGesture {
  if (!landmarks || landmarks.length < 21) {
    return {
      name: 'Unknown',
      label: 'Scanning...',
      emoji: '🔍',
      confidence: 0,
      description: 'Hand not clearly in frame',
    };
  }

  const fingers = analyzeFingerStates(landmarks);
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const indexTip = landmarks[8];

  const thumbIndexDist = get2DDist(thumbTip, indexTip);
  const extendedCount = [
    fingers.thumb,
    fingers.index,
    fingers.middle,
    fingers.ring,
    fingers.pinky,
  ].filter(Boolean).length;

  // 1. OK Sign: Thumb tip & index tip touching, middle/ring/pinky open
  if (
    thumbIndexDist < 0.08 &&
    fingers.middle &&
    fingers.ring &&
    fingers.pinky
  ) {
    return {
      name: 'OK',
      label: 'OK Sign',
      emoji: '👌',
      confidence: 0.94,
      description: 'Thumb & index tip connected in ring, other fingers extended',
    };
  }

  // 2. Pinch: Thumb tip & index tip touching or close, others closed
  if (
    thumbIndexDist < 0.065 &&
    !fingers.middle &&
    !fingers.ring &&
    !fingers.pinky
  ) {
    return {
      name: 'Pinch',
      label: 'Pinch',
      emoji: '🤏',
      confidence: 0.92,
      description: 'Thumb and index pinched together',
    };
  }

  // 3. Open Palm: All 5 fingers extended
  if (fingers.thumb && fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
    return {
      name: 'OpenPalm',
      label: 'Open Palm',
      emoji: '✋',
      confidence: 0.96,
      description: 'All 5 fingers fully outstretched',
    };
  }

  // Also catch open palm if thumb is slightly relaxed but all 4 fingers are out
  if (
    !fingers.thumb &&
    fingers.index &&
    fingers.middle &&
    fingers.ring &&
    fingers.pinky &&
    getDist(thumbTip, wrist) > getDist(thumbMcp, wrist)
  ) {
    return {
      name: 'OpenPalm',
      label: 'Open Hand',
      emoji: '🖐️',
      confidence: 0.88,
      description: 'Fingers outstretched and spread open',
    };
  }

  // 4. Fist: All 4 main fingers curled
  if (!fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    // Check if thumb is extended upward for Thumbs Up
    const isThumbPointingUp = thumbTip.y < wrist.y - 0.05 && thumbTip.y < thumbMcp.y;
    const isThumbPointingDown = thumbTip.y > wrist.y + 0.05 && thumbTip.y > thumbMcp.y;

    if (fingers.thumb && isThumbPointingUp) {
      return {
        name: 'ThumbsUp',
        label: 'Thumbs Up',
        emoji: '👍',
        confidence: 0.95,
        description: 'Thumb raised upward with fingers curled',
      };
    }

    if (fingers.thumb && isThumbPointingDown) {
      return {
        name: 'ThumbsDown',
        label: 'Thumbs Down',
        emoji: '👎',
        confidence: 0.93,
        description: 'Thumb pointing downward with fingers curled',
      };
    }

    return {
      name: 'Fist',
      label: 'Closed Fist',
      emoji: '✊',
      confidence: 0.95,
      description: 'All fingers clenched tightly into palm',
    };
  }

  // 5. Pointing: Only Index extended
  if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    // If thumb is also extended upward, could be Finger Gun
    const isThumbUp = fingers.thumb && thumbTip.y < thumbMcp.y;
    if (isThumbUp) {
      return {
        name: 'Gun',
        label: 'Finger Gun',
        emoji: '👉',
        confidence: 0.91,
        description: 'Index extended forward and thumb up',
      };
    }

    return {
      name: 'Pointing',
      label: 'Pointing',
      emoji: '☝️',
      confidence: 0.94,
      description: 'Index finger pointing, remaining fingers folded',
    };
  }

  // 5b. Middle Finger: Only Middle finger extended
  if (fingers.middle && !fingers.index && !fingers.ring && !fingers.pinky) {
    return {
      name: 'MiddleFinger',
      label: 'Middle Finger',
      emoji: '🖕',
      confidence: 0.95,
      description: 'Middle finger raised upright with other fingers folded',
    };
  }

  // 6. Victory / Peace: Index + Middle extended, others curled
  if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    return {
      name: 'Peace',
      label: 'Victory / Peace',
      emoji: '✌️',
      confidence: 0.96,
      description: 'Index and middle fingers extended in V shape',
    };
  }

  // 7. Rock On / Horns: Index + Pinky extended, middle + ring curled
  if (fingers.index && !fingers.middle && !fingers.ring && fingers.pinky) {
    return {
      name: 'RockOn',
      label: 'Rock On / Horns',
      emoji: '🤘',
      confidence: 0.93,
      description: 'Index and pinky raised, middle and ring curled',
    };
  }

  // 8. Call Me / Shaka: Thumb + Pinky extended, others curled
  if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && fingers.pinky) {
    return {
      name: 'CallMe',
      label: 'Call Me / Shaka',
      emoji: '🤙',
      confidence: 0.92,
      description: 'Thumb and pinky extended, middle fingers curled',
    };
  }

  // 9. Three Fingers: Index + Middle + Ring extended
  if (fingers.index && fingers.middle && fingers.ring && !fingers.pinky) {
    return {
      name: 'Three',
      label: 'Three Fingers',
      emoji: '🤟',
      confidence: 0.89,
      description: 'Index, middle, and ring extended',
    };
  }

  // Default fallback
  return {
    name: 'Tracking',
    label: `${extendedCount} Fingers Open`,
    emoji: '✨',
    confidence: 0.75,
    description: `Tracking ${extendedCount} extended fingers (${handedness} Hand)`,
  };
}
