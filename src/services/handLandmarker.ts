import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";

let landmarkerInstance: HandLandmarker | null = null;
let initializationPromise: Promise<HandLandmarker> | null = null;
let lastTimestamp = -1;

export interface InitProgressCallback {
  (message: string, progress: number): void;
}

export async function initializeHandLandmarker(
  onProgress?: InitProgressCallback
): Promise<HandLandmarker> {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    onProgress?.("Loading MediaPipe Vision WASM binaries...", 20);

    const LOCAL_WASM = "/wasm";
    const CDN_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
    const LOCAL_MODEL = "/models/hand_landmarker.task";
    const CDN_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

    // Helper to attempt creating landmarker with given vision resolver, model, and delegate
    const tryCreate = async (
      wasmPath: string,
      modelPath: string,
      delegate: "GPU" | "CPU"
    ): Promise<HandLandmarker> => {
      const vision = await FilesetResolver.forVisionTasks(wasmPath);
      return await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate,
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.35,
        minHandPresenceConfidence: 0.35,
        minTrackingConfidence: 0.35,
      });
    };

    // Strategy 1: Local WASM + Local Model + GPU
    try {
      onProgress?.("Compiling GPU Vision pipeline...", 50);
      landmarkerInstance = await tryCreate(LOCAL_WASM, LOCAL_MODEL, "GPU");
      onProgress?.("Vision Model Ready! (GPU)", 100);
      return landmarkerInstance;
    } catch (e1) {
      console.warn("GPU local init failed, trying CPU:", e1);
    }

    // Strategy 2: Local WASM + Local Model + CPU
    try {
      onProgress?.("Falling back to CPU mode...", 70);
      landmarkerInstance = await tryCreate(LOCAL_WASM, LOCAL_MODEL, "CPU");
      onProgress?.("Vision Model Ready! (CPU)", 100);
      return landmarkerInstance;
    } catch (e2) {
      console.warn("CPU local init failed, trying Google CDN:", e2);
    }

    // Strategy 3: CDN WASM + CDN Model + GPU
    try {
      onProgress?.("Connecting to MediaPipe CDN (GPU)...", 85);
      landmarkerInstance = await tryCreate(CDN_WASM, CDN_MODEL, "GPU");
      onProgress?.("Vision Model Ready! (CDN GPU)", 100);
      return landmarkerInstance;
    } catch (e3) {
      console.warn("CDN GPU init failed, trying CDN CPU:", e3);
    }

    // Strategy 4: CDN WASM + CDN Model + CPU
    try {
      onProgress?.("Connecting to MediaPipe CDN (CPU)...", 90);
      landmarkerInstance = await tryCreate(CDN_WASM, CDN_MODEL, "CPU");
      onProgress?.("Vision Model Ready! (CDN CPU)", 100);
      return landmarkerInstance;
    } catch (e4) {
      console.error("All vision initialization attempts failed:", e4);
      initializationPromise = null;
      throw new Error(
        "Could not initialize HandLandmarker on GPU or CPU. Please verify WebGL support or network connectivity."
      );
    }
  })();

  return initializationPromise;
}

export function detectHandsForVideo(
  landmarker: HandLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): HandLandmarkerResult | null {
  if (
    !landmarker ||
    !video ||
    video.readyState < 2 ||
    video.videoWidth <= 0 ||
    video.videoHeight <= 0
  ) {
    return null;
  }

  // Ensure timestamp is strictly monotonically increasing to satisfy MediaPipe requirements
  if (timestampMs <= lastTimestamp) {
    timestampMs = lastTimestamp + 1;
  }
  lastTimestamp = timestampMs;

  try {
    return landmarker.detectForVideo(video, timestampMs);
  } catch (err) {
    console.error("Error during hand detection:", err);
    return null;
  }
}
