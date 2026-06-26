import React, { useState } from 'react';
import { useTimetableStore } from '../store/timetableStore';
import { useTimetableEngine } from '../hooks/useTimetableEngine';
import { DataUpload } from '../components/DataUpload';
import { TeacherFilterPanel } from '../components/TeacherFilterPanel';
import { FilterPanel } from '../components/FilterPanel';
import { ProgressBar } from '../components/ProgressBar';
import { StatsPanel } from '../components/StatsPanel';

export function GeneratorPage() {
  const { loadData, startGeneration, dataLoaded, isGenerating, generationComplete } = useTimetableEngine();
  const { parsedData, generationError, sidebarOpen, setSidebarOpen } = useTimetableStore();
  const [showFilters, setShowFilters] = useState(true);

  return (
    <div className="flex gap-6 min-h-[calc(100vh-5rem)] animate-fade-in">
      {/* Sidebar — filters */}
      {dataLoaded && (
        <aside
          className={`
            shrink-0 transition-all duration-300 overflow-hidden
            ${sidebarOpen ? 'w-80' : 'w-0'}
          `}
        >
          <div className="w-80 space-y-4 sticky top-20">
            {/* Teacher filters */}
            <div className="glass-card rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-surface-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  Faculty Preferences
                </span>
                <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showFilters && (
                <div className="px-4 pb-4 animate-fade-in">
                  <TeacherFilterPanel />
                </div>
              )}
            </div>

            {/* Other filters */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-surface-200 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
              </h3>
              <FilterPanel />
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 py-4 animate-slide-up">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">TimetableGen</span>
            </h1>
            <p className="text-sm text-surface-400 max-w-md mx-auto">
              Generate optimal university timetables with smart constraint solving.
              Upload your data, set preferences, and find your perfect schedule.
            </p>
          </div>

          {/* Sidebar toggle */}
          {dataLoaded && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mb-4 flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs
                text-surface-300 hover:text-surface-100 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
          )}

          {/* Upload / Summary */}
          <DataUpload onLoadData={loadData} />

          {/* Generate button */}
          {dataLoaded && !isGenerating && (
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <button
                onClick={startGeneration}
                disabled={!parsedData || parsedData.subjects.length === 0}
                className="w-full py-4 rounded-xl text-base font-bold btn-gradient
                  hover:btn-gradient-hover disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-300 cursor-pointer
                  shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
                aria-label="Generate timetables"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  Generate Timetables
                </span>
              </button>
            </div>
          )}

          {/* Progress */}
          <ProgressBar />

          {/* Error */}
          {generationError && (
            <div className="glass-card rounded-xl p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-300">Generation Error</h4>
                  <p className="text-xs text-surface-400 mt-1">{generationError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {generationComplete && <StatsPanel />}
        </div>
      </main>
    </div>
  );
}

export default GeneratorPage;
