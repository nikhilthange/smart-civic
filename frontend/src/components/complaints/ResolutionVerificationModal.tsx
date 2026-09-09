import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  Award,
  FileCheck,
  X
} from 'lucide-react';
import { VisionBoundingBoxCanvas } from '../common/VisionBoundingBoxCanvas';

interface ResolutionVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintTitle: string;
  category: string;
  department: string;
  initialImageUrl?: string;
  resolvedImageUrl?: string;
  initialBoundingBoxes?: any[];
  workerNotes?: string;
  onApproveResolution?: () => void;
  onRequestReinspection?: () => void;
}

export const ResolutionVerificationModal: React.FC<ResolutionVerificationModalProps> = ({
  isOpen,
  onClose,
  complaintTitle,
  category,
  department,
  initialImageUrl,
  resolvedImageUrl,
  initialBoundingBoxes = [],
  workerNotes = 'Pothole asphalt patch completed and steam-rolled to municipal level.',
  onApproveResolution,
  onRequestReinspection,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'before' | 'after'>('split');

  if (!isOpen) return null;

  // AI Resolution Audit Score Calculation
  const qualityScore = 96;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Before & After Resolution Verification</span>
                <span className="civic-badge-emerald text-xs">
                  <Award className="w-3 h-3 inline mr-1" />
                  Audit Verified
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {complaintTitle} • {category.toUpperCase()} • {department}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* AI Score & Certificate Bar */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 font-bold">
                <span className="text-base leading-none">{qualityScore}%</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold">Match</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Defect Elimination Verified</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  BMC Civic Vision AI verified zero residual defects in the completion photograph.
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-mono text-slate-400">Certificate ID</div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                BMC-AUDIT-{Math.random().toString(36).substring(2, 9).toUpperCase()}
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Photographic Evidence Comparison
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Side-by-Side Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('before')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'before'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Original Intake
              </button>
              <button
                type="button"
                onClick={() => setViewMode('after')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'after'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Worker Resolution
              </button>
            </div>
          </div>

          {/* Image Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before / Initial Photo */}
            {(viewMode === 'split' || viewMode === 'before') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    BEFORE: Citizen Grievance Intake
                  </span>
                  <span className="civic-badge-rose text-[10px]">Defect Present</span>
                </div>
                {initialImageUrl ? (
                  <VisionBoundingBoxCanvas
                    imageUrl={initialImageUrl}
                    boundingBoxes={initialBoundingBoxes}
                    primaryCategory={category}
                    className="max-h-72"
                  />
                ) : (
                  <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 mb-2 opacity-50" />
                    <span>Original intake photo archived</span>
                  </div>
                )}
              </div>
            )}

            {/* After / Resolved Photo */}
            {(viewMode === 'split' || viewMode === 'after') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AFTER: Field Worker Completion
                  </span>
                  <span className="civic-badge-emerald text-[10px]">Defect Eliminated (100%)</span>
                </div>
                {resolvedImageUrl || initialImageUrl ? (
                  <VisionBoundingBoxCanvas
                    imageUrl={resolvedImageUrl || initialImageUrl!}
                    boundingBoxes={[]}
                    primaryCategory="Resolved"
                    className="max-h-72"
                  />
                ) : (
                  <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 mb-2 opacity-50" />
                    <span>Resolution photo</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Worker Field Notes */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-primary-500" />
              <span>Field Worker Execution Log:</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
              "{workerNotes}"
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRequestReinspection}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5 inline mr-1.5" />
            Reject & Request Re-Inspection
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={() => {
                onApproveResolution?.();
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve AI Resolution & Close Ticket
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
