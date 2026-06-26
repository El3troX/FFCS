// ─── Input Data Types (from data.json) ───

export type SlotOption = {
  faculty: string;
  slot: string;
  venue: string;
};

export type SubjectType = 'THEORY' | 'LAB';

export type SubjectInput = {
  credits: number;
  type: SubjectType;
  mandatory: boolean;
  group?: string;
  options: SlotOption[];
};

export type DataJson = Record<string, SubjectInput>;

// ─── Slot Time Map Types ───

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export type SlotKind = 'THEORY' | 'TUTORIAL' | 'LAB';

export type SlotOccurrence = {
  day: DayOfWeek;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
};

export type SlotTimeEntry = {
  kind: SlotKind;
  occurrences: SlotOccurrence[];
};

export type SlotTimeMap = Record<string, SlotTimeEntry>;

// ─── Internal Normalized Types ───

export type Session = {
  day: DayOfWeek;
  startMin: number; // minutes from midnight
  endMin: number;
  slotCode: string;
};

export type NormalizedOption = {
  id: number;           // global unique ID
  subjectName: string;
  faculty: string;
  slot: string;         // original slot string e.g. "F1+TF1"
  slotCodes: string[];  // expanded e.g. ["F1", "TF1"]
  venue: string;
  sessions: Session[];
  hasUnknownSlot: boolean;
  unknownSlotCodes: string[];
};

export type NormalizedSubject = {
  name: string;
  credits: number;
  type: SubjectType;
  mandatory: boolean;
  group?: string;
  options: NormalizedOption[];
  errors: string[];
  warnings: string[];
};

export type ParseResult = {
  subjects: NormalizedSubject[];
  allFaculty: string[];
  allVenues: string[];
  errors: string[];
  warnings: string[];
  totalOptions: number;
};

// ─── CSP Types ───

export type ElectiveValue = {
  type: 'OPTION';
  subjectName: string;
  option: NormalizedOption;
} | {
  type: 'NONE';
};

export type CSPVariable = {
  name: string;           // subject name or group name
  isMandatory: boolean;
  isElectiveGroup: boolean;
  groupName?: string;
  domain: CSPDomainEntry[];
};

export type CSPDomainEntry = {
  id: number;              // unique domain entry ID
  optionId: number;        // refers to NormalizedOption.id (-1 for NONE)
  subjectName: string;
  option: NormalizedOption | null; // null for NONE
};

// ─── Solution / Timetable Types ───

export type ChosenOption = {
  subjectName: string;
  option: NormalizedOption;
};

export type Timetable = {
  id: number;
  choices: ChosenOption[];
  totalCredits: number;
  freeDays: DayOfWeek[];
  signature: string;
};

// ─── Grid View Model (for rendering) ───

export type GridCell = {
  subjectName: string;
  faculty: string;
  venue: string;
  slotCode: string;
  type: SubjectType;
  kind: SlotKind;
  colorIndex: number;
};

export type GridViewModel = {
  days: DayOfWeek[];
  timeSlots: { start: string; end: string; startMin: number; endMin: number }[];
  cells: Map<string, GridCell>; // key: "DAY-startMin"
};

// ─── Worker Message Protocol ───

export type WorkerInMessage = {
  type: 'START';
  payload: {
    subjects: NormalizedSubject[];
    blacklist: string[];
    electiveGroupRequirements: Record<string, boolean>; // groupName → requireOne
    maxResults: number;
    theorySession: TheorySessionPref;
  };
} | {
  type: 'CANCEL';
};

export type WorkerOutMessage = {
  type: 'PROGRESS';
  payload: {
    nodesExplored: number;
    estimatedTotal: number;
    validCount: number;
    percentage: number;
  };
} | {
  type: 'RESULT';
  payload: {
    timetable: Timetable;
  };
} | {
  type: 'BATCH_RESULT';
  payload: {
    timetables: Timetable[];
  };
} | {
  type: 'COMPLETE';
  payload: {
    totalValid: number;
    totalExplored: number;
    truncated: boolean;
    durationMs: number;
  };
} | {
  type: 'ERROR';
  payload: {
    message: string;
    blockingSubject?: string;
  };
} | {
  type: 'WARNING';
  payload: {
    message: string;
  };
};

// ─── Filter Types ───

export type TheorySessionPref = 'any' | 'morning' | 'afternoon';

export type FilterState = {
  blacklist: Set<string>;
  whitelist: Set<string>;
  searchQuery: string;
  subjectFilter: string[];
  venueFilter: string[];
  minCredits: number;
  maxCredits: number;
  minFreeDays: number;
  electiveGroupRequirements: Record<string, boolean>;
};

// ─── Storage Types ───

export type SavedTimetable = {
  id: string;
  number: number;      // for zero-padded naming
  timetable: Timetable;
  savedAt: number;     // timestamp
  pngBlob?: Blob;
  pdfBlob?: Blob;
  csvContent: string;
};

export type AppSettings = {
  darkMode: boolean;
  lastFilterState?: Partial<FilterState>;
  savedCounter: number;
};

// ─── Report Row ───

export type ReportRow = {
  DAY: string;
  START: string;
  END: string;
  SLOT: string;
  TEACHER: string;
  SUBJECT: string;
  VENUE: string;
  TYPE: string;
};
