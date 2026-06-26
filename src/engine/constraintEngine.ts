// ─── Constraint Engine ───
// Builds CSP variables from NormalizedSubject[], applies blacklist, sorts by MRV

import type {
  NormalizedSubject,
  CSPVariable,
  CSPDomainEntry,
} from '../types';

let nextDomainEntryId = 0;

/**
 * Build CSP variables from normalized subjects.
 *
 * - One variable per mandatory subject (domain = its option IDs)
 * - One variable per elective group (domain = flattened (subject,option) pairs + NONE)
 * - Subjects with group but not mandatory are treated as elective group members
 *
 * @param subjects - The normalized subjects
 * @param blacklist - Set of faculty names to exclude
 * @param electiveGroupRequirements - Map of groupName → whether at least one must be selected
 * @returns CSP variables sorted by MRV, plus any errors
 */
export function buildCSPVariables(
  subjects: NormalizedSubject[],
  blacklist: Set<string> = new Set(),
  electiveGroupRequirements: Record<string, boolean> = {}
): { variables: CSPVariable[]; errors: string[] } {
  nextDomainEntryId = 0;
  const errors: string[] = [];
  const variables: CSPVariable[] = [];

  // Separate mandatory from elective
  const mandatorySubjects = subjects.filter(s => s.mandatory);
  const electiveSubjects = subjects.filter(s => !s.mandatory);

  // ─── Mandatory subjects: one variable each ───
  for (const subject of mandatorySubjects) {
    const domain = buildDomainForSubject(subject, blacklist);

    if (domain.length === 0) {
      errors.push(
        `Mandatory subject "${subject.name}" has empty domain after applying blacklist — no valid timetable possible.`
      );
    }

    variables.push({
      name: subject.name,
      isMandatory: true,
      isElectiveGroup: false,
      domain,
    });
  }

  // ─── Elective groups: one variable per group ───
  const electiveGroups = new Map<string, NormalizedSubject[]>();
  const ungroupedElectives: NormalizedSubject[] = [];

  for (const subject of electiveSubjects) {
    if (subject.group) {
      const group = electiveGroups.get(subject.group) ?? [];
      group.push(subject);
      electiveGroups.set(subject.group, group);
    } else {
      ungroupedElectives.push(subject);
    }
  }

  // Grouped electives
  for (const [groupName, groupSubjects] of electiveGroups) {
    const domain: CSPDomainEntry[] = [];

    for (const subject of groupSubjects) {
      const subjectDomain = buildDomainForSubject(subject, blacklist);
      domain.push(...subjectDomain);
    }

    // Add NONE entry (no elective chosen from this group)
    const requireOne = electiveGroupRequirements[groupName] ?? false;
    if (!requireOne) {
      domain.push({
        id: nextDomainEntryId++,
        optionId: -1,
        subjectName: '__NONE__',
        option: null,
      });
    }

    if (domain.length === 0) {
      errors.push(
        `Elective group "${groupName}" has empty domain after applying blacklist — all options excluded.`
      );
    }

    variables.push({
      name: groupName,
      isMandatory: false,
      isElectiveGroup: true,
      groupName,
      domain,
    });
  }

  // Ungrouped electives: each is its own variable with NONE option
  for (const subject of ungroupedElectives) {
    const domain = buildDomainForSubject(subject, blacklist);

    // Add NONE entry
    domain.push({
      id: nextDomainEntryId++,
      optionId: -1,
      subjectName: '__NONE__',
      option: null,
    });

    variables.push({
      name: subject.name,
      isMandatory: false,
      isElectiveGroup: false,
      domain,
    });
  }

  // ─── Sort by MRV (smallest domain first) ───
  // Mandatory subjects should come first among those with same domain size
  variables.sort((a, b) => {
    const sizeDiff = a.domain.length - b.domain.length;
    if (sizeDiff !== 0) return sizeDiff;
    // Prioritize mandatory over elective
    if (a.isMandatory && !b.isMandatory) return -1;
    if (!a.isMandatory && b.isMandatory) return 1;
    return 0;
  });

  return { variables, errors };
}

/**
 * Build domain entries for a single subject, filtering by blacklist.
 */
function buildDomainForSubject(
  subject: NormalizedSubject,
  blacklist: Set<string>
): CSPDomainEntry[] {
  const domain: CSPDomainEntry[] = [];

  for (const option of subject.options) {
    // Filter out blacklisted faculty
    if (blacklist.has(option.faculty)) continue;

    domain.push({
      id: nextDomainEntryId++,
      optionId: option.id,
      subjectName: subject.name,
      option,
    });
  }

  return domain;
}

/**
 * Estimate total search space as product of domain sizes.
 * Returns Infinity if the product would overflow.
 */
export function estimateSearchSpace(variables: CSPVariable[]): number {
  let total = 1;
  for (const v of variables) {
    total *= v.domain.length;
    if (!isFinite(total) || total > Number.MAX_SAFE_INTEGER) return Infinity;
  }
  return total;
}
