export type TokenKind = 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'plain';

export interface CodeToken {
  readonly kind: TokenKind;
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

const KEYWORDS = new Set([
  'async',
  'await',
  'boolean',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'interface',
  'let',
  'new',
  'null',
  'number',
  'of',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'static',
  'string',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
]);

/**
 * Tokenizes a line or source snippet safely in linear O(n) time without ReDoS risk.
 */
export function tokenizeLine(line: string, language: string): Array<CodeToken> {
  if (!line) return [];
  if (language === 'text' || language === 'plain') {
    return [{ kind: 'plain', text: line, start: 0, end: line.length }];
  }

  const tokens: Array<CodeToken> = [];
  let i = 0;
  const len = line.length;

  const pushPlain = (start: number, end: number): void => {
    if (end <= start) return;
    const prev = tokens[tokens.length - 1];
    const slice = line.slice(start, end);
    if (prev && prev.kind === 'plain' && prev.end === start) {
      tokens[tokens.length - 1] = {
        kind: 'plain',
        text: prev.text + slice,
        start: prev.start,
        end,
      };
    } else {
      tokens.push({ kind: 'plain', text: slice, start, end });
    }
  };

  while (i < len) {
    const ch = line[i]!;
    const next = line[i + 1];

    if (ch === '/' && next === '/') {
      tokens.push({ kind: 'comment', text: line.slice(i), start: i, end: len });
      break;
    }

    if (ch === '#' && (language === 'bash' || language === 'sh' || language === 'python')) {
      tokens.push({ kind: 'comment', text: line.slice(i), start: i, end: len });
      break;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < len) {
        if (line[j] === '\\' && j + 1 < len) {
          j += 2;
          continue;
        }
        if (line[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      tokens.push({ kind: 'string', text: line.slice(i, j), start: i, end: j });
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[0-9._xbXa-fA-F]/.test(line[j]!)) {
        j += 1;
      }
      tokens.push({ kind: 'number', text: line.slice(i, j), start: i, end: j });
      i = j;
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[a-zA-Z0-9_$]/.test(line[j]!)) {
        j += 1;
      }
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        tokens.push({ kind: 'keyword', text: word, start: i, end: j });
      } else {
        pushPlain(i, j);
      }
      i = j;
      continue;
    }

    if (/[=<>!+\-*/&|?:]/.test(ch)) {
      tokens.push({ kind: 'operator', text: ch, start: i, end: i + 1 });
      i += 1;
      continue;
    }

    pushPlain(i, i + 1);
    i += 1;
  }

  return tokens;
}

/**
 * Parses a range specification such as `"1,3-5,9"` into a set of 1-based line numbers.
 */
export function parseHighlightLines(spec: string): ReadonlySet<number> {
  const result = new Set<number>();
  if (!spec.trim()) return result;
  for (const part of spec.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const range = /^(\d+)-(\d+)$/.exec(trimmed);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      const lo = Math.min(start, end);
      const hi = Math.min(lo + 500, Math.max(start, end));
      for (let n = lo; n <= hi; n += 1) {
        result.add(n);
      }
    } else if (/^\d+$/.test(trimmed)) {
      result.add(Number(trimmed));
    }
  }
  return result;
}
