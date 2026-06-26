// ─── Parser ───
// Parse & validate the raw data.json schema, normalize into NormalizedSubject[]

import type {
  DataJson,
  SubjectInput,
  NormalizedSubject,
  NormalizedOption,
  ParseResult,
  SubjectType,
} from '../types';
import { expandOption, isKnownSlot } from './slotTimeRegistry';

let nextOptionId = 0;

/**
 * Reset the global option ID counter (useful for testing).
 */
export function resetOptionIdCounter(): void {
  nextOptionId = 0;
}

/**
 * Validate that a value looks like a valid SubjectInput.
 */
function validateSubjectInput(name: string, raw: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`Subject "${name}": expected an object.`);
    return { valid: false, errors };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.credits !== 'number' || obj.credits < 0) {
    errors.push(`Subject "${name}": credits must be a non-negative number.`);
  }
  if (obj.type !== 'THEORY' && obj.type !== 'LAB') {
    errors.push(`Subject "${name}": type must be "THEORY" or "LAB".`);
  }
  if (typeof obj.mandatory !== 'boolean') {
    errors.push(`Subject "${name}": mandatory must be a boolean.`);
  }
  if (!Array.isArray(obj.options)) {
    errors.push(`Subject "${name}": options must be an array.`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parse raw data.json content into a fully normalized ParseResult.
 */
export function parseData(data: DataJson): ParseResult {
  nextOptionId = 0;

  const subjects: NormalizedSubject[] = [];
  const allFacultySet = new Set<string>();
  const allVenueSet = new Set<string>();
  const globalErrors: string[] = [];
  const globalWarnings: string[] = [];
  let totalOptions = 0;

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    globalErrors.push('Input data must be a non-null object (Record<string, SubjectInput>).');
    return { subjects: [], allFaculty: [], allVenues: [], errors: globalErrors, warnings: globalWarnings, totalOptions: 0 };
  }

  const subjectNames = Object.keys(data);
  if (subjectNames.length === 0) {
    globalErrors.push('Input data contains no subjects.');
    return { subjects: [], allFaculty: [], allVenues: [], errors: globalErrors, warnings: globalWarnings, totalOptions: 0 };
  }

  for (const name of subjectNames) {
    const raw = data[name] as SubjectInput;
    const validation = validateSubjectInput(name, raw);
    if (!validation.valid) {
      globalErrors.push(...validation.errors);
      continue;
    }

    const subjectErrors: string[] = [];
    const subjectWarnings: string[] = [];
    const normalizedOptions: NormalizedOption[] = [];

    if (!raw.options || raw.options.length === 0) {
      subjectErrors.push(`Subject "${name}": has no options (empty options array).`);
    } else {
      for (let i = 0; i < raw.options.length; i++) {
        const opt = raw.options[i]!;

        // Validate option fields
        if (typeof opt.faculty !== 'string' || opt.faculty.trim() === '') {
          subjectWarnings.push(`Subject "${name}" option ${i}: missing or empty faculty.`);
        }
        if (typeof opt.slot !== 'string' || opt.slot.trim() === '') {
          subjectWarnings.push(`Subject "${name}" option ${i}: missing or empty slot string. Skipping.`);
          continue;
        }
        if (typeof opt.venue !== 'string') {
          subjectWarnings.push(`Subject "${name}" option ${i}: missing venue field.`);
        }

        // Expand slot string by splitting on '+'
        const slotCodes = opt.slot
          .split('+')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        if (slotCodes.length === 0) {
          subjectWarnings.push(`Subject "${name}" option ${i}: slot string "${opt.slot}" produces no slot codes. Skipping.`);
          continue;
        }

        // Check for unknown slot codes
        const unknownCodes = slotCodes.filter(c => !isKnownSlot(c));
        const hasUnknownSlot = unknownCodes.length > 0;

        if (hasUnknownSlot) {
          subjectWarnings.push(
            `Subject "${name}" option ${i}: unknown slot code(s): ${unknownCodes.join(', ')}. Excluding this option.`
          );
          // Exclude option with unknown slots, but don't block the entire subject
          continue;
        }

        // Expand into sessions
        const { sessions, unknownSlotCodes } = expandOption({
          slotCodes,
          subjectName: name,
        });

        // This should not happen since we pre-checked, but guard anyway
        if (unknownSlotCodes.length > 0) {
          subjectWarnings.push(
            `Subject "${name}" option ${i}: unexpected unknown slot code(s): ${unknownSlotCodes.join(', ')}. Excluding option.`
          );
          continue;
        }

        const normalizedOpt: NormalizedOption = {
          id: nextOptionId++,
          subjectName: name,
          faculty: opt.faculty?.trim() ?? '',
          slot: opt.slot,
          slotCodes,
          venue: opt.venue?.trim() ?? '',
          sessions,
          hasUnknownSlot: false,
          unknownSlotCodes: [],
        };

        normalizedOptions.push(normalizedOpt);

        // Collect faculty and venues
        if (normalizedOpt.faculty) allFacultySet.add(normalizedOpt.faculty);
        if (normalizedOpt.venue) allVenueSet.add(normalizedOpt.venue);
      }
    }

    // Check if all options were excluded → blocking error for mandatory
    if (normalizedOptions.length === 0 && raw.mandatory) {
      subjectErrors.push(
        `Subject "${name}" (mandatory): all options excluded or empty — no valid timetable possible.`
      );
    } else if (normalizedOptions.length === 0 && !raw.mandatory) {
      subjectWarnings.push(
        `Subject "${name}" (elective): all options excluded or empty — this subject will be unavailable.`
      );
    }

    totalOptions += normalizedOptions.length;

    subjects.push({
      name,
      credits: raw.credits,
      type: raw.type as SubjectType,
      mandatory: raw.mandatory,
      group: raw.group,
      options: normalizedOptions,
      errors: subjectErrors,
      warnings: subjectWarnings,
    });

    // Promote subject-level errors/warnings to global
    globalErrors.push(...subjectErrors);
    globalWarnings.push(...subjectWarnings);
  }

  return {
    subjects,
    allFaculty: Array.from(allFacultySet).sort(),
    allVenues: Array.from(allVenueSet).sort(),
    errors: globalErrors,
    warnings: globalWarnings,
    totalOptions,
  };
}

/**
 * Alias for parseData — kept for backwards compatibility with existing consumers.
 */
export const parseDataJson = parseData;

