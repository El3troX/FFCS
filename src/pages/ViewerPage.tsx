import React from 'react';
import { useTimetableStore } from '../store/timetableStore';
import { SearchBar } from '../components/SearchBar';
import { Navigation } from '../components/Navigation';
import { TimetableCard } from '../components/TimetableCard';
import { ActionBar } from '../components/ActionBar';
import { ComparisonView } from '../components/ComparisonView';
import { TimetableGrid } from '../components/TimetableGrid';
import { PerSubjectTeacherFilter } from '../components/PerSubjectTeacherFilter';

export function ViewerPage() {
  const { 
    filteredResults, 
    currentPage, 
    pageSize, 
    viewMode,
    generationComplete,
    comparisonMode,
    setViewMode 
  } = useTimetableStore();

  if (!generationComplete || filteredResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-24 h-24 mb-6 rounded-full bg-surface-800/50 flex items-center justify-center shadow-inner">
          <svg className="w-12 h-12 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-surface-200 mb-2">No Results to Display</h2>
        <p className="text-surface-400 text-center max-w-md">
          {generationComplete 
            ? "Your current filters are too restrictive. Try clearing some filters or search terms."
            : "Generate timetables first from the Generate tab to view them here."}
        </p>
      </div>
    );
  }

  // Calculate current page slice
  const effectivePageSize = viewMode === 'single' ? 1 : pageSize;
  const startIndex = currentPage * effectivePageSize;
  const endIndex = startIndex + effectivePageSize;
  const currentTimetables = filteredResults.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 glass-card rounded-xl sticky top-20 z-30">
        <div className="w-full md:max-w-xs">
          <SearchBar />
        </div>
        
        <div className="flex items-center gap-4 justify-between md:justify-end flex-1">
          <div className="flex bg-surface-800/50 p-1 rounded-lg border border-surface-700/50">
            <button
              onClick={() => setViewMode('single')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'single' ? 'bg-surface-700 text-brand-300 shadow-sm' : 'text-surface-400 hover:text-surface-200'}`}
              title="Single View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 10.5h13.5m-13.5 3h13.5m-13.5 3h13.5m-13.5-9h13.5" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-700 text-brand-300 shadow-sm' : 'text-surface-400 hover:text-surface-200'}`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
          </div>
          <Navigation />
        </div>
      </div>

      {/* Per-Subject Filters */}
      <PerSubjectTeacherFilter />

      {/* Results */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : 'space-y-6'}>
        {currentTimetables.map((timetable, idx) => (
          <TimetableCard 
            key={timetable.id} 
            timetable={timetable} 
            index={startIndex + idx}
          />
        ))}
      </div>

      {/* Bottom Action Bar */}
      <ActionBar />

      {/* Comparison Modal */}
      {comparisonMode && <ComparisonView 
        timetables={filteredResults.filter((_, i) => useTimetableStore.getState().selectedIndices.has(i))} 
        onClose={() => useTimetableStore.getState().setComparisonMode(false)} 
      />}
    </div>
  );
}
