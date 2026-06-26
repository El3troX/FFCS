import React, { useMemo, forwardRef } from 'react';
import type { Timetable, DayOfWeek, GridCell } from '../types';
import slotTimeMap from '../data/slotTimeMap.json';
import type { SlotTimeMap } from '../types';

const SLOT_DATA = slotTimeMap as unknown as SlotTimeMap;

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
};

// Subject color palette — vibrant & harmonious
const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#d946ef', '#f472b6',
];

const THEORY_BLOCKS = [
  { start: '08:00', end: '08:50', startMin: 480, endMin: 530 },
  { start: '09:00', end: '09:50', startMin: 540, endMin: 590 },
  { start: '10:00', end: '10:50', startMin: 600, endMin: 650 },
  { start: '11:00', end: '11:50', startMin: 660, endMin: 710 },
  { start: '12:00', end: '12:50', startMin: 720, endMin: 770 },
  { start: '14:00', end: '14:50', startMin: 840, endMin: 890 },
  { start: '15:00', end: '15:50', startMin: 900, endMin: 950 },
  { start: '16:00', end: '16:50', startMin: 960, endMin: 1010 },
  { start: '17:00', end: '17:50', startMin: 1020, endMin: 1070 },
  { start: '18:00', end: '18:50', startMin: 1080, endMin: 1130 },
  { start: '19:00', end: '19:50', startMin: 1140, endMin: 1190 },
];

const LAB_BLOCKS = [
  { start: '08:00', end: '08:50', startMin: 480, endMin: 530 },
  { start: '08:50', end: '09:40', startMin: 530, endMin: 580 },
  { start: '09:40', end: '10:30', startMin: 580, endMin: 630 },
  { start: '10:30', end: '11:20', startMin: 630, endMin: 680 },
  { start: '11:20', end: '12:10', startMin: 680, endMin: 730 },
  { start: '12:10', end: '13:00', startMin: 730, endMin: 780 },
  { start: '14:00', end: '14:50', startMin: 840, endMin: 890 },
  { start: '14:50', end: '15:40', startMin: 890, endMin: 940 },
  { start: '15:40', end: '16:30', startMin: 940, endMin: 990 },
  { start: '16:30', end: '17:20', startMin: 990, endMin: 1040 },
  { start: '17:20', end: '18:10', startMin: 1040, endMin: 1090 },
  { start: '18:10', end: '19:00', startMin: 1090, endMin: 1140 },
];

// Helper to convert minute offset to grid column (08:00 = 480, 10 min = 1 col, +2 for day label column)
const getGridCol = (min: number) => Math.max(2, Math.floor((min - 480) / 10) + 2);

// Build a flat array of rendered sessions
type RenderSession = GridCell & {
  day: DayOfWeek;
  startMin: number;
  endMin: number;
};

function buildRenderSessions(timetable: Timetable): RenderSession[] {
  const sessions: RenderSession[] = [];
  const subjectNames = [...new Set(timetable.choices.map(c => c.subjectName))];
  const subjectColorMap = new Map<string, number>();
  subjectNames.forEach((name, i) => {
    subjectColorMap.set(name, i % SUBJECT_COLORS.length);
  });

  for (const choice of timetable.choices) {
    const { subjectName, option } = choice;
    const colorIndex = subjectColorMap.get(subjectName) ?? 0;

    for (const slotCode of option.slotCodes) {
      const slotEntry = SLOT_DATA[slotCode];
      if (!slotEntry) continue;

      for (const occ of slotEntry.occurrences) {
        const [sh, sm] = occ.start.split(':').map(Number);
        const [eh, em] = occ.end.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;

        sessions.push({
          day: occ.day,
          startMin,
          endMin,
          subjectName,
          faculty: option.faculty,
          venue: option.venue,
          slotCode,
          type: slotEntry.kind === 'LAB' ? 'LAB' : 'THEORY',
          kind: slotEntry.kind,
          colorIndex,
        });
      }
    }
  }

  return sessions;
}

// Abbreviate subject name
function abbreviate(name: string): string {
  if (name.length <= 8) return name;
  const words = name.split(/[\s\-_]+/);
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase()).join('');
  }
  return name.substring(0, 7);
}

// Shorten faculty name
function shortenFaculty(name: string): string {
  if (name.length <= 12) return name;
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0) + '. ' + parts.slice(1).join(' ');
  }
  return name.substring(0, 11) + '…';
}

type TimetableGridProps = {
  timetable: Timetable;
  compact?: boolean;
  className?: string;
};

