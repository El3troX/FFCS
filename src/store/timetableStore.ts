import { create } from 'zustand';
import type {
  ParseResult,
  Timetable,
  DayOfWeek,
  NormalizedSubject,
  TheorySessionPref,
} from '../types';

// ── Progress type ──
export type GenerationProgress = {
  nodesExplored: number;
  estimatedTotal: number;
  validCount: number;
  percentage: number;
};

// ── Store State ──
export interface TimetableState {
  // Data state
  parsedData: ParseResult | null;
  dataLoaded: boolean;
  dataError: string | null;

  // Filter state
  blacklist: Set<string>;
  whitelist: Set<string>;
  searchQuery: string;
  subjectFilter: string[];
  venueFilter: string[];
  minFreeDays: number;
  electiveGroupRequirements: Record<string, boolean>;
  theorySession: TheorySessionPref;
  subjectTeacherFilter: Record<string, string[]>;

  // Generation state
  isGenerating: boolean;
  progress: GenerationProgress | null;
  allResults: Timetable[];
  filteredResults: Timetable[];
  generationComplete: boolean;
  truncated: boolean;
  generationError: string | null;
  worker: Worker | null;
  generationDurationMs: number | null;

  // Selection state
  selectedIndices: Set<number>;
  comparisonMode: boolean;

  // Navigation state
  currentPage: number;
  pageSize: number;
  viewMode: 'single' | 'grid';

  // UI state
  darkMode: boolean;
  activePage: 'generator' | 'viewer' | 'saved';
  sidebarOpen: boolean;
  toasts: Toast[];

  // Actions
  setParsedData: (data: ParseResult | null) => void;
  setDataError: (error: string | null) => void;

  toggleBlacklist: (faculty: string) => void;
  toggleWhitelist: (faculty: string) => void;
  setSearchQuery: (query: string) => void;
  setSubjectFilter: (subjects: string[]) => void;
  setVenueFilter: (venues: string[]) => void;
  setMinFreeDays: (days: number) => void;
  setElectiveGroupRequirement: (group: string, required: boolean) => void;
  setTheorySession: (session: TheorySessionPref) => void;
  setSubjectTeacherFilter: (subject: string, teachers: string[]) => void;
  clearSubjectTeacherFilters: () => void;

  startGeneration: () => void;
  cancelGeneration: () => void;
  addResults: (timetables: Timetable[]) => void;
  setProgress: (progress: GenerationProgress) => void;
  setGenerationComplete: (totalValid: number, truncated: boolean, durationMs: number) => void;
  setGenerationError: (error: string) => void;
  setWorker: (worker: Worker | null) => void;

  toggleSelection: (index: number) => void;
  clearSelection: () => void;
  setComparisonMode: (mode: boolean) => void;

  setCurrentPage: (page: number) => void;
  setViewMode: (mode: 'single' | 'grid') => void;
  toggleDarkMode: () => void;
  setActivePage: (page: 'generator' | 'viewer' | 'saved') => void;
  setSidebarOpen: (open: boolean) => void;

  applyFilters: () => void;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export type Toast = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

// ── Helper: filter timetables ──
function filterTimetables(
  allResults: Timetable[],
  whitelist: Set<string>,
  searchQuery: string,
  subjectFilter: string[],
  venueFilter: string[],
  minFreeDays: number,
  subjectTeacherFilter: Record<string, string[]>
): Timetable[] {
  let results = allResults;

  // Filter by whitelist: timetable must include at least one option with a whitelisted faculty
  if (whitelist.size > 0) {
    results = results.filter(tt =>
      tt.choices.some(c => whitelist.has(c.option.faculty))
    );
  }

  // Filter by subject filter
  if (subjectFilter.length > 0) {
    results = results.filter(tt =>
      subjectFilter.every(s => tt.choices.some(c => c.subjectName === s))
    );
  }

  // Filter by venue
  if (venueFilter.length > 0) {
    results = results.filter(tt =>
      tt.choices.every(c => venueFilter.includes(c.option.venue))
    );
  }

  // Filter by min free days
  if (minFreeDays > 0) {
    results = results.filter(tt => tt.freeDays.length >= minFreeDays);
  }

  // Search query: match against faculty name, subject name, venue, slot
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    results = results.filter(tt =>
      tt.choices.some(
        c =>
          c.subjectName.toLowerCase().includes(q) ||
          c.option.faculty.toLowerCase().includes(q) ||
          c.option.venue.toLowerCase().includes(q) ||
          c.option.slot.toLowerCase().includes(q)
      )
    );
  }

  // Filter by subject-specific teachers
  const subjectsWithFilters = Object.entries(subjectTeacherFilter || {}).filter(([_, teachers]) => teachers.length > 0);
  if (subjectsWithFilters.length > 0) {
    results = results.filter(tt => {
      // For every subject that has a teacher filter applied:
      return subjectsWithFilters.every(([subject, allowedTeachers]) => {
        const choice = tt.choices.find(c => c.subjectName === subject);
        if (choice) {
          return allowedTeachers.includes(choice.option.faculty);
        }
        // If subject not in timetable (e.g. elective not taken), it doesn't violate the filter
        return true; 
      });
    });
  }

  return results;
}

