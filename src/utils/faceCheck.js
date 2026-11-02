/**
 * Checks that a profile photo shows one clear human face, using Google's
 * MediaPipe face detector in the browser (nothing is uploaded for this).
 * The detector (~1 MB) loads only the first time a photo is checked.
 */
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

let detectorPromise = null;

function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      return FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: 'IMAGE',
        // Real faces score 0.9+; round objects like plates can score 0.4-0.7
        minDetectionConfidence: 0.85
      });
    })().catch(err => { detectorPromise = null; throw err; });
  }
  return detectorPromise;
}

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Could not read the picture.'));
  img.src = src;
});

/**
 * @param {string} dataUrl - the picture
 * @returns {{ ok: boolean, message: string }} - a photo that can't be checked is refused
 */
export async function checkFacePhoto(dataUrl) {
  let detector;
  try {
    detector = await getDetector();
  } catch {
    return { ok: false, message: "We couldn't check your photo. Please check your internet connection and try again." };
  }
  const img = await loadImage(dataUrl);
  const faces = detector.detect(img).detections;

  if (faces.length === 0) {
    return { ok: false, message: "We couldn't find a face in that picture. Please take a clear photo of your face, facing the camera." };
  }
  if (faces.length > 1) {
    return { ok: false, message: 'That picture has more than one person. Please use a photo of just you.' };
  }
  const box = faces[0].boundingBox;
  if ((box.width * box.height) / (img.width * img.height) < 0.05) {
    return { ok: false, message: 'Your face is too small in that picture. Please move closer to the camera.' };
  }
  return { ok: true, message: '' };
}
