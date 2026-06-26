import React, { useMemo } from 'react';
import { useTimetableStore } from '../store/timetableStore';

export function StatsPanel() {
  const {
    allResults,
    filteredResults,
    generationComplete,
    generationDurationMs,
    truncated,
  } = useTimetableStore();

  const stats = useMemo(() => {
    if (!generationComplete || allResults.length === 0) return null;

    const results = filteredResults.length > 0 ? filteredResults : allResults;

    // Average free days
    const avgFreeDays = results.reduce((sum, tt) => sum + tt.freeDays.length, 0) / results.length;

    // Credit range
    const credits = results.map(tt => tt.totalCredits);
    const minCredits = Math.min(...credits);
    const maxCredits = Math.max(...credits);

    // Faculty frequency
    const facultyCounts = new Map<string, number>();
    for (const tt of results) {
      for (const c of tt.choices) {
        facultyCounts.set(c.option.faculty, (facultyCounts.get(c.option.faculty) ?? 0) + 1);
      }
    }
    const sortedFaculty = [...facultyCounts.entries()].sort((a, b) => b[1] - a[1]);
    const mostCommon = sortedFaculty[0];
    const leastCommon = sortedFaculty[sortedFaculty.length - 1];

    // Subject count
    const subjectSet = new Set<string>();
    for (const tt of results) {
      for (const c of tt.choices) {
        subjectSet.add(c.subjectName);
      }
    }

    return {
      total: allResults.length,
      filtered: filteredResults.length,
      avgFreeDays: avgFreeDays.toFixed(1),
      minCredits,
      maxCredits,
      mostCommon,
      leastCommon,
      subjectCount: subjectSet.size,
      durationMs: generationDurationMs,
    };
  }, [allResults, filteredResults, generationComplete, generationDurationMs]);

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Generated',
      value: stats.total.toLocaleString(),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      color: 'text-brand-400',
      bgColor: 'bg-brand-500/10',
    },
    {
      label: 'After Filters',
      value: stats.filtered.toLocaleString(),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
        </svg>
      ),
      color: 'text-accent-cyan',
      bgColor: 'bg-accent-cyan/10',
    },
    {
      label: 'Avg Free Days',
      value: stats.avgFreeDays,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ),
      color: 'text-accent-emerald',
      bgColor: 'bg-accent-emerald/10',
    },
    {
      label: 'Credits Range',
      value: stats.minCredits === stats.maxCredits ? `${stats.minCredits}` : `${stats.minCredits}–${stats.maxCredits}`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
        </svg>
      ),
      color: 'text-accent-amber',
      bgColor: 'bg-accent-amber/10',
    },
  ];

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Statistics
        </h3>
        {stats.durationMs && (
          <span className="text-[0.65rem] text-surface-500">
            Generated in {(stats.durationMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-surface-800/40 space-y-1 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`flex items-center gap-1.5 ${card.color}`}>
              <div className={`p-1 rounded ${card.bgColor}`}>{card.icon}</div>
            </div>
            <p className="text-lg font-bold text-surface-100">{card.value}</p>
            <p className="text-[0.65rem] text-surface-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Faculty highlights */}
      {stats.mostCommon && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-surface-400">Most common faculty</span>
            <span className="text-surface-200 font-medium">{stats.mostCommon[0]}</span>
          </div>
          {stats.leastCommon && stats.leastCommon[0] !== stats.mostCommon[0] && (
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-surface-400">Least common faculty</span>
              <span className="text-surface-200 font-medium">{stats.leastCommon[0]}</span>
            </div>
          )}
        </div>
      )}

      {truncated && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15 text-xs text-amber-300/80">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          Results were truncated. Try blacklisting faculty to narrow the search.
        </div>
      )}
    </div>
  );
}

export default StatsPanel;
