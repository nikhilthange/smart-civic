import React, { useEffect, useRef, useState } from 'react';
import { Eye, Sparkles, Layers } from 'lucide-react';

export interface BoundingBoxItem {
  label: string;
  category?: string;
  confidence: number;
  box: [number, number, number, number]; // [x_min, y_min, x_max, y_max] or normalized
}

interface VisionBoundingBoxCanvasProps {
  imageUrl: string;
  boundingBoxes?: BoundingBoxItem[];
  primaryCategory?: string;
  overallConfidence?: number;
  showScanEffect?: boolean;
  className?: string;
}


const CATEGORY_COLORS: Record<string, { stroke: string; fill: string; text: string; bg: string }> = {
  pothole: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  garbage_overflow: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  open_manhole: { stroke: '#dc2626', fill: 'rgba(220, 38, 38, 0.25)', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  broken_streetlight: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)', text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  waterlogging: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', text: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  fallen_tree: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  sewage_overflow: { stroke: '#e11d48', fill: 'rgba(225, 29, 72, 0.20)', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  exposed_wire: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.20)', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  default: { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)', text: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
};

export const VisionBoundingBoxCanvas: React.FC<VisionBoundingBoxCanvasProps> = ({
  imageUrl,
  boundingBoxes = [],
  showScanEffect = true,
  className = '',
}) => {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeThreshold, setActiveThreshold] = useState<number>(0.15);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);

  // Filter boxes by threshold
  const filteredBoxes = (boundingBoxes || []).filter((b) => b.confidence >= activeThreshold);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      setImageLoaded(true);
      const containerWidth = containerRef.current?.clientWidth || 600;
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const displayHeight = containerWidth * aspectRatio;

      canvas.width = containerWidth;
      canvas.height = displayHeight;

      // Draw original image
      ctx.drawImage(img, 0, 0, containerWidth, displayHeight);

      if (!showBoxes || filteredBoxes.length === 0) return;

      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = displayHeight / img.naturalHeight;

      filteredBoxes.forEach((item) => {
        const [x1, y1, x2, y2] = item.box;
        const colorConfig = CATEGORY_COLORS[item.label.toLowerCase()] || CATEGORY_COLORS.default;

        // If normalized (0..1) vs pixel coordinates
        const isNormalized = x1 <= 1 && y1 <= 1 && x2 <= 1 && y2 <= 1;
        const bx = isNormalized ? x1 * containerWidth : x1 * scaleX;
        const by = isNormalized ? y1 * displayHeight : y1 * scaleY;
        const bw = isNormalized ? (x2 - x1) * containerWidth : (x2 - x1) * scaleX;
        const bh = isNormalized ? (y2 - y1) * displayHeight : (y2 - y1) * scaleY;

        // Bounding box rectangle
        ctx.strokeStyle = colorConfig.stroke;
        ctx.lineWidth = 3;
        ctx.fillStyle = colorConfig.fill;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillRect(bx, by, bw, bh);

        // Corner accents
        const cornerLen = Math.min(14, bw / 3, bh / 3);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Label banner
        const labelText = `${item.label.toUpperCase()} (${Math.round(item.confidence * 100)}%)`;
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillStyle = colorConfig.stroke;
        ctx.fillRect(bx, Math.max(0, by - 22), textWidth + 12, 22);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, bx + 6, Math.max(15, by - 6));
      });
    };
  }, [imageUrl, filteredBoxes, showBoxes, activeThreshold]);

  return (
    <div ref={containerRef} className={`relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 ${className}`}>
      {/* Top HUD Overlay */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-semibold text-white shadow-lg pointer-events-auto">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>YOLOv8 Vision HUD</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
              showBoxes
                ? 'bg-primary-600/90 text-white border-primary-500 shadow-md'
                : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}
          >
            <Layers className="w-3 h-3 inline mr-1" />
            {showBoxes ? 'Boxes ON' : 'Boxes OFF'}
          </button>
        </div>
      </div>

      {/* Cyber Scanning Line Animation */}
      {showScanEffect && imageLoaded && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-[scan_3s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Canvas */}
      <div className="flex items-center justify-center min-h-[220px]">
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>

      {/* Bottom Detections Summary & Confidence Slider */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-400">Detections ({filteredBoxes.length}):</span>
          {filteredBoxes.length > 0 ? (
            filteredBoxes.map((b, i) => {
              const cfg = CATEGORY_COLORS[b.label.toLowerCase()] || CATEGORY_COLORS.default;
              return (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-md font-medium text-[11px] border ${cfg.bg} ${cfg.text} flex items-center gap-1`}
                >
                  <Sparkles className="w-2.5 h-2.5 inline" />
                  {b.label} ({Math.round(b.confidence * 100)}%)
                </span>
              );
            })
          ) : (
            <span className="text-slate-500 italic">No defects detected above threshold</span>
          )}
        </div>

        {/* Confidence Filter Slider */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Threshold:</span>
          <input
            type="range"
            min="0.10"
            max="0.90"
            step="0.05"
            value={activeThreshold}
            onChange={(e) => setActiveThreshold(parseFloat(e.target.value))}
            className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <span className="text-slate-300 font-mono text-[11px] w-8">
            {Math.round(activeThreshold * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
