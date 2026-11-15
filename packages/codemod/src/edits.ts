import type { TextEdit, TransformStats } from './types.js';

export function createEmptyStats(): TransformStats {
  return {
    tagRewrites: 0,
    tokenRenames: 0,
    attributeMigrations: 0,
    slotMigrations: 0,
    eventMigrations: 0,
  };
}

export function mergeStats(a: TransformStats, b: TransformStats): TransformStats {
  return {
    tagRewrites: a.tagRewrites + b.tagRewrites,
    tokenRenames: a.tokenRenames + b.tokenRenames,
    attributeMigrations: a.attributeMigrations + b.attributeMigrations,
    slotMigrations: a.slotMigrations + b.slotMigrations,
    eventMigrations: a.eventMigrations + b.eventMigrations,
  };
}

export interface MutableStats {
  tagRewrites: number;
  tokenRenames: number;
  attributeMigrations: number;
  slotMigrations: number;
  eventMigrations: number;
}

export function createMutableStats(): MutableStats {
  return {
    tagRewrites: 0,
    tokenRenames: 0,
    attributeMigrations: 0,
    slotMigrations: 0,
    eventMigrations: 0,
  };
}

/**
 * Apply non-overlapping `TextEdit` spans to `source` while preserving all untouched bytes.
 * Filters no-op edits and deduplicates identical spans for strict idempotency.
 */
export function applyTextEdits(
  source: string,
  edits: ReadonlyArray<TextEdit>,
): { readonly text: string; readonly applied: number } {
  const meaningful: TextEdit[] = [];
  const seen = new Set<string>();

  for (const edit of edits) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > source.length) {
      throw new RangeError(
        `Invalid TextEdit span [${edit.start}, ${edit.end}] for source length ${source.length}`,
      );
    }
    const existing = source.slice(edit.start, edit.end);
    if (existing === edit.replacement) {
      continue;
    }
    const key = `${edit.start}:${edit.end}:${edit.replacement}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    meaningful.push(edit);
  }

  if (meaningful.length === 0) {
    return { text: source, applied: 0 };
  }

  const sorted = [...meaningful].sort((a, b) => a.start - b.start || a.end - b.end);

  // Filter out any nested/overlapping edits deterministically (outermost / earliest wins).
  const nonOverlapping: TextEdit[] = [];
  let lastEnd = -1;
  for (const edit of sorted) {
    if (edit.start < lastEnd) {
      continue;
    }
    nonOverlapping.push(edit);
    lastEnd = edit.end;
  }

  let result = source;
  for (let i = nonOverlapping.length - 1; i >= 0; i--) {
    const edit = nonOverlapping[i];
    if (!edit) continue;
    result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  }

  return { text: result, applied: nonOverlapping.length };
}
