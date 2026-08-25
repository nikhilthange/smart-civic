import React, { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"
import { QrCode, X, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"

export interface ScannedAssetData {
  assetId: string
  dept?: string
  category?: string
  ward?: string
  lat?: number
  lng?: number
  address?: string
}

interface QrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (asset: ScannedAssetData) => void
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const [scanError, setScanError] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const qrRegionId = "smart-civic-qr-reader"
    const scanner = new Html5QrcodeScanner(
      qrRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    )

    scanner.render(
      (decodedText: string) => {
        try {
          // Parse JSON payload or formatted asset code
          let assetData: ScannedAssetData
          if (decodedText.startsWith("{") && decodedText.endsWith("}")) {
            assetData = JSON.parse(decodedText)
          } else {
            // Format: ASSET_ID|DEPT|CATEGORY|WARD|LAT|LNG
            const parts = decodedText.split("|")
            assetData = {
              assetId: parts[0] || decodedText,
              dept: parts[1] || "ELD",
              category: parts[2] || "street_lighting",
              ward: parts[3] || "Ward H-West",
              lat: parts[4] ? parseFloat(parts[4]) : 19.0596,
              lng: parts[5] ? parseFloat(parts[5]) : 72.8295,
            }
          }

          toast.success(`✅ Scanned Asset: ${assetData.assetId}`)
          onScan(assetData)
          scanner.clear().catch(() => {})
          onClose()
        } catch {
          setScanError(`Invalid QR code format: ${decodedText}`)
        }
      },
      () => {
        // Continuous scan errors are normal while seeking QR code
      }
    )

    scannerRef.current = scanner

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [isOpen, onScan, onClose])

  if (!isOpen) return null

  // Demo asset presets for quick instant testing
  const handleSimulateScan = (presetType: "streetlight" | "pothole" | "waterpipe") => {
    let mockAsset: ScannedAssetData
    if (presetType === "streetlight") {
      mockAsset = {
        assetId: "ELD-POLE-104",
        dept: "ELD",
        category: "street_lighting",
        ward: "Ward H-West",
        lat: 19.0596,
        lng: 72.8347,
        address: "Hill Road, Bandra West, Mumbai 400050",
      }
    } else if (presetType === "pothole") {
      mockAsset = {
        assetId: "PWD-ROAD-882",
        dept: "PWD",
        category: "roads_and_infrastructure",
        ward: "Ward A",
        lat: 18.9322,
        lng: 72.8277,
        address: "MG Road, Fort, Mumbai 400001",
      }
    } else {
      mockAsset = {
        assetId: "WSD-MAIN-401",
        dept: "WSD",
        category: "water_and_sanitation",
        ward: "Ward G-South",
        lat: 19.0178,
        lng: 72.8427,
        address: "Dr Annie Besant Rd, Worli, Mumbai 400018",
      }
    }

    toast.success(`⚡ Simulated Asset QR Scan: ${mockAsset.assetId}`)
    onScan(mockAsset)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <QrCode className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Scan Municipal Asset QR Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Point your device camera at any official BMC Asset Tag (Streetlight poles, stormwater manholes, municipal water hydrants) to auto-fill defect details.
        </p>

        {/* Video Scanner Container */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 min-h-[260px] flex items-center justify-center">
          <div id="smart-civic-qr-reader" className="w-full text-white text-xs"></div>
        </div>

        {scanError && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Test Simulator Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick Test Simulator (Click to Test Asset):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSimulateScan("streetlight")}
              className="text-[11px] h-8"
            >
              💡 Streetlight Pole
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSimulateScan("pothole")}
              className="text-[11px] h-8"
            >
              🛣️ PWD Asphalt
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSimulateScan("waterpipe")}
              className="text-[11px] h-8"
            >
              🚰 Water Pipeline
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
