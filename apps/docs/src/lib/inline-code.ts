export interface InlineCodeSegment {
  readonly kind: 'text' | 'code';
  readonly value: string;
}

/**
 * Splits prose containing markdown inline backtick spans into safe text and code segments.
 */
export function splitInlineCode(input: string): ReadonlyArray<InlineCodeSegment> {
  if (!input.includes('`')) {
    return [{ kind: 'text', value: input }];
  }

  const segments: InlineCodeSegment[] = [];
  const pattern = /`([^`]+)`/g;
  let lastIndex = 0;

  for (const match of input.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ kind: 'text', value: input.slice(lastIndex, start) });
    }
    segments.push({ kind: 'code', value: match[1] ?? '' });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < input.length) {
    segments.push({ kind: 'text', value: input.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: 'text', value: input }];
}
