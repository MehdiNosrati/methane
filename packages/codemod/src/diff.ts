interface DiffOp {
  readonly kind: 'equal' | 'delete' | 'insert';
  readonly line: string;
  readonly oldLine: number;
  readonly newLine: number;
}

function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

function computeLineDiff(beforeLines: ReadonlyArray<string>, afterLines: ReadonlyArray<string>): DiffOp[] {
  const m = beforeLines.length;
  const n = afterLines.length;

  // Trim common prefix and suffix to keep DP matrix minimal on large files.
  let prefix = 0;
  while (prefix < m && prefix < n && beforeLines[prefix] === afterLines[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < m - prefix &&
    suffix < n - prefix &&
    beforeLines[m - 1 - suffix] === afterLines[n - 1 - suffix]
  ) {
    suffix += 1;
  }

  const ops: DiffOp[] = [];
  for (let i = 0; i < prefix; i++) {
    ops.push({
      kind: 'equal',
      line: beforeLines[i] ?? '',
      oldLine: i + 1,
      newLine: i + 1,
    });
  }

  const midA = beforeLines.slice(prefix, m - suffix);
  const midB = afterLines.slice(prefix, n - suffix);
  const aLen = midA.length;
  const bLen = midB.length;

  // Build LCS table on the changed middle region.
  const stride = bLen + 1;
  const dp = new Int32Array((aLen + 1) * stride);

  for (let i = aLen - 1; i >= 0; i--) {
    for (let j = bLen - 1; j >= 0; j--) {
      const idx = i * stride + j;
      if (midA[i] === midB[j]) {
        dp[idx] = (dp[(i + 1) * stride + (j + 1)] ?? 0) + 1;
      } else {
        const down = dp[(i + 1) * stride + j] ?? 0;
        const right = dp[i * stride + (j + 1)] ?? 0;
        dp[idx] = down >= right ? down : right;
      }
    }
  }

  let i = 0;
  let j = 0;
  while (i < aLen && j < bLen) {
    if (midA[i] === midB[j]) {
      ops.push({
        kind: 'equal',
        line: midA[i] ?? '',
        oldLine: prefix + i + 1,
        newLine: prefix + j + 1,
      });
      i += 1;
      j += 1;
    } else {
      const down = dp[(i + 1) * stride + j] ?? 0;
      const right = dp[i * stride + (j + 1)] ?? 0;
      if (down >= right) {
        ops.push({
          kind: 'delete',
          line: midA[i] ?? '',
          oldLine: prefix + i + 1,
          newLine: prefix + j + 1,
        });
        i += 1;
      } else {
        ops.push({
          kind: 'insert',
          line: midB[j] ?? '',
          oldLine: prefix + i + 1,
          newLine: prefix + j + 1,
        });
        j += 1;
      }
    }
  }

  while (i < aLen) {
    ops.push({
      kind: 'delete',
      line: midA[i] ?? '',
      oldLine: prefix + i + 1,
      newLine: prefix + j + 1,
    });
    i += 1;
  }

  while (j < bLen) {
    ops.push({
      kind: 'insert',
      line: midB[j] ?? '',
      oldLine: prefix + i + 1,
      newLine: prefix + j + 1,
    });
    j += 1;
  }

  for (let s = 0; s < suffix; s++) {
    const oldIdx = m - suffix + s;
    const newIdx = n - suffix + s;
    ops.push({
      kind: 'equal',
      line: beforeLines[oldIdx] ?? '',
      oldLine: oldIdx + 1,
      newLine: newIdx + 1,
    });
  }

  return ops;
}

/**
 * Create a standard unified diff string between `before` and `after` for `--dry-run` preview.
 */
export function createUnifiedDiff(
  filePath: string,
  before: string,
  after: string,
  contextLines = 3,
): string {
  if (before === after) return '';

  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  const ops = computeLineDiff(beforeLines, afterLines);

  const changeIndices: number[] = [];
  for (let idx = 0; idx < ops.length; idx++) {
    const op = ops[idx];
    if (op && op.kind !== 'equal') {
      changeIndices.push(idx);
    }
  }
  if (changeIndices.length === 0) return '';

  // Group nearby changes into unified diff hunks.
  const hunks: Array<{ startIdx: number; endIdx: number }> = [];
  let hunkStart = Math.max(0, (changeIndices[0] ?? 0) - contextLines);
  let hunkEnd = Math.min(ops.length - 1, (changeIndices[0] ?? 0) + contextLines);

  for (let k = 1; k < changeIndices.length; k++) {
    const idx = changeIndices[k] ?? 0;
    const nextStart = Math.max(0, idx - contextLines);
    if (nextStart <= hunkEnd + 1) {
      hunkEnd = Math.min(ops.length - 1, idx + contextLines);
    } else {
      hunks.push({ startIdx: hunkStart, endIdx: hunkEnd });
      hunkStart = nextStart;
      hunkEnd = Math.min(ops.length - 1, idx + contextLines);
    }
  }
  hunks.push({ startIdx: hunkStart, endIdx: hunkEnd });

  const out: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

  for (const hunk of hunks) {
    const slice = ops.slice(hunk.startIdx, hunk.endIdx + 1);
    const first = slice[0];
    if (!first) continue;

    let oldCount = 0;
    let newCount = 0;
    const body: string[] = [];

    for (const op of slice) {
      if (op.kind === 'equal') {
        oldCount += 1;
        newCount += 1;
        body.push(` ${op.line}`);
      } else if (op.kind === 'delete') {
        oldCount += 1;
        body.push(`-${op.line}`);
      } else {
        newCount += 1;
        body.push(`+${op.line}`);
      }
    }

    out.push(`@@ -${first.oldLine},${oldCount} +${first.newLine},${newCount} @@`);
    out.push(...body);
  }

  return `${out.join('\n')}\n`;
}
