import React, { useEffect, useCallback, useState } from 'react';
import { useTimetableStore } from '../store/timetableStore';

export function Navigation() {
  const {
    filteredResults,
    currentPage,
    setCurrentPage,
    viewMode,
    setViewMode,
    pageSize,
  } = useTimetableStore();

  const totalItems = filteredResults.length;
  const totalPages = viewMode === 'single'
    ? totalItems
    : Math.ceil(totalItems / pageSize);

  const [jumpValue, setJumpValue] = useState('');

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, setCurrentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const handleJump = () => {
    const num = parseInt(jumpValue);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setCurrentPage(num - 1);
      setJumpValue('');
    }
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="p-2 rounded-lg glass text-surface-300 hover:text-surface-100 disabled:opacity-30
            disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Previous timetable"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <span className="text-sm text-surface-300 font-medium tabular-nums min-w-[100px] text-center">
          <span className="text-surface-100">{currentPage + 1}</span>
          <span className="text-surface-500 mx-1">/</span>
          <span>{totalPages}</span>
        </span>

        <button
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
          className="p-2 rounded-lg glass text-surface-300 hover:text-surface-100 disabled:opacity-30
            disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Next timetable"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Jump input */}
        <div className="flex items-center gap-1 ml-2">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            placeholder="#"
            className="w-14 px-2 py-1.5 rounded-lg bg-surface-800/60 border border-surface-600/30
              text-xs text-surface-200 text-center placeholder:text-surface-600
              focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
            aria-label="Jump to page"
          />
          <button
            onClick={handleJump}
            className="px-2 py-1.5 rounded-lg text-xs text-surface-400 hover:text-surface-200
              bg-surface-800/40 hover:bg-surface-700/50 transition-all cursor-pointer"
            aria-label="Go to page"
          >
            Go
          </button>
        </div>
      </div>

      {/* View mode */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg glass">
        <button
          onClick={() => setViewMode('single')}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            viewMode === 'single'
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-surface-400 hover:text-surface-200'
          }`}
          aria-label="Single view"
          title="Single view"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            viewMode === 'grid'
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-surface-400 hover:text-surface-200'
          }`}
          aria-label="Grid view"
          title="Grid view"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Navigation;