// ── Store ──
export const useTimetableStore = create<TimetableState>()((set, get) => ({
  // Data state
  parsedData: null,
  dataLoaded: false,
  dataError: null,

  // Filter state
  blacklist: new Set(),
  whitelist: new Set(),
  searchQuery: '',
  subjectFilter: [],
  venueFilter: [],
  minFreeDays: 0,
  electiveGroupRequirements: {},
  theorySession: 'morning',
  subjectTeacherFilter: {},

  // Generation state
  isGenerating: false,
  progress: null,
  allResults: [],
  filteredResults: [],
  generationComplete: false,
  truncated: false,
  generationError: null,
  worker: null,
  generationDurationMs: null,

  // Selection state
  selectedIndices: new Set(),
  comparisonMode: false,

  // Navigation state
  currentPage: 0,
  pageSize: 12,
  viewMode: 'single',

  // UI state
  darkMode: true,
  activePage: 'generator',
  sidebarOpen: true,
  toasts: [],

  // ── Actions ──
  setParsedData: (data) =>
    set({
      parsedData: data,
      dataLoaded: data !== null,
      dataError: null,
      allResults: [],
      filteredResults: [],
      generationComplete: false,
      progress: null,
      subjectFilter: data ? data.subjects.filter(s => s.mandatory).map(s => s.name) : [],
    }),

  setDataError: (error) => set({ dataError: error }),

  toggleBlacklist: (faculty) =>
    set((state) => {
      const next = new Set(state.blacklist);
      const nextWhitelist = new Set(state.whitelist);
      if (next.has(faculty)) {
        next.delete(faculty);
      } else {
        next.add(faculty);
        // Mutual exclusion: remove from whitelist
        nextWhitelist.delete(faculty);
      }
      return { blacklist: next, whitelist: nextWhitelist };
    }),

  toggleWhitelist: (faculty) =>
    set((state) => {
      const next = new Set(state.whitelist);
      const nextBlacklist = new Set(state.blacklist);
      if (next.has(faculty)) {
        next.delete(faculty);
      } else {
        next.add(faculty);
        // Mutual exclusion: remove from blacklist
        nextBlacklist.delete(faculty);
      }
      return { whitelist: next, blacklist: nextBlacklist };
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSubjectFilter: (subjects) => set({ subjectFilter: subjects }),
  setVenueFilter: (venues) => set({ venueFilter: venues }),
  setMinFreeDays: (days) => set({ minFreeDays: days }),
  setElectiveGroupRequirement: (group, required) =>
    set((state) => ({
      electiveGroupRequirements: {
        ...state.electiveGroupRequirements,
        [group]: required,
      },
    })),
  setTheorySession: (session) => set({ theorySession: session }),
  setSubjectTeacherFilter: (subject, teachers) =>
    set((state) => {
      const updates: Record<string, string[]> = { [subject]: teachers };
      
      // Sync Theory and Lab selections automatically
      const baseName = subject.replace(/ Theory$/i, '').replace(/ Lab$/i, '').trim();
      const possibleCounterparts = [`${baseName} Theory`, `${baseName} Lab`, baseName];
      
      for (const counterpart of possibleCounterparts) {
        if (counterpart !== subject) {
          updates[counterpart] = teachers;
        }
      }

      return {
        subjectTeacherFilter: { ...state.subjectTeacherFilter, ...updates }
      };
    }),
  clearSubjectTeacherFilters: () => set({ subjectTeacherFilter: {} }),

  startGeneration: () =>
    set({
      isGenerating: true,
      progress: null,
      allResults: [],
      filteredResults: [],
      generationComplete: false,
      truncated: false,
      generationError: null,
      generationDurationMs: null,
      currentPage: 0,
      selectedIndices: new Set(),
    }),

  cancelGeneration: () => {
    const { worker } = get();
    if (worker) {
      worker.terminate();
    }
    set({
      isGenerating: false,
      worker: null,
    });
  },

  addResults: (timetables) =>
    set((state) => {
      const newAll = [...state.allResults, ...timetables];
      return { allResults: newAll };
    }),

  setProgress: (progress) => set({ progress }),

  setGenerationComplete: (totalValid, truncated, durationMs) =>
    set((state) => {
      const filtered = filterTimetables(
        state.allResults,
        state.whitelist,
        state.searchQuery,
        state.subjectFilter,
        state.venueFilter,
        state.minFreeDays,
        state.subjectTeacherFilter
      );
      return {
        isGenerating: false,
        generationComplete: true,
        truncated,
        generationDurationMs: durationMs,
        filteredResults: filtered,
        worker: null,
      };
    }),

  setGenerationError: (error) =>
    set({
      isGenerating: false,
      generationError: error,
      worker: null,
    }),

  setWorker: (worker) => set({ worker }),

  toggleSelection: (index) =>
    set((state) => {
      const next = new Set(state.selectedIndices);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return { selectedIndices: next };
    }),

  clearSelection: () => set({ selectedIndices: new Set(), comparisonMode: false }),

  setComparisonMode: (mode) => set({ comparisonMode: mode }),

  setCurrentPage: (page) => set({ currentPage: page }),
  setViewMode: (mode) => set((state) => {
    if (state.viewMode === mode) return state;
    const firstVisibleIndex = state.viewMode === 'grid' 
        ? state.currentPage * state.pageSize 
        : state.currentPage;
    const nextCurrentPage = mode === 'grid' 
        ? Math.floor(firstVisibleIndex / state.pageSize) 
        : firstVisibleIndex;
    return { viewMode: mode, currentPage: nextCurrentPage };
  }),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('timetablegen-darkmode', String(next));
      return { darkMode: next };
    }),

  setActivePage: (page) => set({ activePage: page, selectedIndices: new Set(), comparisonMode: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  applyFilters: () =>
    set((state) => {
      const filtered = filterTimetables(
        state.allResults,
        state.whitelist,
        state.searchQuery,
        state.subjectFilter,
        state.venueFilter,
        state.minFreeDays,
        state.subjectTeacherFilter
      );
      return { filteredResults: filtered, currentPage: 0 };
    }),

  addToast: (toast) =>
    set((state) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast = { ...toast, id };
      setTimeout(() => get().removeToast(id), 4000);
      return { toasts: [...state.toasts, newToast] };
    }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
