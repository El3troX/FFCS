// ─── Slot Time Registry ───
// Resolves slot codes → SlotOccurrence[], expands options → Session[]

import type { SlotTimeMap, SlotOccurrence, NormalizedOption, Session, DayOfWeek } from '../types';
import slotTimeMapData from '../data/slotTimeMap.json';

const slotTimeMap: SlotTimeMap = slotTimeMapData as SlotTimeMap;

/**
 * Convert "HH:MM" → minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return -1;
  const h = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return -1;
  return h * 60 + m;
}

/**
 * Convert minutes from midnight → "HH:MM".
 */
export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Resolve a single slot code to its SlotOccurrence[].
 * Returns empty array for unknown codes (caller should warn).
 */
export function resolve(slotCode: string): SlotOccurrence[] {
  const entry = slotTimeMap[slotCode];
  if (!entry) return [];
  return entry.occurrences;
}

/**
 * Check if a slot code is known in the slot time map.
 */
export function isKnownSlot(slotCode: string): boolean {
  return slotCode in slotTimeMap;
}

/**
 * Get all known slot codes.
 */
export function getAllSlotCodes(): string[] {
  return Object.keys(slotTimeMap);
}

/**
 * Get the kind (THEORY/TUTORIAL/LAB) for a known slot code.
 */
export function getSlotKind(slotCode: string): string | undefined {
  return slotTimeMap[slotCode]?.kind;
}

/**
 * Expand a NormalizedOption's slot codes into Session[] with minute-of-day integers.
 * Returns { sessions, unknownSlotCodes } so the caller can record warnings.
 */
export function expandOption(option: Pick<NormalizedOption, 'slotCodes' | 'subjectName'>): {
  sessions: Session[];
  unknownSlotCodes: string[];
} {
  const sessions: Session[] = [];
  const unknownSlotCodes: string[] = [];

  for (const code of option.slotCodes) {
    const occurrences = resolve(code);
    if (occurrences.length === 0) {
      unknownSlotCodes.push(code);
      continue;
    }
    for (const occ of occurrences) {
      const startMin = timeToMinutes(occ.start);
      const endMin = timeToMinutes(occ.end);
      if (startMin < 0 || endMin < 0) continue;
      sessions.push({
        day: occ.day as DayOfWeek,
        startMin,
        endMin,
        slotCode: code,
      });
    }
  }

  return { sessions, unknownSlotCodes };
}

/**
 * Get the full SlotTimeMap (e.g. for rendering).
 */
export function getSlotTimeMap(): SlotTimeMap {
  return slotTimeMap;
}
