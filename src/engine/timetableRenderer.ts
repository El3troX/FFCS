// ─── Timetable Renderer ───
// Transforms a Timetable into a GridViewModel for visual rendering

import type {
  Timetable,
  GridViewModel,
  GridCell,
  DayOfWeek,
  SlotKind,
  SubjectType,
} from '../types';
import { getSlotTimeMap, getSlotKind } from './slotTimeRegistry';

const ALL_DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

/**
 * Render a timetable to a grid view model.
 * Maps each chosen option's sessions to grid cells and calculates time slot columns.
 */
export function renderToGrid(timetable: Timetable): GridViewModel {
  const _slotTimeMap = getSlotTimeMap();
  void _slotTimeMap; // used implicitly via getSlotKind

  // Collect all unique time ranges (start-end pairs) across all sessions
  const timeRangeSet = new Map<number, { start: string; end: string; startMin: number; endMin: number }>();
  const cells = new Map<string, GridCell>();

  // Assign consistent color indices per subject
  const subjectColorMap = new Map<string, number>();
  let colorCounter = 0;

  function getColorIndex(subjectName: string): number {
    let idx = subjectColorMap.get(subjectName);
    if (idx === undefined) {
      idx = colorCounter++;
      subjectColorMap.set(subjectName, idx);
    }
    return idx;
  }

  // Determine the SubjectType for a choice (approximate from slot kind)
  function inferType(kind: SlotKind | undefined): SubjectType {
    if (kind === 'LAB') return 'LAB';
    return 'THEORY';
  }

  for (const choice of timetable.choices) {
    const colorIndex = getColorIndex(choice.subjectName);

    for (const session of choice.option.sessions) {
      // Register time range
      if (!timeRangeSet.has(session.startMin)) {
        const startH = Math.floor(session.startMin / 60);
        const startM = session.startMin % 60;
        const endH = Math.floor(session.endMin / 60);
        const endM = session.endMin % 60;
        timeRangeSet.set(session.startMin, {
          start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
          end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
          startMin: session.startMin,
          endMin: session.endMin,
        });
      }

      // Build cell key
      const cellKey = `${session.day}-${session.startMin}`;

      const kind = getSlotKind(session.slotCode) as SlotKind | undefined;

      cells.set(cellKey, {
        subjectName: choice.subjectName,
        faculty: choice.option.faculty,
        venue: choice.option.venue,
        slotCode: session.slotCode,
        type: inferType(kind),
        kind: kind ?? 'THEORY',
        colorIndex,
      });
    }
  }

  // Sort time slots by startMin
  const timeSlots = Array.from(timeRangeSet.values()).sort(
    (a, b) => a.startMin - b.startMin
  );

  // Filter days to only those that have at least one cell
  const activeDays = new Set<DayOfWeek>();
  for (const key of cells.keys()) {
    const day = key.split('-')[0] as DayOfWeek;
    activeDays.add(day);
  }
  const days = ALL_DAYS.filter(d => activeDays.has(d));

  return { days: days.length > 0 ? days : ALL_DAYS, timeSlots, cells };
}
