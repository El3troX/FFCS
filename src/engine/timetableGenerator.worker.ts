// ─── Timetable Generator Web Worker ───
// CSP backtracking solver running in a Web Worker thread

import type {
  WorkerInMessage,
  WorkerOutMessage,
  NormalizedSubject,
  NormalizedOption,
  CSPDomainEntry,
  Timetable,
  ChosenOption,
  DayOfWeek,
} from '../types';
import { buildCompatibilityMatrix } from './conflictChecker';
import { buildCSPVariables, estimateSearchSpace } from './constraintEngine';

// ─── Worker State ───
let cancelled = false;

const ALL_DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

// ─── Message Handlers ───

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === 'CANCEL') {
    cancelled = true;
    return;
  }

  if (msg.type === 'START') {
    cancelled = false;
    try {
      runSolver(msg.payload);
    } catch (err) {
      postMsg({
        type: 'ERROR',
        payload: {
          message: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }
};

function postMsg(msg: WorkerOutMessage): void {
  self.postMessage(msg);
}

// ─── Solver ───

function runSolver(payload: {
  subjects: NormalizedSubject[];
  blacklist: string[];
  electiveGroupRequirements: Record<string, boolean>;
  maxResults: number;
  theorySession: 'any' | 'morning' | 'afternoon';
}): void {
  const {
    subjects,
    blacklist,
    electiveGroupRequirements,
    maxResults = 50000,
    theorySession = 'any',
  } = payload;

  const startTime = performance.now();

  // Apply Theory Session Filter
  if (theorySession !== 'any') {
    for (const subject of subjects) {
      if (subject.mandatory) {
        subject.options = subject.options.filter(opt => {
          if (subject.type === 'THEORY') {
            const hasMorning = opt.slotCodes.some(c => c.endsWith('1') && !c.startsWith('L'));
            const hasAfternoon = opt.slotCodes.some(c => c.endsWith('2') && !c.startsWith('L'));
            
            if (theorySession === 'morning' && hasAfternoon) return false;
            if (theorySession === 'afternoon' && hasMorning) return false;
          } else if (subject.type === 'LAB') {
            const hasMorningLab = opt.slotCodes.some(c => {
              if (!c.startsWith('L')) return false;
              const num = parseInt(c.slice(1));
              return num >= 1 && num <= 30;
            });
            const hasAfternoonLab = opt.slotCodes.some(c => {
              if (!c.startsWith('L')) return false;
              const num = parseInt(c.slice(1));
              return num >= 31 && num <= 60;
            });

            // Morning theory means afternoon lab
            if (theorySession === 'morning' && hasMorningLab) return false;
            // Afternoon theory means morning lab
            if (theorySession === 'afternoon' && hasAfternoonLab) return false;
          }
          return true;
        });
      }
    }
  }

  // Collect all options for compatibility matrix
  const allOptions: NormalizedOption[] = [];
  for (const subject of subjects) {
    for (const opt of subject.options) {
      allOptions.push(opt);
    }
  }

  // Build compatibility matrix (INCOMPATIBLE pairs)
  const incompatible = buildCompatibilityMatrix(allOptions);

  // Build CSP variables
  const blacklistSet = new Set(blacklist);
  const { variables, errors } = buildCSPVariables(
    subjects,
    blacklistSet,
    electiveGroupRequirements
  );

  // Report blocking errors
  if (errors.length > 0) {
    for (const error of errors) {
      postMsg({ type: 'ERROR', payload: { message: error } });
    }
    postMsg({
      type: 'COMPLETE',
      payload: {
        totalValid: 0,
        totalExplored: 0,
        truncated: false,
        durationMs: performance.now() - startTime,
      },
    });
    return;
  }

  // Handle edge case: no variables
  if (variables.length === 0) {
    postMsg({
      type: 'COMPLETE',
      payload: {
        totalValid: 0,
        totalExplored: 0,
        truncated: false,
        durationMs: performance.now() - startTime,
      },
    });
    return;
  }

  // Estimate total search space
  const estimatedTotal = estimateSearchSpace(variables);

  // Backtracking state
  let nodesExplored = 0;
  let validCount = 0;
  let truncated = false;
  const results: Timetable[] = [];
  const seenSignatures = new Set<string>();
  let lastProgressTime = performance.now();
  let lastBatchTime = performance.now();
  let nextTimetableId = 1;

  // The assignment stack: for each variable index, the chosen domain entry
  const assignment: (CSPDomainEntry | null)[] = new Array(variables.length).fill(null);
  // Set of currently assigned option IDs (for conflict checking)
  const assignedOptionIds = new Set<number>();

  /**
   * Check if a candidate option is compatible with all currently assigned options.
   */
  function isCompatible(optionId: number): boolean {
    if (optionId === -1) return true; // NONE is always compatible

    const conflicts = incompatible.get(optionId);
    if (!conflicts) return true;

    for (const assignedId of assignedOptionIds) {
      if (conflicts.has(assignedId)) return false;
    }
    return true;
  }

  /**
   * Forward checking: check if remaining variables still have at least one viable domain entry.
   */
  function forwardCheck(currentLevel: number): boolean {
    for (let i = currentLevel + 1; i < variables.length; i++) {
      const variable = variables[i]!;
      let hasViable = false;
      for (const entry of variable.domain) {
        if (entry.optionId === -1 || isCompatible(entry.optionId)) {
          hasViable = true;
          break;
        }
      }
      if (!hasViable) return false;
    }
    return true;
  }

  /**
   * Compute a unique signature for deduplication.
   * Sort the option IDs and join them.
   */
  function computeSignature(assign: (CSPDomainEntry | null)[]): string {
    const ids: number[] = [];
    for (const entry of assign) {
      if (entry && entry.optionId !== -1) {
        ids.push(entry.optionId);
      }
    }
    ids.sort((a, b) => a - b);
    return ids.join(',');
  }

  /**
   * Compute total credits from the assignment.
   */
  function computeTotalCredits(choices: ChosenOption[]): number {
    let total = 0;
    for (const choice of choices) {
      // Find the subject to get credits
      const subject = subjects.find(s => s.name === choice.subjectName);
      if (subject) total += subject.credits;
    }
    return total;
  }

  /**
   * Compute free days from the assignment.
   */
  function computeFreeDays(choices: ChosenOption[]): DayOfWeek[] {
    const occupiedDays = new Set<DayOfWeek>();
    for (const choice of choices) {
      for (const session of choice.option.sessions) {
        occupiedDays.add(session.day);
      }
    }
    return ALL_DAYS.filter(d => !occupiedDays.has(d));
  }

  /**
   * Build a Timetable from the current assignment.
   */
  function buildTimetable(): Timetable | null {
    const signature = computeSignature(assignment);
    if (seenSignatures.has(signature)) return null;
    seenSignatures.add(signature);

    const choices: ChosenOption[] = [];
    for (const entry of assignment) {
      if (entry && entry.option && entry.optionId !== -1) {
        choices.push({
          subjectName: entry.subjectName,
          option: entry.option,
        });
      }
    }

    return {
      id: nextTimetableId++,
      choices,
      totalCredits: computeTotalCredits(choices),
      freeDays: computeFreeDays(choices),
      signature,
    };
  }

  /**
   * Send progress update if enough time has elapsed.
   */
  function maybeEmitProgress(): void {
    const now = performance.now();
    if (now - lastProgressTime >= 100) {
      lastProgressTime = now;
      const percentage = isFinite(estimatedTotal) && estimatedTotal > 0
        ? Math.min(100, (nodesExplored / estimatedTotal) * 100)
        : 0;
      postMsg({
        type: 'PROGRESS',
        payload: {
          nodesExplored,
          estimatedTotal: isFinite(estimatedTotal) ? estimatedTotal : -1,
          validCount,
          percentage,
        },
      });
    }
  }

  /**
   * Send batch results if enough time has elapsed or buffer is large.
   */
  function maybeEmitBatch(): void {
    const now = performance.now();
    if (results.length > 0 && (now - lastBatchTime >= 100 || results.length >= 100)) {
      lastBatchTime = now;
      postMsg({
        type: 'BATCH_RESULT',
        payload: { timetables: results.splice(0) },
      });
    }
  }

  // ─── Iterative Backtracking ───
  // Using an iterative approach to avoid stack overflow for deep recursion

  function backtrack(level: number): void {
    if (cancelled || truncated) return;
    if (validCount >= maxResults) {
      truncated = true;
      return;
    }

    maybeEmitProgress();
    maybeEmitBatch();

    // All variables assigned → valid solution
    if (level === variables.length) {
      const tt = buildTimetable();
      if (tt) {
        validCount++;
        results.push(tt);
      }
      return;
    }

    const variable = variables[level]!;

    for (const entry of variable.domain) {
      if (cancelled || truncated) return;

      nodesExplored++;

      // Check compatibility
      if (entry.optionId !== -1 && !isCompatible(entry.optionId)) {
        continue;
      }

      // Make assignment
      assignment[level] = entry;
      if (entry.optionId !== -1) {
        assignedOptionIds.add(entry.optionId);
      }

      // Forward check
      if (forwardCheck(level)) {
        backtrack(level + 1);
      }

      // Undo assignment
      if (entry.optionId !== -1) {
        assignedOptionIds.delete(entry.optionId);
      }
      assignment[level] = null;
    }
  }

  // Run the backtracking search
  backtrack(0);

  // Flush any remaining results
  if (results.length > 0) {
    postMsg({
      type: 'BATCH_RESULT',
      payload: { timetables: results.splice(0) },
    });
  }

  // Send completion message
  postMsg({
    type: 'COMPLETE',
    payload: {
      totalValid: validCount,
      totalExplored: nodesExplored,
      truncated,
      durationMs: performance.now() - startTime,
    },
  });
}
