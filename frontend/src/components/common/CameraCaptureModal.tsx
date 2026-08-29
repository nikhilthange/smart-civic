import React, { useRef, useState, useEffect, useCallback } from "react"
import { Camera, RefreshCw, Check, X, AlertTriangle } from "lucide-react"

interface CameraCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setErrorMsg(null)
    setCapturedImage(null)
    setCapturedFile(null)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })

      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err)
      setErrorMsg("Unable to access device camera. Please check browser permissions.")
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  const snapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" })
        const dataUrl = canvas.toDataURL("image/jpeg")
        setCapturedImage(dataUrl)
        setCapturedFile(file)
        stopCamera()
      }
    }, "image/jpeg", 0.9)
  }

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile)
      stopCamera()
      onClose()
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setCapturedFile(null)
    startCamera()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Live Camera Snap
          </h3>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg ? (
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90"
            >
              Retry Camera Access
            </button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Action Controls */}
        {!errorMsg && (
          <div className="flex items-center justify-between pt-2">
            {capturedImage ? (
              <>
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake Photo
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Use Photo
                </button>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <button
                  onClick={snapPhoto}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  Snap Photo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
