'use client'

export const isBrowser = () => typeof window !== 'undefined'

export function readLS(key: string, fallback: string | null = null) {
  if (!isBrowser()) return fallback
  try {
    return window.localStorage.getItem(key)
  } catch {
    return fallback
  }
}

export function writeLS(key: string, value: string) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export function removeLS(key: string) {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
/**
 * Storage utilities for Supabase Storage
 * Handles video clips, PDFs, and user uploads with signed URLs
 */

const MOCK_STORAGE = new Map<string, Blob>()

export interface UploadOptions {
  contentType?: string
  upsert?: boolean
  cacheControl?: string
}

/**
 * Upload a file to Supabase Storage
 * @param bucket - Storage bucket name (e.g., "clips", "standard-pdf", "personal")
 * @param path - File path within bucket (e.g., "user123/analysis456.mp4")
 * @param file - File or Blob to upload
 * @param options - Upload options
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File | Blob,
  options: UploadOptions = {},
): Promise<string> {
  console.log("[v0][storage] Uploading to", bucket, path, file.size, "bytes")

  // TODO: Replace with real Supabase when integrated
  // const { error } = await supabase.storage
  //   .from(bucket)
  //   .upload(path, file, {
  //     contentType: options.contentType || file.type,
  //     upsert: options.upsert ?? true,
  //     cacheControl: options.cacheControl || "3600",
  //   })
  // if (error) throw error

  // Mock implementation: store in memory
  const key = `${bucket}/${path}`
  MOCK_STORAGE.set(key, file)

  return path
}

/**
 * Get a signed URL for a file in Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  console.log("[v0][storage] Getting signed URL for", bucket, path)

  // TODO: Replace with real Supabase when integrated
  // const { data, error } = await supabase.storage
  //   .from(bucket)
  //   .createSignedUrl(path, expiresIn)
  // if (error) throw error
  // return data.signedUrl

  // Mock implementation: return blob URL
  const key = `${bucket}/${path}`
  const blob = MOCK_STORAGE.get(key)
  if (!blob) {
    throw new Error(`File not found: ${key}`)
  }
  return URL.createObjectURL(blob)
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromStorage(bucket: string, path: string): Promise<void> {
  console.log("[v0][storage] Deleting", bucket, path)

  // TODO: Replace with real Supabase when integrated
  // const { error } = await supabase.storage.from(bucket).remove([path])
  // if (error) throw error

  // Mock implementation
  const key = `${bucket}/${path}`
  MOCK_STORAGE.delete(key)
}

/**
 * Upload a video clip for analysis
 * Handles path generation and metadata
 */
export async function uploadClip(userId: string, analysisId: string, blob: Blob): Promise<string> {
  const path = `${userId}/${analysisId}.mp4`

  await uploadToStorage("clips", path, blob, {
    contentType: blob.type || "video/mp4",
    upsert: true,
  })

  return path
}

/**
 * Get a signed URL for a video clip
 */
export async function getClipUrl(path: string): Promise<string> {
  return getSignedUrl("clips", path, 3600)
}

/**
 * Upload a PDF to the standard database
 */
export async function uploadStandardPdf(filename: string, blob: Blob, metadata: any): Promise<string> {
  const timestamp = Date.now()
  const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
  const path = `pdf/${timestamp}_${cleanName}`

  await uploadToStorage("standard-pdf", path, blob, {
    contentType: "application/pdf",
  })

  return path
}

/**
 * Get a signed URL for a PDF
 */
export async function getPdfUrl(bucket: string, path: string): Promise<string> {
  return getSignedUrl(bucket, path, 3600)
}
