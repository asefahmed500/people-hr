"use client"

import * as React from "react"
import { Camera, CameraOff, CheckCircle2, Clock, RefreshCw, ScanFace, ShieldQuestion, XCircle } from "lucide-react"

import { captureDescriptor, prepareFaceEngine, startCamera } from "@/lib/face-client"
import { apiRequest, ApiError } from "@/lib/api-client"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"

type EnrollmentStatus = "none" | "pending" | "approved" | "rejected"

type FaceCheckinCardProps = {
  /** Time the caller already checked in today, or null. */
  alreadyCheckedInTime: string | null
  /** Called after a successful face check-in so the parent can refresh. */
  onCheckedIn?: () => void
}

type Phase = "idle" | "camera" | "processing"

export function FaceCheckinCard({ alreadyCheckedInTime, onCheckedIn }: FaceCheckinCardProps) {
  const [status, setStatus] = React.useState<EnrollmentStatus | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [modelsReady, setModelsReady] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const stopCameraRef = React.useRef<(() => void) | null>(null)

  const refreshStatus = React.useCallback(async () => {
    try {
      const res = await apiRequest<{ status: EnrollmentStatus }>("/api/attendance/face")
      setStatus(res.status)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't load your face registration status.")
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiRequest<{ status: EnrollmentStatus }>("/api/attendance/face")
        if (!cancelled) {
          setStatus(res.status)
          setLoadError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.message : "Couldn't load your face registration status.",
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const stopCamera = React.useCallback(() => {
    stopCameraRef.current?.()
    stopCameraRef.current = null
    setPhase("idle")
  }, [])

  React.useEffect(() => () => stopCameraRef.current?.(), [])

  async function openCamera() {
    const video = videoRef.current
    if (!video) return
    setPhase("camera")
    setLoadError(null)
    try {
      setModelsReady(false)
      await prepareFaceEngine()
      setModelsReady(true)
      stopCameraRef.current = await startCamera(video)
    } catch (err) {
      stopCamera()
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        notify.error("Camera blocked", "Allow camera access in your browser to use face check-in.")
      } else {
        notify.error("Couldn't start the camera", "Close other apps using the camera and try again.")
      }
    }
  }

  async function submit(kind: "enroll" | "checkin") {
    const video = videoRef.current
    if (!video) return
    setPhase("processing")
    try {
      const capture = await captureDescriptor(video)
      if (!capture.ok) {
        setPhase("camera")
        notify.error(
          capture.error === "no-face" ? "No face detected" : "Multiple faces detected",
          capture.error === "no-face"
            ? "Center your face in the frame with good lighting, then capture again."
            : "Only one person should be in the frame during capture.",
        )
        return
      }
      if (kind === "enroll") {
        const res = await apiRequest<{ status: EnrollmentStatus }>("/api/attendance/face", {
          method: "POST",
          body: { descriptor: capture.descriptor },
        })
        setStatus(res.status)
        notify.success("Face registered", "An admin will review and approve your registration.")
        stopCamera()
      } else {
        const res = await apiRequest<{ checkIn: { name: string; time: string; status: string } }>(
          "/api/attendance/face/checkin",
          { method: "POST", body: { descriptor: capture.descriptor } },
        )
        notify.success(
          `Checked in at ${res.checkIn.time}`,
          `Welcome, ${res.checkIn.name} — recorded as ${res.checkIn.status.replace("-", " ")}.`,
        )
        stopCamera()
        onCheckedIn?.()
      }
    } catch (err) {
      setPhase("camera")
      const message = err instanceof ApiError ? err.message : "Something went wrong. Try again."
      notify.error(kind === "enroll" ? "Registration failed" : "Check-in failed", message)
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
        void refreshStatus()
      }
    }
  }

  const statusChip = (s: EnrollmentStatus) => {
    switch (s) {
      case "approved":
        return { icon: CheckCircle2, label: "Registered", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" }
      case "pending":
        return { icon: Clock, label: "Awaiting approval", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" }
      case "rejected":
        return { icon: XCircle, label: "Rejected", tone: "bg-destructive/10 text-destructive" }
      default:
        return { icon: ShieldQuestion, label: "Not registered", tone: "bg-muted text-muted-foreground" }
    }
  }

  const s = status ? statusChip(status) : null
  const captureKind: "enroll" | "checkin" = status === "approved" ? "checkin" : "enroll"

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-h4 flex items-center gap-2">
            <ScanFace className="size-4.5 text-primary" strokeWidth={2} />
            Face check-in
          </h3>
          <span className="font-sans inline-block text-[12px] leading-normal text-muted-foreground">
            Check in with your face — attendance identity is verified server-side, never self-reported.
          </span>
        </div>
        {s ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold",
              s.tone,
            )}
          >
            <s.icon className="size-3" />
            {s.label}
          </span>
        ) : null}
      </div>

      {loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <span className="font-sans text-[12.5px] text-destructive">{loadError}</span>
          <button
            type="button"
            onClick={() => void refreshStatus()}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 font-sans text-[12px] font-medium text-foreground hover:bg-muted"
          >
            <RefreshCw className="size-3.5" /> Retry
          </button>
        </div>
      ) : null}

      {status === "pending" ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-sans text-[12.5px] text-secondary-foreground">
            Your registration is waiting for an admin to approve it. You&apos;ll be able to check in once approved.
          </span>
        </div>
      ) : null}

      {/* Camera stage: mounted for the card's whole lifetime so the video
          element exists the moment a button is clicked (a lazily-mounted ref
          is null at click time and silently no-ops the handler). Hidden
          whenever the flow isn't active. */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-black",
          phase === "idle" && "hidden",
        )}
      >
        <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" />
        {phase === "processing" || !modelsReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="font-sans text-[12.5px] font-medium text-white">
              {phase === "processing" ? "Recognizing…" : "Loading face model (first time only)…"}
            </span>
          </div>
        ) : null}
      </div>

      {phase === "idle" ? (
        <div className="flex flex-col gap-3">
          {status === "approved" && !alreadyCheckedInTime ? (
            <button
              type="button"
              onClick={() => void openCamera()}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-sans text-[14px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
            >
              <ScanFace className="size-4" />
              Scan my face to check in
            </button>
          ) : null}
          {(status === "none" || status === "rejected") && !alreadyCheckedInTime ? (
            <button
              type="button"
              onClick={() => void openCamera()}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-sans text-[14px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
            >
              <Camera className="size-4" />
              {status === "rejected" ? "Register again" : "Register your face"}
            </button>
          ) : null}
          {status === "approved" ? (
            <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
              Your face is locked to your account. To change it, ask an admin to reset your registration.
            </span>
          ) : null}
          {alreadyCheckedInTime ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted px-4 py-3">
              <span className="flex items-center gap-2 font-sans text-[12.5px] text-secondary-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                You already checked in today at {alreadyCheckedInTime}.
              </span>
              <button
                type="button"
                onClick={() => void openCamera()}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 font-sans text-[12px] font-medium text-foreground hover:bg-muted"
              >
                <ScanFace className="size-3.5" />
                Scan again
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={phase === "processing"}
            onClick={() => void submit(captureKind)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary font-sans text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <ScanFace className="size-4" />
            {captureKind === "checkin" ? "Capture & check in" : "Capture & register"}
          </button>
          <button
            type="button"
            disabled={phase === "processing"}
            onClick={stopCamera}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 font-sans text-[13px] font-medium text-secondary-foreground hover:bg-muted disabled:opacity-60"
          >
            <CameraOff className="size-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
