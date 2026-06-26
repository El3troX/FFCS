import React, { useState, useMemo } from 'react';
import { useTimetableStore } from '../store/timetableStore';

type SubjectGroup = {
  subjectName: string;
  faculty: { name: string; slots: string[] }[];
};

export function TeacherFilterPanel() {
  const {
    parsedData,
    blacklist,
    whitelist,
    subjectFilter,
    toggleBlacklist,
    toggleWhitelist,
    addToast,
  } = useTimetableStore();

  const [search, setSearch] = useState('');
  const [showBlacklisted, setShowBlacklisted] = useState(true);
  const [showWhitelisted, setShowWhitelisted] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const toggleSubjectExpanded = (subjectName: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectName)) {
        next.delete(subjectName);
      } else {
        next.add(subjectName);
      }
      return next;
    });
  };

  const allFaculty = useMemo(() => {
    if (!parsedData) return [];
    return [...parsedData.allFaculty].sort((a, b) => a.localeCompare(b));
  }, [parsedData]);

  // Count how many options each faculty appears in overall
  const facultyOptionCount = useMemo(() => {
    if (!parsedData) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const subj of parsedData.subjects) {
      for (const opt of subj.options) {
        counts.set(opt.faculty, (counts.get(opt.faculty) ?? 0) + 1);
      }
    }
    return counts;
  }, [parsedData]);

  const subjectGroups = useMemo(() => {
    if (!parsedData) return [];
    const groups: SubjectGroup[] = [];
    
    for (const subj of parsedData.subjects) {
      const facultyMap = new Map<string, Set<string>>();
      for (const opt of subj.options) {
        if (!facultyMap.has(opt.faculty)) {
          facultyMap.set(opt.faculty, new Set());
        }
        facultyMap.get(opt.faculty)!.add(opt.slot);
      }
      groups.push({
        subjectName: subj.name,
        faculty: Array.from(facultyMap.entries())
          .map(([name, slotsSet]) => ({ name, slots: Array.from(slotsSet).sort() }))
          .sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    return groups.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [parsedData]);

  const filteredGroups = useMemo(() => {
    let baseGroups = subjectGroups;
    if (subjectFilter.length > 0) {
      baseGroups = baseGroups.filter(g => subjectFilter.includes(g.subjectName));
    }
    
    if (!search.trim()) return baseGroups;
    const q = search.toLowerCase();
    
    const result: SubjectGroup[] = [];
    for (const group of baseGroups) {
      if (group.subjectName.toLowerCase().includes(q)) {
        result.push(group);
      } else {
        const matchedFaculty = group.faculty.filter(f => f.name.toLowerCase().includes(q));
        if (matchedFaculty.length > 0) {
          result.push({
            subjectName: group.subjectName,
            faculty: matchedFaculty
          });
        }
      }
    }
    return result;
  }, [subjectGroups, search, subjectFilter]);

  const blacklistedFaculty = allFaculty.filter(f => blacklist.has(f));
  const whitelistedFaculty = allFaculty.filter(f => whitelist.has(f));

  if (!parsedData) return null;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search faculty or subject..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-800/60 border border-surface-600/30 text-sm text-surface-200 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all"
          aria-label="Search faculty names or subjects"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-surface-400 hover:text-surface-200 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Blacklisted section */}
      {blacklistedFaculty.length > 0 && (
        <div className="rounded-lg bg-red-500/8 border border-red-500/15 overflow-hidden">
          <button
            onClick={() => setShowBlacklisted(!showBlacklisted)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-red-400 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Blacklisted ({blacklistedFaculty.length})
            </span>
            <svg className={`w-3.5 h-3.5 transition-transform ${showBlacklisted ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showBlacklisted && (
            <div className="px-3 pb-2 space-y-1 animate-fade-in">
              {blacklistedFaculty.map(f => (
                <div key={f} className="flex items-center justify-between py-1">
                  <span className="text-xs text-red-300 truncate max-w-[60%]">{f}</span>
                  <button
                    onClick={() => toggleBlacklist(f)}
                    className="text-[0.65rem] px-2 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer"
                    aria-label={`Remove ${f} from blacklist`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Whitelisted section */}
      {whitelistedFaculty.length > 0 && (
        <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 overflow-hidden">
          <button
            onClick={() => setShowWhitelisted(!showWhitelisted)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-emerald-400 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Whitelisted ({whitelistedFaculty.length})
            </span>
            <svg className={`w-3.5 h-3.5 transition-transform ${showWhitelisted ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showWhitelisted && (
            <div className="px-3 pb-2 space-y-1 animate-fade-in">
              {whitelistedFaculty.map(f => (
                <div key={f} className="flex items-center justify-between py-1">
                  <span className="text-xs text-emerald-300 truncate max-w-[60%]">{f}</span>
                  <button
                    onClick={() => toggleWhitelist(f)}
                    className="text-[0.65rem] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    aria-label={`Remove ${f} from whitelist`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Faculty list grouped by Subject */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {filteredGroups.length === 0 && (
          <p className="text-xs text-surface-500 py-4 text-center">
            No faculty or subject found matching "{search}"
          </p>
        )}

        {filteredGroups.map(group => {
          // If searching, we auto-expand the subjects that match. If not, we respect the user's toggle state.
          // Let's keep it simple: if search is active, default to expanded, else use `expandedSubjects`.
          const isExpanded = search.trim() !== '' || expandedSubjects.has(group.subjectName);

          return (
            <div key={group.subjectName} className="border border-surface-700/50 rounded-lg overflow-hidden bg-surface-800/30">
              <button
                onClick={() => toggleSubjectExpanded(group.subjectName)}
                className="w-full flex items-center justify-between px-3 py-2 bg-surface-800 hover:bg-surface-700/50 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-surface-200 truncate pr-2">
                  {group.subjectName}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[0.65rem] text-surface-400 bg-surface-700/50 px-1.5 py-0.5 rounded-full">
                    {group.faculty.length} {group.faculty.length === 1 ? 'teacher' : 'teachers'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="p-1 space-y-0.5 border-t border-surface-700/50 bg-surface-900/50">
                  {group.faculty.map(fObj => {
                    const faculty = fObj.name;
                    const slots = fObj.slots.join(', ');
                    const isBlacklisted = blacklist.has(faculty);
                    const isWhitelisted = whitelist.has(faculty);
                    const count = facultyOptionCount.get(faculty) ?? 0;

                    return (
                      <div
                        key={faculty}
                        className={`
                          flex items-center justify-between gap-2 px-3 py-1.5 rounded-md
                          transition-all duration-200
                          ${isBlacklisted ? 'bg-red-500/8' : isWhitelisted ? 'bg-emerald-500/8' : 'hover:bg-surface-700/40'}
                        `}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-surface-300 truncate">{faculty}</span>
                            <span className="shrink-0 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-surface-800/80 text-surface-500" title={`${count} overall occurrences`}>
                              {count}
                            </span>
                          </div>
                          <span className="text-[0.6rem] text-surface-500 truncate mt-0.5 font-mono tracking-tight" title={slots}>
                            {slots}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Blacklist toggle */}
                          <button
                            onClick={() => {
                              toggleBlacklist(faculty);
                              if (!isBlacklisted) {
                                addToast({ message: `${faculty} blacklisted across all subjects`, type: 'warning' });
                              }
                            }}
                            className={`
                              p-1.5 rounded-md text-xs transition-all duration-200 cursor-pointer
                              ${isBlacklisted
                                ? 'bg-red-500/25 text-red-400 hover:bg-red-500/35'
                                : 'text-surface-500 hover:text-red-400 hover:bg-red-500/10'
                              }
                            `}
                            aria-label={isBlacklisted ? `Remove ${faculty} from blacklist` : `Blacklist ${faculty}`}
                            title="Blacklist"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>

                          {/* Whitelist toggle */}
                          <button
                            onClick={() => {
                              toggleWhitelist(faculty);
                              if (!isWhitelisted) {
                                addToast({ message: `${faculty} whitelisted across all subjects`, type: 'success' });
                              }
                            }}
                            className={`
                              p-1.5 rounded-md text-xs transition-all duration-200 cursor-pointer
                              ${isWhitelisted
                                ? 'bg-emerald-500/25 text-emerald-400 hover:bg-emerald-500/35'
                                : 'text-surface-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }
                            `}
                            aria-label={isWhitelisted ? `Remove ${faculty} from whitelist` : `Whitelist ${faculty}`}
                            title="Whitelist"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeacherFilterPanel;
