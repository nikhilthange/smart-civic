/**
 * ─── Client-Side EXIF GPS & Metadata Extractor ────────────────────────────────
 * Robust binary parser for JPEG/TIFF EXIF metadata extracting embedded GPS coordinates
 * and timestamps directly in the browser with 0 external dependencies.
 */

export interface ExifData {
  latitude?: number
  longitude?: number
  timestamp?: Date
  cameraModel?: string
  isExifGps?: boolean
}

function parseRational(dataView: DataView, offset: number, littleEndian: boolean): number {
  const num = dataView.getUint32(offset, littleEndian)
  const den = dataView.getUint32(offset + 4, littleEndian)
  return den === 0 ? 0 : num / den
}

function parseDMS(dataView: DataView, offset: number, tiffStart: number, littleEndian: boolean): number {
  const deg = parseRational(dataView, tiffStart + offset, littleEndian)
  const min = parseRational(dataView, tiffStart + offset + 8, littleEndian)
  const sec = parseRational(dataView, tiffStart + offset + 16, littleEndian)
  return deg + min / 60 + sec / 3600
}

export async function extractExifCoordinates(file: File): Promise<ExifData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        if (!buffer || buffer.byteLength < 64) {
          resolve(null)
          return
        }

        const dataView = new DataView(buffer)
        // Check JPEG SOI marker (0xFFD8)
        if (dataView.getUint16(0, false) !== 0xffd8) {
          resolve(null)
          return
        }

        let offset = 2
        const length = dataView.byteLength

        while (offset < length - 4) {
          const marker = dataView.getUint16(offset, false)
          offset += 2

          // APP1 Marker (0xFFE1) contains EXIF
          if (marker === 0xffe1) {
            offset += 2 // skip marker length

            // Check "Exif\0\0" string (0x45786966 0x0000)
            if (
              dataView.getUint32(offset, false) === 0x45786966 &&
              dataView.getUint16(offset + 4, false) === 0x0000
            ) {
              const tiffStart = offset + 6
              const byteOrder = dataView.getUint16(tiffStart, false)
              const littleEndian = byteOrder === 0x4949 // 'II'

              // Check TIFF 42 marker
              if (dataView.getUint16(tiffStart + 2, littleEndian) !== 0x002a) {
                resolve(null)
                return
              }

              const firstIfdOffset = dataView.getUint32(tiffStart + 4, littleEndian)
              if (firstIfdOffset < 8) {
                resolve(null)
                return
              }

              let ifdOffset = tiffStart + firstIfdOffset
              const numEntries = dataView.getUint16(ifdOffset, littleEndian)
              ifdOffset += 2

              let gpsIfdOffset: number | null = null

              for (let i = 0; i < numEntries; i++) {
                const tag = dataView.getUint16(ifdOffset + i * 12, littleEndian)
                // Tag 0x8825 = GPSInfo IFD pointer
                if (tag === 0x8825) {
                  gpsIfdOffset = dataView.getUint32(ifdOffset + i * 12 + 8, littleEndian)
                  break
                }
              }

              if (gpsIfdOffset !== null) {
                let gpsOffset = tiffStart + gpsIfdOffset
                const numGpsEntries = dataView.getUint16(gpsOffset, littleEndian)
                gpsOffset += 2

                let latRef = "N"
                let lonRef = "E"
                let latVal: number | null = null
                let lonVal: number | null = null

                for (let i = 0; i < numGpsEntries; i++) {
                  const tag = dataView.getUint16(gpsOffset + i * 12, littleEndian)
                  const valOffset = dataView.getUint32(gpsOffset + i * 12 + 8, littleEndian)

                  // 0x0001: GPSLatitudeRef
                  if (tag === 0x0001) {
                    latRef = String.fromCharCode(dataView.getUint8(gpsOffset + i * 12 + 8))
                  }
                  // 0x0002: GPSLatitude
                  else if (tag === 0x0002) {
                    latVal = parseDMS(dataView, valOffset, tiffStart, littleEndian)
                  }
                  // 0x0003: GPSLongitudeRef
                  else if (tag === 0x0003) {
                    lonRef = String.fromCharCode(dataView.getUint8(gpsOffset + i * 12 + 8))
                  }
                  // 0x0004: GPSLongitude
                  else if (tag === 0x0004) {
                    lonVal = parseDMS(dataView, valOffset, tiffStart, littleEndian)
                  }
                }

                if (latVal !== null && lonVal !== null) {
                  if (latRef === "S") latVal = -latVal
                  if (lonRef === "W") lonVal = -lonVal

                  resolve({
                    latitude: Number(latVal.toFixed(6)),
                    longitude: Number(lonVal.toFixed(6)),
                    timestamp: new Date(),
                    isExifGps: true,
                  })
                  return
                }
              }
            }
            break
          } else if ((marker & 0xff00) !== 0xff00) {
            break
          } else {
            const markerLength = dataView.getUint16(offset, false)
            offset += markerLength
          }
        }

        resolve(null)
      } catch {
        resolve(null)
      }
    }

    reader.onerror = () => resolve(null)
    // Read first 128KB which is sufficient for EXIF metadata headers
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024))
  })
}

