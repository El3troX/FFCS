import React from 'react';
import type { Timetable } from '../types';
import { TimetableGrid } from './TimetableGrid';

type ComparisonViewProps = {
  timetables: Timetable[];
  onClose: () => void;
};

export function ComparisonView({ timetables, onClose }: ComparisonViewProps) {
  if (timetables.length === 0) return null;

  // Find common and different choices
  const allSubjects = new Set<string>();
  timetables.forEach(tt => tt.choices.forEach(c => allSubjects.add(c.subjectName)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[95vw] glass-strong rounded-2xl shadow-2xl animate-slide-up z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-surface-100">
              Compare Timetables
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/20 font-medium">
              {timetables.length} selected
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700/50 transition-all cursor-pointer"
            aria-label="Close comparison"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grids */}
        <div className={`p-4 grid gap-4 ${timetables.length <= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'}`}>
          {timetables.map((tt, i) => (
            <div
              key={tt.id}
              className="glass-card rounded-xl p-3 space-y-2 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold text-surface-100">
                  Timetable <span className="gradient-text">#{tt.id}</span>
                </h3>
                <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 font-medium">
                  {tt.totalCredits} cr
                </span>
                <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-accent-emerald/15 text-emerald-400 font-medium">
                  {tt.freeDays.length} free
                </span>
              </div>
              <TimetableGrid timetable={tt} compact />
            </div>
          ))}
        </div>

        {/* Summary comparison */}
        <div className="px-6 py-4 border-t border-white/5">
          <h4 className="text-xs font-semibold text-surface-300 mb-2 uppercase tracking-wider">
            Quick Comparison
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left py-2 pr-4 text-surface-400 font-medium">Subject</th>
                  {timetables.map(tt => (
                    <th key={tt.id} className="text-left py-2 pr-4 text-surface-300 font-medium">
                      #{tt.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...allSubjects].map(subject => {
                  const choices = timetables.map(
                    tt => tt.choices.find(c => c.subjectName === subject)
                  );
                  const allSame = choices.every(
                    c => c && choices[0] && c.option.faculty === choices[0].option.faculty && c.option.slot === choices[0].option.slot
                  );
                  const allPresent = choices.every(Boolean);

                  return (
                    <tr
                      key={subject}
                      className={`border-b border-surface-800/30 ${allSame && allPresent ? 'bg-emerald-500/5' : ''}`}
                    >
                      <td className="py-1.5 pr-4 font-medium text-surface-200">{subject}</td>
                      {choices.map((c, i) => (
                        <td
                          key={i}
                          className={`py-1.5 pr-4 ${
                            !c ? 'text-surface-600 italic' :
                            allSame && allPresent ? 'text-emerald-400' :
                            'text-amber-400'
                          }`}
                        >
                          {c ? (
                            <span>
                              {c.option.faculty}
                              <span className="text-surface-500 ml-1">({c.option.slot})</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t border-surface-600/30">
                  <td className="py-2 pr-4 font-semibold text-surface-200">Free Days</td>
                  {timetables.map(tt => (
                    <td key={tt.id} className="py-2 pr-4 text-accent-cyan font-medium">
                      {tt.freeDays.join(', ') || 'None'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonView;
