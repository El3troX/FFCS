import React, { useMemo, useState } from 'react';
import { useTimetableStore } from '../store/timetableStore';

export function PerSubjectTeacherFilter() {
  const { allResults, subjectTeacherFilter, setSubjectTeacherFilter, clearSubjectTeacherFilters, applyFilters } = useTimetableStore();
  const [isOpen, setIsOpen] = useState(false);

  // Compute map of Subject -> Set of Faculty
  const subjectTeacherMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const tt of allResults) {
      for (const choice of tt.choices) {
        if (!map.has(choice.subjectName)) {
          map.set(choice.subjectName, new Set<string>());
        }
        map.get(choice.subjectName)!.add(choice.option.faculty);
      }
    }
    return map;
  }, [allResults]);

  if (subjectTeacherMap.size === 0) return null;

  const handleToggleTeacher = (subject: string, teacher: string) => {
    const current = subjectTeacherFilter[subject] || [];
    const next = current.includes(teacher)
      ? current.filter(t => t !== teacher)
      : [...current, teacher];
    
    setSubjectTeacherFilter(subject, next);
    applyFilters();
  };

  const handleClear = () => {
    clearSubjectTeacherFilters();
    applyFilters();
  };

  const activeFilterCount = Object.values(subjectTeacherFilter).reduce((acc, val) => acc + val.length, 0);

  return (
    <div className="glass-card rounded-xl border border-surface-700/50 overflow-hidden mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="font-semibold text-surface-200">Filter Teachers by Subject</span>
          {activeFilterCount > 0 && (
            <span className="bg-brand-500/20 text-brand-300 text-xs py-0.5 px-2 rounded-full ml-2">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <svg className={`w-5 h-5 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-surface-700/50 bg-surface-900/30">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-surface-400">Select preferred teachers for specific subjects. Only timetables containing these exact matches will be shown.</p>
            {activeFilterCount > 0 && (
              <button 
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 bg-red-400/10 rounded-md cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Array.from(subjectTeacherMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([subject, teachers]) => {
              const selectedForSubject = subjectTeacherFilter[subject] || [];
              
              return (
                <div key={subject} className="bg-surface-800/40 rounded-lg p-3 border border-surface-700/30">
                  <h4 className="text-sm font-bold text-surface-200 mb-2">{subject}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(teachers).sort().map(teacher => {
                      const isSelected = selectedForSubject.includes(teacher);
                      return (
                        <button
                          key={teacher}
                          onClick={() => handleToggleTeacher(subject, teacher)}
                          className={`text-xs px-2.5 py-1.5 rounded-md transition-all border cursor-pointer ${
                            isSelected 
                              ? 'bg-brand-500/20 border-brand-500/50 text-brand-200 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                              : 'bg-surface-800/80 border-surface-600/50 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
                          }`}
                        >
                          {teacher}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
