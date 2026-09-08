import React, { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"
import { QrCode, X, AlertCircle } from "lucide-react"
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

  const [manualAssetId, setManualAssetId] = useState("")

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualAssetId.trim()) return
    const assetData: ScannedAssetData = {
      assetId: manualAssetId.trim().toUpperCase(),
    }
    toast.success(`Asset Tag Attached: ${assetData.assetId}`)
    onScan(assetData)
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

        {/* Manual Asset ID Option */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Or Enter Asset Tag ID Manually:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ELD-POLE-104 or BMC-ASSET-ID"
              value={manualAssetId}
              onChange={(e) => setManualAssetId(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!manualAssetId.trim()}
              className="text-xs font-semibold rounded-xl h-8 px-4"
            >
              Attach Tag
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
