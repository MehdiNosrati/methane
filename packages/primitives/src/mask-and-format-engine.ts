import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type MaskMode = 'pattern' | 'numeric' | 'iban' | 'card';

export interface PatternMaskConfig {
  mode: 'pattern';
  pattern: string;
  definitions?: Record<string, RegExp>;
}

export interface NumericMaskConfig {
  mode: 'numeric';
  locale?: string;
  decimals?: number;
  allowNegative?: boolean;
  groupSeparator?: string;
  decimalSeparator?: string;
  prefix?: string;
  suffix?: string;
}

export interface IbanMaskConfig {
  mode: 'iban';
}

export interface CardMaskConfig {
  mode: 'card';
}

export type MaskConfig = PatternMaskConfig | NumericMaskConfig | IbanMaskConfig | CardMaskConfig;

export interface MaskResult {
  readonly formatted: string;
  readonly unmasked: string;
  readonly caret: number;
  readonly isComplete: boolean;
  readonly isValid: boolean;
}

const DEFAULT_PATTERN_TOKENS: Record<string, RegExp> = {
  '0': /\d/,
  '9': /\d/,
  A: /[a-zA-Z]/,
  '*': /[a-zA-Z0-9]/,
};

/**
 * Cursor-preserving input masking and formatting engine for pattern masks,
 * grouped numerics, IBANs (with mod-97 check), and payment cards (with BIN grouping & Luhn check).
 */
export class MaskAndFormatEngine implements ReactiveController {
  private readonly host: ReactiveControllerHost | null;
  private config: MaskConfig;
  private _lastResult: MaskResult = {
    formatted: '',
    unmasked: '',
    caret: 0,
    isComplete: false,
    isValid: true,
  };

  constructor(config: MaskConfig, host: ReactiveControllerHost | null = null) {
    this.config = config;
    this.host = host;
    this.host?.addController(this);
  }

  get lastResult(): MaskResult {
    return this._lastResult;
  }

  hostConnected(): void {
    // Stateless except lastResult.
  }

  hostDisconnected(): void {
    // No external listeners.
  }

  setConfig(config: MaskConfig): void {
    this.config = config;
    this.host?.requestUpdate();
  }

  format(rawValue: string, caretPosition: number = rawValue.length): MaskResult {
    let result: MaskResult;
    switch (this.config.mode) {
      case 'pattern':
        result = applyPatternMask(rawValue, caretPosition, this.config);
        break;
      case 'numeric':
        result = applyNumericMask(rawValue, caretPosition, this.config);
        break;
      case 'iban':
        result = applyIbanMask(rawValue, caretPosition);
        break;
      case 'card':
        result = applyCardMask(rawValue, caretPosition);
        break;
    }
    this._lastResult = result;
    this.host?.requestUpdate();
    return result;
  }

  applyInput(inputEl: HTMLInputElement, previousValue?: string): MaskResult {
    const rawCaret = inputEl.selectionStart ?? inputEl.value.length;
    const raw = inputEl.value;
    // Detect backspace right before a literal mask character and step over the token before it.
    if (
      this.config.mode === 'pattern' &&
      previousValue !== undefined &&
      raw.length === previousValue.length - 1
    ) {
      const deletedChar = previousValue[rawCaret];
      const tokens = { ...DEFAULT_PATTERN_TOKENS, ...this.config.definitions };
      const patternChar = this.config.pattern[rawCaret];
      if (deletedChar && patternChar && !tokens[patternChar] && deletedChar === patternChar) {
        const stripped = raw.slice(0, Math.max(0, rawCaret - 1)) + raw.slice(rawCaret);
        const res = this.format(stripped, Math.max(0, rawCaret - 1));
        inputEl.value = res.formatted;
        setInputCaretSafe(inputEl, res.caret);
        return res;
      }
    }
    const res = this.format(raw, rawCaret);
    inputEl.value = res.formatted;
    setInputCaretSafe(inputEl, res.caret);
    return res;
  }
}

