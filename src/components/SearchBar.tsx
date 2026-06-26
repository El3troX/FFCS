import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimetableStore } from '../store/timetableStore';

export function SearchBar() {
  const { searchQuery, setSearchQuery, filteredResults, applyFilters, generationComplete } = useTimetableStore();
  const [localValue, setLocalValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((value: string) => {
    setLocalValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      if (generationComplete) applyFilters();
    }, 200);
  }, [setSearchQuery, applyFilters, generationComplete]);

  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative group">
      {/* Search icon */}
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-brand-400 transition-colors"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>

      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by faculty, subject, venue..."
        className="w-full pl-10 pr-20 py-2.5 rounded-xl glass text-sm text-surface-200
          placeholder:text-surface-500 focus:outline-none focus:ring-2
          focus:ring-brand-500/30 transition-all"
        aria-label="Search timetables"
      />

      {/* Result count */}
      {generationComplete && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] text-surface-400 font-medium">
          {filteredResults.length.toLocaleString()} results
        </span>
      )}

      {/* Clear */}
      {localValue && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-16 top-1/2 -translate-y-1/2 p-1 rounded text-surface-400 hover:text-surface-200 transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SearchBar;
