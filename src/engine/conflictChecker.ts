// ─── Conflict Checker ───
// Detects session overlaps and builds a compatibility matrix for CSP

import type { Session, NormalizedOption } from '../types';

/**
 * Check if two sessions overlap.
 * Two sessions overlap iff they are on the same day AND their time ranges
 * have a non-empty intersection: max(start1, start2) < min(end1, end2).
 */
export function sessionsOverlap(a: Session, b: Session): boolean {
  if (a.day !== b.day) return false;
  return Math.max(a.startMin, b.startMin) < Math.min(a.endMin, b.endMin);
}

/**
 * Check if two options conflict (any session pair overlaps).
 */
export function optionsConflict(a: NormalizedOption, b: NormalizedOption): boolean {
  // 1. Time overlap check
  for (const sa of a.sessions) {
    for (const sb of b.sessions) {
      if (sessionsOverlap(sa, sb)) return true;
    }
  }

  // 2. Theory/Lab Teacher constraint check
  // If a and b are the Theory and Lab components of the same base subject,
  // they MUST have the same faculty. If they don't, they conflict.
  if (a.subjectName !== b.subjectName) {
    const getBaseName = (name: string) => name.replace(/ Theory$/i, '').replace(/ Lab$/i, '').trim();
    const aBase = getBaseName(a.subjectName);
    const bBase = getBaseName(b.subjectName);

    if (aBase === bBase) {
      if (a.faculty.trim().toLowerCase() !== b.faculty.trim().toLowerCase()) {
        return true; // Conflicting because faculty is different
      }
    }
  }

  return false;
}

/**
 * Build a compatibility matrix for a list of options.
 * Returns a Map where each key is an option ID and the value is a Set
 * of option IDs that are INCOMPATIBLE (conflicting) with it.
 *
 * O(N^2) precomputation where N = total number of options across all subjects.
 * This enables O(1) conflict checks during backtracking.
 */
export function buildCompatibilityMatrix(
  options: NormalizedOption[]
): Map<number, Set<number>> {
  const matrix = new Map<number, Set<number>>();

  // Initialize all entries
  for (const opt of options) {
    matrix.set(opt.id, new Set<number>());
  }

  // Pairwise comparison
  for (let i = 0; i < options.length; i++) {
    const a = options[i]!;
    for (let j = i + 1; j < options.length; j++) {
      const b = options[j]!;
      if (optionsConflict(a, b)) {
        matrix.get(a.id)!.add(b.id);
        matrix.get(b.id)!.add(a.id);
      }
    }
  }

  return matrix;
}
