import React from 'react';
import { useTimetableStore } from '../store/timetableStore';

export function ProgressBar() {
  const { isGenerating, progress, cancelGeneration } = useTimetableStore();

  if (!isGenerating && !progress) return null;

  const pct = progress ? Math.min(progress.percentage, 100) : 0;
  const isLargeSearch = progress && progress.estimatedTotal > 10_000_000;

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 rounded-full border-2 border-brand-500/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-400 animate-spin" />
            </div>
          )}
          <h3 className="text-sm font-semibold text-surface-200">
            {isGenerating ? 'Generating Timetables...' : 'Generation Complete'}
          </h3>
        </div>

        {isGenerating && (
          <button
            onClick={cancelGeneration}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-accent-rose/15 text-rose-400
              border border-rose-500/20 hover:bg-accent-rose/25 transition-all cursor-pointer"
            aria-label="Cancel generation"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 rounded-full bg-surface-700/50 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
          }}
        >
          {isGenerating && (
            <div className="absolute inset-0 progress-shimmer" />
          )}
        </div>
        {isGenerating && (
          <div
            className="absolute inset-y-0 rounded-full animate-pulse-glow"
            style={{ left: `${Math.max(pct - 1, 0)}%`, width: '8px' }}
          />
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-surface-400">
        <div className="flex items-center gap-4">
          <span>
            <span className="text-surface-200 font-medium">
              {progress ? progress.nodesExplored.toLocaleString() : '0'}
            </span>{' '}
            explored
          </span>
          <span>
            <span className="text-accent-cyan font-medium">
              {progress ? progress.validCount.toLocaleString() : '0'}
            </span>{' '}
            valid
          </span>
        </div>
        <span className="font-medium text-surface-300">
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Large search warning */}
      {isLargeSearch && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-[0.7rem] text-amber-300/80">
            Large search space ({(progress!.estimatedTotal / 1_000_000).toFixed(1)}M combinations).
            Consider blacklisting some faculty to narrow results.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
