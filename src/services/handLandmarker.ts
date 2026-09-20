import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";

let landmarkerInstance: HandLandmarker | null = null;
let initializationPromise: Promise<HandLandmarker> | null = null;

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
    try {
      onProgress?.("Loading MediaPipe Vision WASM binaries...", 20);

      // Attempt loading from local /wasm first, fallback to CDN if not available
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks("/wasm");
      } catch (e) {
        console.warn("Local WASM load failed, falling back to CDN:", e);
        onProgress?.("Connecting to MediaPipe CDN...", 35);
        vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );
      }

      onProgress?.("Loading 3D Hand Landmarker Neural Network...", 60);

      // Model asset: check local model first, fallback to Google CDN
      const modelPath = "/models/hand_landmarker.task";

      onProgress?.("Compiling GPU Vision pipeline...", 80);

      try {
        landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuError) {
        console.warn("GPU delegate failed, falling back to CPU:", gpuError);
        onProgress?.("Configuring CPU fallback mode...", 85);
        landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      onProgress?.("Vision Model Ready!", 100);
      return landmarkerInstance;
    } catch (err) {
      initializationPromise = null;
      throw err;
    }
  })();

  return initializationPromise;
}

export function detectHandsForVideo(
  landmarker: HandLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): HandLandmarkerResult | null {
  if (!landmarker || !video || video.readyState < 2) {
    return null;
  }

  try {
    return landmarker.detectForVideo(video, timestampMs);
  } catch (err) {
    console.error("Error during hand detection:", err);
    return null;
  }
}