export const TimetableGrid = forwardRef<HTMLDivElement, TimetableGridProps>(
  function TimetableGrid({ timetable, compact = false, className = '' }, ref) {
    const sessions = useMemo(() => buildRenderSessions(timetable), [timetable]);

    return (
      <div ref={ref} className={`overflow-x-auto ${className} pb-4`}>
        <div
          className="timetable-grid relative min-w-[900px]"
          style={{
            display: 'grid',
            gridTemplateColumns: `56px repeat(72, 1fr)`,
            gridTemplateRows: `auto auto repeat(${DAYS.length}, 1fr)`,
            gap: '2px',
          }}
        >
          {/* Header Row 1: Theory */}
          <div className="timetable-header-cell flex flex-col justify-center items-center bg-surface-800/80 rounded-tl-lg" style={{ gridRow: 1, gridColumn: 1 }}>
            <span className="text-[0.6rem] font-bold text-accent-purple">THEORY</span>
          </div>
          {THEORY_BLOCKS.map((p, i) => (
            <div
              key={`th-${i}`}
              className="timetable-header-cell bg-surface-800/60 flex flex-col justify-center items-center rounded-sm"
              style={{
                gridRow: 1,
                gridColumn: `${getGridCol(p.startMin)} / ${getGridCol(p.endMin)}`,
              }}
            >
              <span className="text-[0.65rem] font-medium text-surface-200">{p.start}</span>
              <span className="text-[0.55rem] text-surface-400">{p.end}</span>
            </div>
          ))}

          {/* Header Row 2: Lab */}
          <div className="timetable-header-cell flex flex-col justify-center items-center bg-surface-800/80" style={{ gridRow: 2, gridColumn: 1 }}>
            <span className="text-[0.6rem] font-bold text-accent-cyan">LAB</span>
          </div>
          {LAB_BLOCKS.map((p, i) => (
            <div
              key={`lh-${i}`}
              className="timetable-header-cell bg-surface-800/40 flex flex-col justify-center items-center border-t border-surface-700/50 rounded-sm"
              style={{
                gridRow: 2,
                gridColumn: `${getGridCol(p.startMin)} / ${getGridCol(p.endMin)}`,
              }}
            >
              <span className="text-[0.6rem] text-surface-300">{p.start}</span>
              <span className="text-[0.5rem] text-surface-500">{p.end}</span>
            </div>
          ))}

          {/* Lunch Divider Overlay */}
          <div
            className="timetable-lunch-divider rounded-md flex items-center justify-center bg-surface-800/30 border border-surface-700/50 backdrop-blur-sm z-10"
            style={{
              gridRow: `1 / span ${DAYS.length + 2}`,
              gridColumn: `${getGridCol(13 * 60)} / ${getGridCol(14 * 60)}`,
            }}
          >
            <span className="[writing-mode:vertical-lr] rotate-180 text-[0.6rem] font-bold tracking-widest text-surface-500">
              LUNCH BREAK
            </span>
          </div>

          {/* Day rows */}
          {DAYS.map((day, dayIdx) => (
            <React.Fragment key={day}>
              {/* Day label */}
              <div
                className="timetable-day-cell flex items-center justify-center bg-surface-800/80 font-bold text-xs"
                style={{ gridRow: dayIdx + 3, gridColumn: 1 }}
              >
                {DAY_LABELS[day]}
              </div>

              {/* Day Background grid to show empty slots */}
              {Array.from({ length: 72 }).map((_, colIdx) => {
                const isLunch = colIdx >= 30 && colIdx < 36;
                if (isLunch) return null; // handled by lunch overlay
                return (
                  <div
                    key={`bg-${day}-${colIdx}`}
                    className="border border-surface-800/30"
                    style={{ gridRow: dayIdx + 3, gridColumn: colIdx + 2 }}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {/* Render Sessions */}
          {sessions.map((session, i) => {
            const dayIdx = DAYS.indexOf(session.day);
            if (dayIdx === -1) return null;

            const bgColor = SUBJECT_COLORS[session.colorIndex];
            const startCol = getGridCol(session.startMin);
            const endCol = getGridCol(session.endMin);

            return (
              <div
                key={`s-${i}`}
                className="timetable-cell occupied absolute inset-[1px] rounded-md shadow-sm z-20 flex flex-col items-center justify-center overflow-hidden hover:scale-[1.02] hover:shadow-md hover:z-30 transition-all cursor-default"
                style={{
                  position: 'relative',
                  gridRow: dayIdx + 3,
                  gridColumn: `${startCol} / ${endCol}`,
                  background: `linear-gradient(135deg, ${bgColor}dd, ${bgColor}99)`,
                  border: `1px solid ${bgColor}55`,
                }}
                title={`${session.subjectName}\n${session.faculty}\n${session.venue}\n${session.slotCode}`}
              >
                <span className="subject-code text-[0.65rem] font-bold text-white leading-tight text-center px-1">
                  {abbreviate(session.subjectName)}
                </span>
                {!compact && (
                  <>
                    <span className="faculty-name text-[0.55rem] text-white/90 leading-tight mt-0.5 truncate w-full text-center px-1">
                      {shortenFaculty(session.faculty)}
                    </span>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="venue-label text-[0.5rem] bg-black/20 px-1 rounded text-white/90">{session.venue}</span>
                      <span className="slot-label text-[0.5rem] bg-black/20 px-1 rounded text-white/90">{session.slotCode}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default TimetableGrid;
