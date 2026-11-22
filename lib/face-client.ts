// Face capture helper built on @vladmandic/human (successor to face-api).
// Human gives us 1024-float face embeddings plus built-in matching helpers.
// We deep-import its browser ESM bundle (see lib/human-esm.d.ts) so bundlers
// never touch the node-only dist, and import it lazily on first use so the
// TFJS payload never touches the initial page load. Detection runs fully
// in-browser — only the embedding vector is sent to the API, never the image.

type Human = import("@/lib/vendor/human.esm.js").Human

let humanPromise: Promise<Human> | null = null

async function getHuman(): Promise<Human> {
  if (!humanPromise) {
    humanPromise = (async () => {
      const { Human } = await import("@/lib/vendor/human.esm.js")
      const human = new Human({
        modelBasePath: "/human-models",
        // Face-only pipeline — skip every model we don't need.
        face: {
          enabled: true,
          detector: { rotation: true },
          mesh: { enabled: true },
          iris: { enabled: false },
          description: { enabled: true },
          emotion: { enabled: false },
          antispoof: { enabled: false },
          liveness: { enabled: false },
        },
        body: { enabled: false },
        hand: { enabled: false },
        gesture: { enabled: false },
        object: { enabled: false },
        segmentation: { enabled: false },
      })
      // Pre-fetch model weights so the first capture isn't slow.
      await human.load()
      return human
    })()
  }
  return humanPromise
}

/** Download/prepare models up-front (called before showing the camera). */
export async function prepareFaceEngine(): Promise<void> {
  await getHuman()
}

export type CaptureResult =
  | { ok: true; descriptor: number[] }
  | { ok: false; error: "no-face" | "multiple-faces" }

/** Grab one face embedding from a live video element. */
export async function captureDescriptor(video: HTMLVideoElement): Promise<CaptureResult> {
  const human = await getHuman()
  const result = await human.detect(video)
  const faces = result.face ?? []
  if (faces.length === 0) return { ok: false, error: "no-face" }
  if (faces.length > 1) return { ok: false, error: "multiple-faces" }
  const embedding = faces[0].embedding
  if (!embedding || embedding.length === 0) return { ok: false, error: "no-face" }
  return { ok: true, descriptor: Array.from(embedding) }
}

/** True when the browser will even allow a camera request here. Embedded
 *  previews and iframes often have camera blocked by Permissions-Policy; calling
 *  getUserMedia there only produces a console violation and a failed promise. */
export function cameraAvailable(): boolean {
  if (typeof window === "undefined") return false
  if (!navigator.mediaDevices?.getUserMedia) return false
  const policy = (document as Document & {
    permissionsPolicy?: { allowsFeature: (feature: string) => boolean }
  }).permissionsPolicy
  if (policy && typeof policy.allowsFeature === "function" && !policy.allowsFeature("camera")) {
    return false
  }
  return true
}

export class CameraPolicyError extends Error {
  constructor() {
    super("Camera is blocked by this page's permissions policy.")
    this.name = "CameraPolicyError"
  }
}

/** Start the webcam into a video element; returns a stop() cleanup. */
export async function startCamera(video: HTMLVideoElement): Promise<() => void> {
  if (!cameraAvailable()) throw new CameraPolicyError()
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  })
  video.srcObject = stream
  await video.play().catch(() => {})
  return () => {
    for (const track of stream.getTracks()) track.stop()
    video.srcObject = null
  }
}
