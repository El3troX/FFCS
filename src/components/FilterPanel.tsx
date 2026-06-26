import React, { useMemo } from 'react';
import { useTimetableStore } from '../store/timetableStore';

export function FilterPanel() {
  const {
    parsedData,
    minFreeDays,
    setMinFreeDays,
    electiveGroupRequirements,
    setElectiveGroupRequirement,
    subjectFilter,
    setSubjectFilter,
    theorySession,
    setTheorySession,
  } = useTimetableStore();

  const electiveGroups = useMemo(() => {
    if (!parsedData) return [];
    const groups = new Set<string>();
    for (const subj of parsedData.subjects) {
      if (subj.group) groups.add(subj.group);
    }
    return [...groups].sort();
  }, [parsedData]);

  const allSubjects = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.subjects
      .map(s => ({ name: s.name, mandatory: s.mandatory }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [parsedData]);

  if (!parsedData) return null;

  return (
    <div className="space-y-4">
      {/* Schedule Pattern */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-surface-300 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mandatory Schedule Pattern
        </h4>
        <div className="flex gap-2 bg-surface-800/40 p-1 rounded-lg">
          <button
            onClick={() => setTheorySession('morning')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              theorySession === 'morning' ? 'bg-surface-600 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'
            }`}
            title="Morning Theory + Afternoon Labs"
          >
            Morning Theory
          </button>
          <button
            onClick={() => setTheorySession('afternoon')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              theorySession === 'afternoon' ? 'bg-surface-600 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'
            }`}
            title="Afternoon Theory + Morning Labs"
          >
            Afternoon Theory
          </button>
          <button
            onClick={() => setTheorySession('any')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              theorySession === 'any' ? 'bg-surface-600 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            Any
          </button>
        </div>
      </div>

      {/* Free Days */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-surface-300 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Min Free Days
          </label>
          <span className="text-xs font-semibold text-brand-400">{minFreeDays}</span>
        </div>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={minFreeDays}
          onChange={(e) => setMinFreeDays(parseInt(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-brand-500/30 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, #6366f1 ${(minFreeDays / 4) * 100}%, rgba(71,85,105,0.3) ${(minFreeDays / 4) * 100}%)`,
          }}
          aria-label="Minimum free days"
        />
        <div className="flex justify-between text-[0.6rem] text-surface-500">
          <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
        </div>
      </div>

      {/* Elective Groups */}
      {electiveGroups.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-surface-300 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            Elective Groups
          </h4>
          <div className="space-y-1.5">
            {electiveGroups.map(group => {
              const required = electiveGroupRequirements[group] ?? false;
              return (
                <div
                  key={group}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/40 hover:bg-surface-700/40 transition-colors"
                >
                  <span className="text-xs text-surface-200">{group}</span>
                  <button
                    onClick={() => setElectiveGroupRequirement(group, !required)}
                    className={`
                      relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
                      transition-colors duration-200 ease-in-out
                      ${required ? 'bg-brand-500' : 'bg-surface-600'}
                    `}
                    role="switch"
                    aria-checked={required}
                    aria-label={`Require one from ${group}`}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-4 w-4 transform rounded-full
                        bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5
                        ${required ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}
                      `}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subject Filter */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-surface-300 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Must Include Subjects
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {allSubjects.map(({ name, mandatory }) => {
            const active = subjectFilter.includes(name);
            return (
              <button
                key={name}
                onClick={() => {
                  if (mandatory) return;
                  if (active) {
                    setSubjectFilter(subjectFilter.filter(s => s !== name));
                  } else {
                    let newFilter = [...subjectFilter, name];
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('spanish')) {
                      newFilter = newFilter.filter(s => !s.toLowerCase().includes('french'));
                    } else if (lowerName.includes('french')) {
                      newFilter = newFilter.filter(s => !s.toLowerCase().includes('spanish'));
                    }
                    setSubjectFilter(newFilter);
                  }
                }}
                className={`
                  px-2 py-1 rounded-md text-[0.65rem] font-medium transition-all duration-200
                  ${mandatory ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                  ${active
                    ? 'bg-brand-500/25 text-brand-300 border border-brand-500/30'
                    : 'bg-surface-800/40 text-surface-400 border border-surface-600/20 hover:text-surface-200 hover:border-surface-500/30'
                  }
                `}
                aria-label={active ? `Remove ${name} from filter` : `Require ${name} in results`}
                title={mandatory ? "Mandatory subjects cannot be unselected" : undefined}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
