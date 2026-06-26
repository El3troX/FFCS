// ─── Report Generator ───
// Generates report rows and CSV export from a timetable

import type { Timetable, ReportRow } from '../types';
import { getSlotKind } from './slotTimeRegistry';

const DAY_ORDER: Record<string, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
};

/**
 * Convert minutes from midnight to "HH:MM" string.
 */
function minutesToTimeStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate report rows from a timetable.
 * One row per occupied weekly occurrence (expanding multi-occurrence slots).
 * Sorted by day (MON→FRI) then start time ascending.
 */
export function generateReport(timetable: Timetable): ReportRow[] {
  const rows: ReportRow[] = [];

  for (const choice of timetable.choices) {
    for (const session of choice.option.sessions) {
      const kind = getSlotKind(session.slotCode);
      let typeStr: string;

      if (kind) {
        typeStr = kind;
      } else {
        // Fall back to the subject type
        typeStr = 'THEORY';
      }

      rows.push({
        DAY: session.day,
        START: minutesToTimeStr(session.startMin),
        END: minutesToTimeStr(session.endMin),
        SLOT: session.slotCode,
        TEACHER: choice.option.faculty,
        SUBJECT: choice.subjectName,
        VENUE: choice.option.venue,
        TYPE: typeStr,
      });
    }
  }

  // Sort by day order, then by start time
  rows.sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.DAY] ?? 99) - (DAY_ORDER[b.DAY] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return a.START.localeCompare(b.START);
  });

  return rows;
}

/**
 * Escape a CSV field: quote it if it contains commas, quotes, or newlines.
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate a CSV string from report rows.
 * Includes a header row.
 */
export function generateCSV(rows: ReportRow[]): string {
  const headers: (keyof ReportRow)[] = ['DAY', 'START', 'END', 'SLOT', 'TEACHER', 'SUBJECT', 'VENUE', 'TYPE'];
  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map(h => escapeCSVField(row[h]));
    lines.push(values.join(','));
  }

  return lines.join('\n');
}
