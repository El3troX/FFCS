import React, { useState, useMemo } from 'react';
import type { SavedTimetable } from '../types';
import { TimetableGrid } from './TimetableGrid';

type SavedTimetablesPanelProps = {
  timetables: SavedTimetable[];
  onDelete: () => void;
};

export function SavedTimetablesPanel({ timetables, onDelete }: SavedTimetablesPanelProps) {


  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      // Assuming deleteTimetable is imported from storageLayer. If not, we trigger onDelete and it handles reload
      const { deleteTimetable } = await import('../storage/storageLayer');
      await deleteTimetable(id);
      onDelete();
    } catch (e) {
      console.error(e);
    }
    setDeleteConfirm(null);
  };

  const [isExportingId, setIsExportingId] = useState<string | null>(null);
  const [downloadMenuOpenId, setDownloadMenuOpenId] = useState<string | null>(null);

  const handleDownloadSingle = async (st: SavedTimetable, format: 'png' | 'pdf') => {
    setIsExportingId(st.id);
    setDownloadMenuOpenId(null);
    try {
      const { exportPNG, exportPDF, downloadBlob } = await import('../engine/exportService');
      
      const wrapper = document.getElementById(`timetable-export-wrapper-${st.id}`);
      if (!wrapper) throw new Error("Wrapper not found");
      const el = wrapper.querySelector('.timetable-grid') as HTMLElement;
      if (!el) throw new Error("Grid not found");

      const filename = `Timetable_${st.number.toString().padStart(3, '0')}.${format}`;

      if (format === 'png') {
        const pngBlob = await exportPNG(el);
        downloadBlob(pngBlob, filename);
      } else {
        const pdfBlob = await exportPDF(el, st.timetable);
        downloadBlob(pdfBlob, filename);
      }
    } catch (e) {
      console.error(`Export ${format} failed`, e);
      alert(`Failed to export ${format.toUpperCase()}.`);
    } finally {
      setIsExportingId(null);
    }
  };

  const handleDownloadBoth = async (st: SavedTimetable) => {
    setIsExportingId(st.id);
    setDownloadMenuOpenId(null);
    try {
      const { exportPNG, exportPDF, saveAllTimetables } = await import('../engine/exportService');
      
      const wrapper = document.getElementById(`timetable-export-wrapper-${st.id}`);
      if (!wrapper) throw new Error("Wrapper not found");
      const el = wrapper.querySelector('.timetable-grid') as HTMLElement;
      if (!el) throw new Error("Grid not found");

      const pngBlob = await exportPNG(el);
      const pdfBlob = await exportPDF(el, st.timetable);

      await saveAllTimetables([{
        timetable: st.timetable,
        pngBlob,
        pdfBlob,
        csvContent: st.csvContent || ''
      }], st.number || 1);
    } catch (e) {
      console.error("Export both failed", e);
      alert("Failed to export timetable.");
    } finally {
      setIsExportingId(null);
    }
  };

  // Close dropdown if clicked outside
  React.useEffect(() => {
    const handleClickOutside = () => setDownloadMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (timetables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-surface-800/50 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-300 mb-2">No Saved Timetables</h3>
        <p className="text-sm text-surface-500 text-center max-w-xs">
          Generate timetables and save your favorites to view them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Saved ({timetables.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {timetables.map((st, i) => (
          <div
            key={st.id}
            className="glass-card rounded-xl overflow-hidden animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-surface-100">
                  #{st.number.toString().padStart(3, '0')}
                </span>
                <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 font-medium">
                  {st.timetable.totalCredits} cr
                </span>
                <span className="text-[0.6rem] text-surface-500">
                  {new Date(st.savedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setDownloadMenuOpenId(downloadMenuOpenId === st.id ? null : st.id)}
                    disabled={isExportingId === st.id}
                    className={`p-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 ${
                      downloadMenuOpenId === st.id ? 'bg-brand-500/20 text-brand-400' : 'text-surface-400 hover:text-brand-400 hover:bg-brand-500/10'
                    }`}
                    aria-label="Download options"
                    title="Download options"
                  >
                    {isExportingId === st.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    )}
                  </button>

                  {downloadMenuOpenId === st.id && (
                    <div className="absolute right-0 mt-1 w-44 rounded-lg bg-surface-800 border border-surface-600/50 shadow-xl overflow-hidden z-10 animate-fade-in">
                      <div className="py-1 flex flex-col">
                        <button
                          onClick={() => handleDownloadSingle(st, 'png')}
                          className="px-3 py-2 text-xs text-left text-surface-200 hover:bg-brand-500/20 hover:text-brand-300 transition-colors cursor-pointer"
                        >
                          Timetable Image (PNG)
                        </button>
                        <button
                          onClick={() => handleDownloadSingle(st, 'pdf')}
                          className="px-3 py-2 text-xs text-left text-surface-200 hover:bg-brand-500/20 hover:text-brand-300 transition-colors cursor-pointer"
                        >
                          Timetable + Report (PDF)
                        </button>
                        <button
                          onClick={() => handleDownloadBoth(st)}
                          className="px-3 py-2 text-xs text-left text-surface-200 hover:bg-brand-500/20 hover:text-brand-300 transition-colors cursor-pointer"
                        >
                          Download Both (ZIP)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {deleteConfirm === st.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(st.id)}
                      className="px-2 py-1 rounded text-[0.6rem] bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 rounded text-[0.6rem] bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(st.id)}
                    className="p-1.5 rounded-md text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 bg-surface-900" id={`timetable-export-wrapper-${st.id}`}>
              <TimetableGrid timetable={st.timetable} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavedTimetablesPanel;
