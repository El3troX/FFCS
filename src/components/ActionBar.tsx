import React from 'react';
import { useTimetableStore } from '../store/timetableStore';

export function ActionBar() {
  const {
    selectedIndices,
    clearSelection,
    setComparisonMode,
    filteredResults,
    addToast,
  } = useTimetableStore();

  const count = selectedIndices.size;
  if (count === 0) return null;

  const canCompare = count >= 2 && count <= 4;

  const handleSave = async () => {
    const { saveTimetable, getNextSavedNumber } = await import('../storage/storageLayer');
    const selected = [...selectedIndices].map(i => filteredResults[i]).filter(Boolean);
    // Since getNextSavedNumber increments and returns the new value, we should probably 
    // fetch once, then increment locally, and update settings if there are multiple. 
    // Actually, getNextSavedNumber updates it in DB. Doing it in a loop is fine.
    
    for (const tt of selected) {
      const num = await getNextSavedNumber();
      await saveTimetable({
        id: `${Date.now()}-${num}`,
        number: num,
        timetable: tt,
        savedAt: Date.now(),
        csvContent: generateCSV(tt),
      });
    }

    addToast({
      message: `Saved ${selected.length} timetable${selected.length > 1 ? 's' : ''}!`,
      type: 'success',
    });
    clearSelection();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <div className="glass-strong rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-surface-300">
            <span className="font-semibold text-surface-100">{count}</span> selected
          </span>

          <div className="flex items-center gap-2">
            {canCompare && (
              <button
                onClick={() => setComparisonMode(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold btn-gradient hover:btn-gradient-hover
                  transition-all cursor-pointer"
                aria-label={`Compare ${count} timetables`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  Compare ({count})
                </span>
              </button>
            )}

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-emerald/20 text-emerald-400
                border border-emerald-500/20 hover:bg-accent-emerald/30 transition-all cursor-pointer"
              aria-label={`Save ${count} timetables`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                Save ({count})
              </span>
            </button>

            <button
              onClick={clearSelection}
              className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700/50
                transition-all cursor-pointer"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate CSV content from a timetable
function generateCSV(tt: import('../types').Timetable): string {
  const lines = ['Subject,Faculty,Slot,Venue'];
  for (const c of tt.choices) {
    lines.push(`"${c.subjectName}","${c.option.faculty}","${c.option.slot}","${c.option.venue}"`);
  }
  return lines.join('\n');
}

export default ActionBar;
