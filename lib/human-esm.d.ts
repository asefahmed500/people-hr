// Minimal ambient types for the vendored browser ESM bundle of
// @vladmandic/human (lib/vendor/human.esm.js, copied from
// dist/human.esm.js@3.3.6 — MIT license, header preserved in the file).
// We vendor it because the package's exports map uses keys without "./"
// prefixes (invalid per spec), which makes deep imports unresolvable, and the
// default "node" condition resolves to dist/human.node.js, which requires
// @tensorflow/tfjs-node. We only use the face embedding pipeline, so a narrow
// local type is all the client needs.
declare module "@/lib/vendor/human.esm.js" {
  export type HumanFaceResult = {
    embedding?: number[]
    score?: number
    box?: [number, number, number, number]
  }
  export type HumanDetectResult = {
    face?: HumanFaceResult[]
  }
  export class Human {
    constructor(config?: unknown)
    /** Pre-fetch model weights. */
    load(): Promise<unknown>
    detect(input: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<HumanDetectResult>
  }
}