function applyPatternMask(
  rawValue: string,
  caretPosition: number,
  config: PatternMaskConfig,
): MaskResult {
  const tokens = { ...DEFAULT_PATTERN_TOKENS, ...config.definitions };
  const pattern = config.pattern;

  let unmasked = '';
  let unmaskedBeforeCaret = 0;

  for (let i = 0; i < rawValue.length; i += 1) {
    const ch = rawValue[i] ?? '';
    const patternChar = pattern[i];
    // Skip exact literal echoes already sitting in their pattern slot.
    if (patternChar && !tokens[patternChar] && ch === patternChar) {
      continue;
    }
    if (matchesAnyToken(ch, pattern, tokens)) {
      unmasked += ch;
      if (i < caretPosition) {
        unmaskedBeforeCaret += 1;
      }
    }
  }

  let formatted = '';
  let unmaskedIdx = 0;
  let nextCaret = 0;
  let caretPlaced = false;
  let consumedTokens = 0;

  for (let p = 0; p < pattern.length; p += 1) {
    const pChar = pattern[p] ?? '';
    const matcher = tokens[pChar];
    if (!matcher) {
      if (unmaskedIdx < unmasked.length || unmaskedIdx === 0) {
        if (unmaskedIdx === 0 && rawValue.length === 0) {
          break;
        }
        if (unmaskedIdx < unmasked.length) {
          formatted += pChar;
        }
      }
      continue;
    }

    let matchedChar: string | null = null;
    while (unmaskedIdx < unmasked.length) {
      const candidate = unmasked[unmaskedIdx] ?? '';
      unmaskedIdx += 1;
      if (matcher.test(candidate)) {
        matchedChar = candidate;
        break;
      }
    }

    if (matchedChar === null) {
      break;
    }

    formatted += matchedChar;
    consumedTokens += 1;
    if (!caretPlaced && consumedTokens >= unmaskedBeforeCaret) {
      nextCaret = unmaskedBeforeCaret === 0 ? 0 : formatted.length;
      caretPlaced = true;
    }
  }

  if (!caretPlaced) {
    nextCaret = formatted.length;
  }

  // Re-evaluate required token count across full pattern for completeness.
  let totalTokens = 0;
  for (const pChar of pattern) {
    if (tokens[pChar]) totalTokens += 1;
  }
  const actualUnmasked = extractPatternUnmasked(formatted, pattern, tokens);

  return {
    formatted,
    unmasked: actualUnmasked,
    caret: nextCaret,
    isComplete: actualUnmasked.length === totalTokens,
    isValid: actualUnmasked.length === totalTokens,
  };
}

function extractPatternUnmasked(
  formatted: string,
  pattern: string,
  tokens: Record<string, RegExp>,
): string {
  let out = '';
  for (let i = 0; i < formatted.length && i < pattern.length; i += 1) {
    const pChar = pattern[i] ?? '';
    if (tokens[pChar]) {
      out += formatted[i] ?? '';
    }
  }
  return out;
}

function matchesAnyToken(
  ch: string,
  pattern: string,
  tokens: Record<string, RegExp>,
): boolean {
  for (const pChar of pattern) {
    const matcher = tokens[pChar];
    if (matcher && matcher.test(ch)) return true;
  }
  return false;
}

function applyNumericMask(
  rawValue: string,
  caretPosition: number,
  config: NumericMaskConfig,
): MaskResult {
  const groupSep = config.groupSeparator ?? ',';
  const decimalSep = config.decimalSeparator ?? '.';
  const decimals = config.decimals;
  const allowNegative = config.allowNegative ?? true;
  const prefix = config.prefix ?? '';
  const suffix = config.suffix ?? '';

  // Count significant characters before caret.
  let clean = '';
  let seenDecimal = false;
  let sigBeforeCaret = 0;
  let sigTotal = 0;

  for (let i = 0; i < rawValue.length; i += 1) {
    const ch = rawValue[i] ?? '';
    let accepted = false;
    if (ch === '-' && allowNegative && clean.length === 0) {
      clean += '-';
      accepted = true;
    } else if (/\d/.test(ch)) {
      if (seenDecimal && decimals !== undefined) {
        const decPart = clean.split('.')[1] ?? '';
        if (decPart.length < decimals) {
          clean += ch;
          accepted = true;
        }
      } else {
        clean += ch;
        accepted = true;
      }
    } else if (ch === decimalSep && !seenDecimal && (decimals === undefined || decimals > 0)) {
      seenDecimal = true;
      if (clean === '' || clean === '-') {
        clean += '0.';
      } else {
        clean += '.';
      }
      accepted = true;
    }
    if (accepted) {
      sigTotal += 1;
      if (i < caretPosition) {
        sigBeforeCaret += 1;
      }
    }
  }

  if (clean === '' || clean === '-') {
    const formatted = prefix + clean + suffix;
    return {
      formatted,
      unmasked: clean,
      caret: prefix.length + clean.length,
      isComplete: false,
      isValid: clean === '',
    };
  }

  const isNeg = clean.startsWith('-');
  const unsigned = isNeg ? clean.slice(1) : clean;
  const [rawInt = '0', rawDec] = unsigned.split('.');
  const groupedInt = groupSep ? rawInt.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep) : rawInt;
  const body =
    (isNeg ? '-' : '') + groupedInt + (rawDec !== undefined ? `${decimalSep}${rawDec}` : '');
  const formatted = `${prefix}${body}${suffix}`;

  // Walk formatted string to locate the caret at the Nth significant character.
  let caret = prefix.length + body.length;
  if (sigBeforeCaret === 0) {
    caret = prefix.length;
  } else {
    let seen = 0;
    for (let i = prefix.length; i < prefix.length + body.length; i += 1) {
      const ch = formatted[i] ?? '';
      if (/\d/.test(ch) || ch === '-' || ch === decimalSep) {
        seen += 1;
        if (seen >= sigBeforeCaret) {
          caret = i + 1;
          break;
        }
      }
    }
  }
  if (sigBeforeCaret >= sigTotal) {
    caret = prefix.length + body.length;
  }

  return {
    formatted,
    unmasked: clean,
    caret,
    isComplete: clean.length > 0 && clean !== '-',
    isValid: Number.isFinite(Number(clean)),
  };
}

