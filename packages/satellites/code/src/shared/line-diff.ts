export type DiffLineKind = 'unchanged' | 'added' | 'removed';

export interface DiffLine {
  readonly kind: DiffLineKind;
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly text: string;
}

export interface DiffComputeResult {
  readonly lines: ReadonlyArray<DiffLine>;
  readonly hunkIndices: ReadonlyArray<number>;
  readonly additions: number;
  readonly deletions: number;
}

/**
 * Computes an LCS-based line diff between `original` and `modified` texts.
 */
export function computeLineDiff(original: string, modified: string): DiffComputeResult {
  const a = original === '' ? [] : original.replace(/\r\n?/g, '\n').split('\n');
  const b = modified === '' ? [] : modified.replace(/\r\n?/g, '\n').split('\n');
  const m = a.length;
  const n = b.length;

  // Guard pathological huge inputs cleanly
  if (m * n > 250_000) {
    const fallbackLines: Array<DiffLine> = [
      ...a.map((text, idx) => ({ kind: 'removed' as const, oldLine: idx + 1, newLine: null, text })),
      ...b.map((text, idx) => ({ kind: 'added' as const, oldLine: null, newLine: idx + 1, text })),
    ];
    const hunks = fallbackLines.length > 0 ? [0] : [];
    return {
      lines: fallbackLines,
      hunkIndices: hunks,
      additions: b.length,
      deletions: a.length,
    };
  }

  const dp: Array<Int32Array> = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i -= 1) {
    const row = dp[i]!;
    const nextRow = dp[i + 1]!;
    for (let j = n - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) {
        row[j] = nextRow[j + 1]! + 1;
      } else {
        const down = nextRow[j]!;
        const right = row[j + 1]!;
        row[j] = down >= right ? down : right;
      }
    }
  }

  const lines: Array<DiffLine> = [];
  let i = 0;
  let j = 0;
  let additions = 0;
  let deletions = 0;

  while (i < m && j < n) {
    if (a[i] === b[j]) {
      lines.push({ kind: 'unchanged', oldLine: i + 1, newLine: j + 1, text: a[i]! });
      i += 1;
      j += 1;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      lines.push({ kind: 'removed', oldLine: i + 1, newLine: null, text: a[i]! });
      deletions += 1;
      i += 1;
    } else {
      lines.push({ kind: 'added', oldLine: null, newLine: j + 1, text: b[j]! });
      additions += 1;
      j += 1;
    }
  }

  while (i < m) {
    lines.push({ kind: 'removed', oldLine: i + 1, newLine: null, text: a[i]! });
    deletions += 1;
    i += 1;
  }

  while (j < n) {
    lines.push({ kind: 'added', oldLine: null, newLine: j + 1, text: b[j]! });
    additions += 1;
    j += 1;
  }

  const hunkIndices: Array<number> = [];
  let inChange = false;
  for (let idx = 0; idx < lines.length; idx += 1) {
    const changed = lines[idx]!.kind !== 'unchanged';
    if (changed && !inChange) {
      hunkIndices.push(idx);
      inChange = true;
    } else if (!changed) {
      inChange = false;
    }
  }

  return { lines, hunkIndices, additions, deletions };
}
