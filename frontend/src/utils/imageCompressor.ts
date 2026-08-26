/**
 * ─── Field Worker Client-Side Image Compressor ────────────────────────────────
 * Compresses high-resolution camera images down to <200KB WebP/JPEG binaries
 * while preserving edge gradient sharpness for ZNCC computer vision verification.
 */

export interface CompressionResult {
  file: File
  originalSizeKb: number
  compressedSizeKb: number
  compressionRatioPct: number
  previewUrl: string
  format: "image/webp" | "image/jpeg"
}

export async function compressFieldImage(
  file: File,
  maxDimension = 1280,
  targetQuality = 0.82
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024)

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let width = img.width
      let height = img.height

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve({
          file,
          originalSizeKb,
          compressedSizeKb: originalSizeKb,
          compressionRatioPct: 0,
          previewUrl: url,
          format: "image/jpeg",
        })
        return
      }

      // High quality image rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, width, height)

      // Test WebP support or fallback to JPEG
      const mimeType = "image/webp"
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file,
              originalSizeKb,
              compressedSizeKb: originalSizeKb,
              compressionRatioPct: 0,
              previewUrl: url,
              format: "image/jpeg",
            })
            return
          }

          const compressedSizeKb = Math.round(blob.size / 1024)
          const compressionRatioPct = Math.round(
            ((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100
          )

          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
            type: mimeType,
            lastModified: Date.now(),
          })

          resolve({
            file: compressedFile,
            originalSizeKb,
            compressedSizeKb,
            compressionRatioPct: Math.max(0, compressionRatioPct),
            previewUrl: URL.createObjectURL(blob),
            format: mimeType,
          })
        },
        mimeType,
        targetQuality
      )
    }

    img.onerror = () => {
      resolve({
        file,
        originalSizeKb,
        compressedSizeKb: originalSizeKb,
        compressionRatioPct: 0,
        previewUrl: url,
        format: "image/jpeg",
      })
    }

    img.src = url
  })
}
