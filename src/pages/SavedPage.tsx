import React, { useState, useEffect } from 'react';
import { SavedTimetablesPanel } from '../components/SavedTimetablesPanel';
import { getSavedTimetables } from '../storage/storageLayer';
import type { SavedTimetable } from '../types';
import { saveAllTimetables } from '../engine/exportService';
import { useTimetableStore } from '../store/timetableStore';

export function SavedPage() {
  const [savedTimetables, setSavedTimetables] = useState<SavedTimetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Need to reload when activePage becomes 'saved'
  const activePage = useTimetableStore(state => state.activePage);

  useEffect(() => {
    if (activePage === 'saved') {
      loadSavedTimetables();
    }
  }, [activePage]);

  const loadSavedTimetables = async () => {
    setLoading(true);
    try {
      const saved = await getSavedTimetables();
      // Sort newest first
      saved.sort((a, b) => b.savedAt - a.savedAt);
      setSavedTimetables(saved);
    } catch (err) {
      console.error("Failed to load saved timetables", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchExport = async () => {
    if (savedTimetables.length === 0) return;
    
    setIsExporting(true);
    try {
      // Find lowest number in the current set as a baseline, or just 1
      const startNumber = savedTimetables.length > 0 
        ? Math.min(...savedTimetables.map(s => s.number || 1)) 
        : 1;
        
      const { exportPNG, exportPDF } = await import('../engine/exportService');
      
      const exportItems = [];
      for (const s of savedTimetables) {
        const wrapper = document.getElementById(`timetable-export-wrapper-${s.id}`);
        if (!wrapper) {
          console.warn(`Element not found for timetable ${s.id}`);
          continue;
        }
        const el = wrapper.querySelector('.timetable-grid') as HTMLElement;
        if (!el) {
          console.warn(`Inner grid not found for timetable ${s.id}`);
          continue;
        }
        
        const pngBlob = await exportPNG(el);
        const pdfBlob = await exportPDF(el, s.timetable);
        exportItems.push({
          timetable: s.timetable,
          pngBlob,
          pdfBlob,
          csvContent: s.csvContent || ''
        });
      }
      
      await saveAllTimetables(exportItems, startNumber);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export timetables. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-xl border-brand-500/20">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            Saved Timetables
          </h2>
          <p className="text-surface-400 mt-1 text-sm">
            Your collection of favorite schedules, saved to this browser.
          </p>
        </div>
        
        <button
          onClick={handleBatchExport}
          disabled={savedTimetables.length === 0 || isExporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-50 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-surface-600"
        >
          {isExporting ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
          Batch Export All ({savedTimetables.length})
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <svg className="w-8 h-8 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <SavedTimetablesPanel 
          timetables={savedTimetables} 
          onDelete={loadSavedTimetables} 
        />
      )}
    </div>
  );
}
