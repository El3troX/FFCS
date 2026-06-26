// ─── Teacher Filter Engine ───
// Blacklist/whitelist filtering for faculty (teachers)

import type { NormalizedSubject, Timetable } from '../types';

/**
 * Apply a blacklist of faculty names to subjects.
 * Returns new subjects with options filtered to exclude blacklisted faculty.
 * Does NOT mutate the original subjects.
 */
export function applyBlacklist(
  subjects: NormalizedSubject[],
  blacklist: Set<string>
): NormalizedSubject[] {
  if (blacklist.size === 0) return subjects;

  return subjects.map(subject => {
    const filteredOptions = subject.options.filter(
      opt => !blacklist.has(opt.faculty)
    );

    const warnings = [...subject.warnings];
    const removedCount = subject.options.length - filteredOptions.length;
    if (removedCount > 0) {
      warnings.push(
        `Subject "${subject.name}": ${removedCount} option(s) removed by faculty blacklist.`
      );
    }

    const errors = [...subject.errors];
    if (filteredOptions.length === 0 && subject.mandatory) {
      errors.push(
        `Subject "${subject.name}" (mandatory): all options removed by blacklist — no valid timetable possible.`
      );
    }

    return {
      ...subject,
      options: filteredOptions,
      warnings,
      errors,
    };
  });
}

/**
 * Apply a whitelist post-filter to already-generated timetables.
 * A timetable passes if at least one of its choices uses a whitelisted faculty.
 * If whitelist is empty, all timetables pass.
 */
export function applyWhitelistPostFilter(
  timetables: Timetable[],
  whitelist: Set<string>
): Timetable[] {
  if (whitelist.size === 0) return timetables;

  return timetables.filter(tt =>
    tt.choices.some(choice => whitelist.has(choice.option.faculty))
  );
}

/**
 * Detect overlap between blacklist and whitelist.
 * Returns warning messages for any faculty that appear in both lists.
 */
export function detectOverlapConflicts(
  blacklist: Set<string>,
  whitelist: Set<string>
): string[] {
  const warnings: string[] = [];

  for (const faculty of whitelist) {
    if (blacklist.has(faculty)) {
      warnings.push(
        `Faculty "${faculty}" appears in both blacklist and whitelist. Blacklist takes precedence — this faculty will be excluded.`
      );
    }
  }

  return warnings;
}

/**
 * Validate that all whitelist entries correspond to known faculty names.
 * Returns warnings for any entries that don't match.
 */
export function validateWhitelistEntries(
  whitelist: Set<string>,
  allFaculty: string[]
): string[] {
  const warnings: string[] = [];
  const knownSet = new Set(allFaculty);

  for (const name of whitelist) {
    if (!knownSet.has(name)) {
      warnings.push(
        `Whitelist entry "${name}" does not match any known faculty. It will have no effect.`
      );
    }
  }

  return warnings;
}
