import React, { useState, useRef } from 'react';
import type { Timetable } from '../types';
import { TimetableGrid } from './TimetableGrid';
import { useTimetableStore } from '../store/timetableStore';

type TimetableCardProps = {
  timetable: Timetable;
  index: number;
  compact?: boolean;
};

export function TimetableCard({ timetable, index, compact = false }: TimetableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const { selectedIndices, toggleSelection } = useTimetableStore();
  const isSelected = selectedIndices.has(index);

  const subjectSummary = timetable.choices.map(c => ({
    name: c.subjectName,
    faculty: c.option.faculty,
    venue: c.option.venue,
  }));

  return (
    <div
      className={`
        glass-card rounded-xl overflow-hidden transition-all duration-300
        ${isSelected
          ? 'ring-2 ring-brand-400 shadow-[0_0_24px_rgba(99,102,241,0.3)]'
          : 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5'
        }
        animate-slide-up
      `}
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-surface-100">
            Timetable{' '}
            <span className="gradient-text">#{timetable.id}</span>
          </h3>

          {/* Badges */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-brand-500/20 text-brand-300 border border-brand-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            {timetable.totalCredits} cr
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-accent-emerald/20 text-emerald-400 border border-accent-emerald/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {timetable.freeDays.length} free {timetable.freeDays.length === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Selection checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelection(index); }}
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer
            ${isSelected
              ? 'bg-brand-500 border-brand-400 text-white'
              : 'border-surface-500 hover:border-brand-400 text-transparent hover:text-surface-400'
            }
          `}
          aria-label={isSelected ? `Deselect timetable ${timetable.id}` : `Select timetable ${timetable.id}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="p-3">
        <TimetableGrid
          ref={gridRef}
          timetable={timetable}
          compact={compact}
        />
      </div>

      {/* Subject summary (collapsible) */}
      <div className="border-t border-white/5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-surface-400 hover:text-surface-200 transition-colors cursor-pointer"
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          <span className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {subjectSummary.length} subjects
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 pb-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {subjectSummary.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-surface-800/50 text-xs"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: [
                        '#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316',
                        '#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6',
                        '#d946ef','#f472b6',
                      ][i % 12],
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-surface-200 truncate">{s.name}</p>
                    <p className="text-surface-400 truncate">{s.faculty} · {s.venue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimetableCard;
