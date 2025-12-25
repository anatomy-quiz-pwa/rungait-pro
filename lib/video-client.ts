'use client'

export type CompressionPreset = "fast720" | "small540" | "cutOnly"

export interface TrimOptions {
  startSec: number
  endSec: number
  preset: CompressionPreset
  onProgress?: (progress: number) => void
}

/**
 * Native browser-based video trimming without ffmpeg.wasm
 * Uses MediaRecorder API to capture video frames
 * Prioritizes MP4/H.264 for Safari/iOS compatibility
 */
export async function trimVideo(file: File, options: TrimOptions): Promise<Blob | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('trimVideo can only be called in browser environment')
  }

  const { startSec, endSec, preset, onProgress } = options
  const duration = endSec - startSec

  if (duration > 10) {
    throw new Error("Duration exceeds 10 seconds")
  }

  console.log("[v0][video] Starting native trim:", { startSec, endSec, preset })

  try {
    // Create video element
    const video = document.createElement("video")
    video.src = URL.createObjectURL(file)
    video.muted = true
    video.crossOrigin = "anonymous"

    // Wait for video to load
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve
      video.onerror = () => reject(new Error("Failed to load video file"))
      setTimeout(() => reject(new Error("Video load timeout")), 10000)
    })

    console.log("[v0][video] Video loaded:", video.videoWidth, "x", video.videoHeight, video.duration, "s")

    // Determine target dimensions based on preset
    const { width, height } = getTargetDimensions(video.videoWidth, video.videoHeight, preset)

    // Create canvas for capturing frames
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d", { alpha: false })!

    // Set up MediaRecorder with browser-compatible codecs
    const stream = canvas.captureStream(30) // 30 fps

    let mimeType = ""
    let extension = "mp4"

    // Priority order: MP4 > WebM VP9 > WebM VP8 > WebM generic
    const codecOptions = [
      { mime: "video/mp4;codecs=avc1.42E01E", ext: "mp4" }, // H.264 baseline
      { mime: "video/mp4;codecs=avc1", ext: "mp4" },
      { mime: "video/mp4", ext: "mp4" },
      { mime: "video/webm;codecs=h264", ext: "webm" }, // H.264 in WebM container
      { mime: "video/webm;codecs=vp9", ext: "webm" },
      { mime: "video/webm;codecs=vp8", ext: "webm" },
      { mime: "video/webm", ext: "webm" },
    ]

    for (const option of codecOptions) {
      if (MediaRecorder.isTypeSupported(option.mime)) {
        mimeType = option.mime
        extension = option.ext
        console.log("[v0][video] Using codec:", option.mime)
        break
      }
    }

    if (!mimeType) {
      throw new Error("No supported video codec found in this browser")
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: getBitrate(preset),
    })

    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    // Seek to start time
    video.currentTime = startSec
    await new Promise((resolve, reject) => {
      video.onseeked = resolve
      video.onerror = () => reject(new Error("Failed to seek video"))
      setTimeout(() => reject(new Error("Seek timeout")), 5000)
    })

    // Start recording
    recorder.start(100) // Capture in 100ms chunks

    // Play and capture frames
    let lastProgress = 0
    const captureInterval = setInterval(() => {
      if (video.currentTime >= endSec || video.ended) {
        clearInterval(captureInterval)
        video.pause()
        recorder.stop()
        return
      }

      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, width, height)

      // Report progress
      const progress = Math.min(100, ((video.currentTime - startSec) / duration) * 100)
      if (progress - lastProgress >= 5) {
        lastProgress = progress
        onProgress?.(Math.round(progress))
      }
    }, 1000 / 30) // 30 fps

    // Play video
    const playPromise = video.play()
    if (playPromise) {
      await playPromise.catch((err) => {
        console.warn("[v0][video] Play interrupted:", err)
      })
    }

    // Wait for recording to complete
    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType })
        if (finalBlob.size === 0) {
          reject(new Error("Recording produced zero bytes"))
        } else {
          resolve(finalBlob)
        }
      }
      recorder.onerror = (e: any) => {
        reject(new Error("Recording error: " + e.error?.message || "Unknown"))
      }
      setTimeout(() => reject(new Error("Recording timeout")), 30000)
    })

    // Clean up
    URL.revokeObjectURL(video.src)
    stream.getTracks().forEach((track) => track.stop())
    onProgress?.(100)

    console.log("[v0][video] Trim complete:", blob.size, "bytes", mimeType)
    return blob
  } catch (error) {
    console.error("[v0][video] Trim error:", error)
    throw error
  }
}

function getTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  preset: CompressionPreset,
): { width: number; height: number } {
  let targetHeight: number

  switch (preset) {
    case "fast720":
      targetHeight = 720
      break
    case "small540":
      targetHeight = 540
      break
    case "cutOnly":
      // Keep original dimensions
      return { width: sourceWidth, height: sourceHeight }
    default:
      targetHeight = 720
  }

  // Maintain aspect ratio
  const aspectRatio = sourceWidth / sourceHeight
  const targetWidth = Math.round(targetHeight * aspectRatio)

  // Ensure even dimensions for video encoding
  return {
    width: targetWidth % 2 === 0 ? targetWidth : targetWidth + 1,
    height: targetHeight % 2 === 0 ? targetHeight : targetHeight + 1,
  }
}

function getBitrate(preset: CompressionPreset): number {
  switch (preset) {
    case "fast720":
      return 2_500_000 // 2.5 Mbps
    case "small540":
      return 1_500_000 // 1.5 Mbps
    case "cutOnly":
      return 5_000_000 // 5 Mbps
    default:
      return 2_500_000
  }
}

export function estimateOutputSize(durationSec: number, preset: CompressionPreset): string {
  const bitrate = getBitrate(preset)
  const sizeMB = (durationSec * bitrate) / 8 / 1_000_000
  return `~${sizeMB.toFixed(1)} MB`
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