function applyIbanMask(rawValue: string, caretPosition: number): MaskResult {
  const { clean, cleanBeforeCaret } = extractAlnumWithCaret(rawValue, caretPosition, 34, (c) =>
    c.toUpperCase(),
  );
  const formatted = groupEveryN(clean, 4, ' ');
  const caret = mapCleanCaretToGrouped(cleanBeforeCaret, formatted, ' ');
  return {
    formatted,
    unmasked: clean,
    caret,
    isComplete: clean.length >= 15,
    isValid: validateIbanMod97(clean),
  };
}

function applyCardMask(rawValue: string, caretPosition: number): MaskResult {
  const { clean, cleanBeforeCaret } = extractAlnumWithCaret(
    rawValue,
    caretPosition,
    19,
    (c) => c,
    /\d/,
  );
  const isAmex = /^3[47]/.test(clean);
  const limited = isAmex ? clean.slice(0, 15) : clean.slice(0, 16);
  const formatted = isAmex ? formatGroups(limited, [4, 6, 5]) : groupEveryN(limited, 4, ' ');
  const caret = mapCleanCaretToGrouped(
    Math.min(cleanBeforeCaret, limited.length),
    formatted,
    ' ',
  );
  const targetLen = isAmex ? 15 : 16;
  return {
    formatted,
    unmasked: limited,
    caret,
    isComplete: limited.length === targetLen,
    isValid: limited.length >= 12 && validateLuhn(limited),
  };
}

function extractAlnumWithCaret(
  raw: string,
  caret: number,
  maxLen: number,
  transform: (ch: string) => string,
  matcher: RegExp = /[a-zA-Z0-9]/,
): { clean: string; cleanBeforeCaret: number } {
  let clean = '';
  let cleanBeforeCaret = 0;
  for (let i = 0; i < raw.length && clean.length < maxLen; i += 1) {
    const ch = raw[i] ?? '';
    if (matcher.test(ch)) {
      clean += transform(ch);
      if (i < caret) {
        cleanBeforeCaret += 1;
      }
    }
  }
  return { clean, cleanBeforeCaret };
}

function groupEveryN(value: string, n: number, sep: string): string {
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += n) {
    parts.push(value.slice(i, i + n));
  }
  return parts.join(sep);
}

function formatGroups(value: string, groups: ReadonlyArray<number>): string {
  const parts: string[] = [];
  let offset = 0;
  for (const size of groups) {
    if (offset >= value.length) break;
    parts.push(value.slice(offset, offset + size));
    offset += size;
  }
  return parts.join(' ');
}

function mapCleanCaretToGrouped(
  cleanBeforeCaret: number,
  formatted: string,
  separator: string,
): number {
  if (cleanBeforeCaret <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (formatted[i] !== separator) {
      seen += 1;
      if (seen >= cleanBeforeCaret) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

export function validateIbanMod97(iban: string): boolean {
  const normalized = iban.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized)) {
    return false;
  }
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digits =
      ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of digits) {
      remainder = (remainder * 10 + Number(d)) % 97;
    }
  }
  return remainder === 1;
}

export function validateLuhn(digits: string): boolean {
  if (!/^\d+$/.test(digits) || digits.length < 12) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (shouldDouble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function setInputCaretSafe(inputEl: HTMLInputElement, caret: number): void {
  try {
    inputEl.setSelectionRange(caret, caret);
  } catch {
    // Non-text inputs ignore selection ranges.
  }
}
