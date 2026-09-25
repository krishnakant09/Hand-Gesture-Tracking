export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface RecognizedGesture {
  name: string;
  label: string;
  emoji: string;
  confidence: number;
  description: string;
}

export interface TrackedHand {
  id: number;
  handedness: 'Left' | 'Right';
  score: number;
  landmarks: NormalizedLandmark[];
  worldLandmarks?: NormalizedLandmark[];
  fingerStates: FingerStates;
  gesture: RecognizedGesture;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export type ThemeName = 'cyber' | 'emerald' | 'sunset' | 'matrix';
export type SoundTheme = 'scifi' | 'arcade' | 'zen' | 'mechanical';

export interface ThemeColors {
  primary: string;
  primaryGlow: string;
  secondary: string;
  secondaryGlow: string;
  joints: string;
  accent: string;
  text: string;
}

export interface AppSettings {
  showSkeleton: boolean;
  showJoints: boolean;
  showGlow: boolean;
  showBoundingBox: boolean;
  showLandmarkIndices: boolean;
  showGestureBadgeOnCanvas: boolean;
  mirror: boolean;
  theme: ThemeName;
  minConfidence: number;
  maxHands: number;
  soundEnabled: boolean;
  soundVolume: number;
  soundTheme: SoundTheme;
  motionWhoosh: boolean;
}
