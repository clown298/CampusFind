/**
 * Shared image rules for every upload surface (report a lost item, report a
 * found item, item photos from a recovery request, proof images).
 *
 * Phone photos are routinely 3-5 MB, which used to trip the old 500 KB limit.
 * Photos are now accepted up to 5 MB and anything larger than
 * COMPRESS_ABOVE_BYTES is resized and re-encoded in the browser before it is
 * sent, so the network payload stays small.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_LABEL = "5 MB"

// A recovery request may carry up to four proofs at once, so each proof keeps
// a smaller ceiling than an item photo. Mirrors the backend limits.
export const MAX_PROOF_IMAGE_BYTES = 2 * 1024 * 1024
export const MAX_PROOF_IMAGE_LABEL = "2 MB"

// Images below this size are uploaded untouched; larger ones are compressed.
export const COMPRESS_ABOVE_BYTES = 700 * 1024

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

export const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|webp)$/i

const MAX_IMAGE_DIMENSION = 1920
const QUALITY_STEPS = [0.82, 0.7, 0.55, 0.4]
const TARGET_BYTES = 900 * 1024

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ""
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024)
    return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Returns an error message, or null when the file may be used.
export function validateImageFile(file, maxBytes = MAX_IMAGE_BYTES, label = MAX_IMAGE_LABEL) {
  if (!file) return null

  const nameOk = ALLOWED_IMAGE_EXT.test(file.name || "")
  const type = typeof file.type === "string" ? file.type.toLowerCase() : ""
  const typeOk = !type || ALLOWED_IMAGE_TYPES.includes(type)

  if (!nameOk && !typeOk) {
    return "Only JPEG, PNG, and WebP images are allowed."
  }
  if (file.size > maxBytes) {
    return `Image is too large (${formatBytes(file.size)}). Maximum size is ${label}.`
  }
  return null
}

export function dataUrlBytes(dataUrl) {
  if (typeof dataUrl !== "string") return 0
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
  if (!base64) return 0
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Could not read the image file."))
    reader.readAsDataURL(file)
  })
}

async function loadImageElement(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
      // Fall through to the <img> decoder.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error("Could not decode the image file."))
      image.src = url
    })
  } finally {
    // The bitmap stays valid once decoded, so the object URL can go early.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

function getSourceSize(source) {
  const width = source.naturalWidth || source.width || 0
  const height = source.naturalHeight || source.height || 0
  return { width, height }
}

function canvasToDataUrl(canvas, quality) {
  try {
    return canvas.toDataURL("image/jpeg", quality)
  } catch {
    return ""
  }
}

async function compressImage(file) {
  if (typeof document === "undefined") return ""

  const source = await loadImageElement(file)
  const { width, height } = getSourceSize(source)
  if (!width || !height) return ""

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext("2d")
  if (!context) return ""

  // JPEG has no transparency; a white backdrop avoids black areas.
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, targetWidth, targetHeight)
  context.drawImage(source, 0, 0, targetWidth, targetHeight)

  if (typeof source.close === "function") source.close()

  let smallest = ""
  for (const quality of QUALITY_STEPS) {
    const dataUrl = canvasToDataUrl(canvas, quality)
    if (!dataUrl) continue
    if (dataUrlBytes(dataUrl) <= TARGET_BYTES) {
      return dataUrl
    }
    if (!smallest || dataUrl.length < smallest.length) {
      smallest = dataUrl
    }
  }
  return smallest
}

/**
 * Turns a picked file into a data URL that is small enough to upload.
 * Throws with a user-facing message when the file cannot be used.
 */
export async function prepareImageFile(file, options = {}) {
  const maxBytes = options.maxBytes || MAX_IMAGE_BYTES
  const label = options.label || MAX_IMAGE_LABEL

  const validationError = validateImageFile(file, maxBytes, label)
  if (validationError) {
    throw new Error(validationError)
  }

  if (file.size <= COMPRESS_ABOVE_BYTES) {
    return readAsDataUrl(file)
  }

  try {
    const compressed = await compressImage(file)
    if (compressed && dataUrlBytes(compressed) <= maxBytes) {
      return compressed
    }
  } catch {
    // Compression is best effort; fall back to the original file.
  }

  const original = await readAsDataUrl(file)
  if (dataUrlBytes(original) > maxBytes) {
    throw new Error(
      `Image is too large (${formatBytes(file.size)}). Maximum size is ${label}.`
    )
  }
  return original
}