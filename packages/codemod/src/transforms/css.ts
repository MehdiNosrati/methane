import { applyTextEdits, createMutableStats, type MutableStats } from '../edits.js';
import { compileManifest, type CompiledManifest } from '../manifest.js';
import type { MigrationManifest, TextEdit, TransformResult } from '../types.js';

interface CssToken {
  readonly kind: 'ident' | 'delim' | 'string' | 'comment' | 'whitespace' | 'lbrace' | 'rbrace' | 'lparen' | 'rparen' | 'lbracket' | 'rbracket' | 'colon' | 'semicolon' | 'comma' | 'at';
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

function isIdentStart(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 || // _
    code === 45 || // -
    code >= 128
  );
}

function isIdentContinue(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return isIdentStart(ch) || (code >= 48 && code <= 57);
}

function tokenizeCss(source: string): CssToken[] {
  const tokens: CssToken[] = [];
  const len = source.length;
  let i = 0;

  while (i < len) {
    const ch = source[i]!;

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f') {
      const start = i;
      i += 1;
      while (i < len) {
        const c = source[i]!;
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') {
          i += 1;
        } else {
          break;
        }
      }
      tokens.push({ kind: 'whitespace', start, end: i, text: source.slice(start, i) });
      continue;
    }

    // Comment
    if (ch === '/' && source[i + 1] === '*') {
      const start = i;
      const closeIdx = source.indexOf('*/', i + 2);
      i = closeIdx === -1 ? len : closeIdx + 2;
      tokens.push({ kind: 'comment', start, end: i, text: source.slice(start, i) });
      continue;
    }

    // String literal
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      i += 1;
      while (i < len) {
        const c = source[i]!;
        if (c === '\\') {
          i += 2;
          continue;
        }
        if (c === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      tokens.push({ kind: 'string', start, end: i, text: source.slice(start, i) });
      continue;
    }

    // At-keyword
    if (ch === '@' && i + 1 < len && isIdentStart(source[i + 1]!)) {
      const start = i;
      i += 2;
      while (i < len && isIdentContinue(source[i]!)) i += 1;
      tokens.push({ kind: 'at', start, end: i, text: source.slice(start, i) });
      continue;
    }

    // Identifier / custom property (--foo)
    if (isIdentStart(ch)) {
      // A lone '-' not followed by ident-start or '-' is a delim
      if (ch === '-' && i + 1 < len && !isIdentStart(source[i + 1]!) && !isIdentContinue(source[i + 1]!)) {
        tokens.push({ kind: 'delim', start: i, end: i + 1, text: ch });
        i += 1;
        continue;
      }
      const start = i;
      i += 1;
      while (i < len && isIdentContinue(source[i]!)) i += 1;
      tokens.push({ kind: 'ident', start, end: i, text: source.slice(start, i) });
      continue;
    }

    const singleKind: Record<string, CssToken['kind']> = {
      '{': 'lbrace',
      '}': 'rbrace',
      '(': 'lparen',
      ')': 'rparen',
      '[': 'lbracket',
      ']': 'rbracket',
      ':': 'colon',
      ';': 'semicolon',
      ',': 'comma',
    };

    const kind = singleKind[ch] ?? 'delim';
    tokens.push({ kind, start: i, end: i + 1, text: ch });
    i += 1;
  }

  return tokens;
}

function nextSignificant(tokens: ReadonlyArray<CssToken>, from: number): number {
  let idx = from;
  while (idx < tokens.length) {
    const kind = tokens[idx]!.kind;
    if (kind !== 'whitespace' && kind !== 'comment') return idx;
    idx += 1;
  }
  return -1;
}

function prevSignificant(tokens: ReadonlyArray<CssToken>, from: number): number {
  let idx = from;
  while (idx >= 0) {
    const kind = tokens[idx]!.kind;
    if (kind !== 'whitespace' && kind !== 'comment') return idx;
    idx -= 1;
  }
  return -1;
}

function unquoteCssString(text: string): { quote: string; value: string } | null {
  if (text.length < 2) return null;
  const first = text[0];
  const last = text[text.length - 1];
  if ((first === '"' || first === "'") && first === last) {
    return { quote: first, value: text.slice(1, -1) };
  }
  return null;
}

function collectSelectorEdits(
  tokens: ReadonlyArray<CssToken>,
  startIdx: number,
  endIdx: number,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
  baseOffset: number,
): void {
  let currentCompoundTag: string | null = null;
  let i = startIdx;

  while (i < endIdx) {
    const tok = tokens[i]!;

    if (tok.kind === 'whitespace' || tok.kind === 'comment') {
      i += 1;
      continue;
    }

    // Combinators or comma reset current compound element tag
    if (
      tok.kind === 'comma' ||
      (tok.kind === 'delim' && (tok.text === '>' || tok.text === '+' || tok.text === '~'))
    ) {
      currentCompoundTag = null;
      i += 1;
      continue;
    }

    // Attribute selector [...]
    if (tok.kind === 'lbracket') {
      const attrNameIdx = nextSignificant(tokens, i + 1);
      if (attrNameIdx !== -1 && attrNameIdx < endIdx) {
        const attrTok = tokens[attrNameIdx]!;
        if (attrTok.kind === 'ident') {
          const afterAttrIdx = nextSignificant(tokens, attrNameIdx + 1);
          const nextTok = afterAttrIdx !== -1 && afterAttrIdx < endIdx ? tokens[afterAttrIdx]! : null;

          // Check slot selector [slot="old"]
          if (
            attrTok.text.toLowerCase() === 'slot' &&
            nextTok?.kind === 'delim' &&
            nextTok.text === '='
          ) {
            const valIdx = nextSignificant(tokens, afterAttrIdx + 1);
            const valTok = valIdx !== -1 && valIdx < endIdx ? tokens[valIdx]! : null;
            if (valTok) {
              const unquoted =
                valTok.kind === 'string'
                  ? unquoteCssString(valTok.text)
                  : valTok.kind === 'ident'
                    ? { quote: '', value: valTok.text }
                    : null;
              if (unquoted) {
                const slotRule = compiled.matchSlot(currentCompoundTag, unquoted.value);
                if (slotRule && slotRule.to !== unquoted.value) {
                  edits.push({
                    start: baseOffset + valTok.start,
                    end: baseOffset + valTok.end,
                    replacement: unquoted.quote
                      ? `${unquoted.quote}${slotRule.to}${unquoted.quote}`
                      : slotRule.to,
                  });
                  stats.slotMigrations += 1;
                }
              }
            }
          } else {
            const attrRule = compiled.matchAttribute(currentCompoundTag, attrTok.text);
            if (attrRule && !attrRule.remove) {
              if (attrRule.to && attrRule.to !== attrTok.text) {
                edits.push({
                  start: baseOffset + attrTok.start,
                  end: baseOffset + attrTok.end,
                  replacement: attrRule.to,
                });
                stats.attributeMigrations += 1;
              }
              if (attrRule.valueMap && nextTok?.kind === 'delim' && nextTok.text === '=') {
                const valIdx = nextSignificant(tokens, afterAttrIdx + 1);
                const valTok = valIdx !== -1 && valIdx < endIdx ? tokens[valIdx]! : null;
                if (valTok) {
                  const unquoted =
                    valTok.kind === 'string'
                      ? unquoteCssString(valTok.text)
                      : valTok.kind === 'ident'
                        ? { quote: '', value: valTok.text }
                        : null;
                  if (unquoted) {
                    const mapped = attrRule.valueMap[unquoted.value];
                    if (mapped !== undefined && mapped !== unquoted.value) {
                      edits.push({
                        start: baseOffset + valTok.start,
                        end: baseOffset + valTok.end,
                        replacement: unquoted.quote
                          ? `${unquoted.quote}${mapped}${unquoted.quote}`
                          : mapped,
                      });
                      if (!attrRule.to || attrRule.to === attrTok.text) {
                        stats.attributeMigrations += 1;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Advance past closing ']'
      let j = i + 1;
      while (j < endIdx && tokens[j]!.kind !== 'rbracket') j += 1;
      i = j + 1;
      continue;
    }

    // Functional pseudo-classes like :is(...), :not(...), :where(...), :has(...)
    if (tok.kind === 'colon') {
      const nextIdx = i + 1;
      // Handle ::part(...) vs :is(...)
      if (nextIdx < endIdx && tokens[nextIdx]!.kind === 'colon') {
        // Skip ::pseudo-element(...)
        let j = nextIdx + 1;
        if (j < endIdx && tokens[j]!.kind === 'ident') j += 1;
        if (j < endIdx && tokens[j]!.kind === 'lparen') {
          let depth = 1;
          j += 1;
          while (j < endIdx && depth > 0) {
            if (tokens[j]!.kind === 'lparen') depth += 1;
            else if (tokens[j]!.kind === 'rparen') depth -= 1;
            j += 1;
          }
        }
        i = j;
        continue;
      }

      if (nextIdx < endIdx && tokens[nextIdx]!.kind === 'ident') {
        const pseudoName = tokens[nextIdx]!.text.toLowerCase();
        const afterPseudo = nextIdx + 1;
        if (afterPseudo < endIdx && tokens[afterPseudo]!.kind === 'lparen') {
          let depth = 1;
          let j = afterPseudo + 1;
          while (j < endIdx && depth > 0) {
            if (tokens[j]!.kind === 'lparen') depth += 1;
            else if (tokens[j]!.kind === 'rparen') depth -= 1;
            j += 1;
          }
          if (
            pseudoName === 'is' ||
            pseudoName === 'where' ||
            pseudoName === 'not' ||
            pseudoName === 'has' ||
            pseudoName === 'host' ||
            pseudoName === 'slotted'
          ) {
            collectSelectorEdits(
              tokens,
              afterPseudo + 1,
              j - 1,
              compiled,
              edits,
              stats,
              baseOffset,
            );
          }
          i = j;
          continue;
        }
        i = nextIdx + 1;
        continue;
      }
      i += 1;
      continue;
    }

    // Type selector check: ident NOT preceded immediately by '.', '#', ':', or '|'
    if (tok.kind === 'ident') {
      const prev = i > startIdx ? tokens[i - 1]! : null;
      const isClassOrIdOrPseudo =
        prev !== null &&
        ((prev.kind === 'delim' && (prev.text === '.' || prev.text === '#' || prev.text === '|')) ||
          prev.kind === 'colon');

      // Also verify that if prev was whitespace or comma or combinator or startIdx, it's a type selector
      if (!isClassOrIdOrPseudo) {
        const prevSigIdx = prevSignificant(tokens, i - 1);
        const prevSig = prevSigIdx >= startIdx ? tokens[prevSigIdx]! : null;
        const atCompoundStart =
          prevSig === null ||
          prevSig.kind === 'comma' ||
          prevSig.kind === 'lbrace' ||
          prevSig.kind === 'lparen' ||
          (prevSig.kind === 'delim' &&
            (prevSig.text === '>' || prevSig.text === '+' || prevSig.text === '~')) ||
          (prev !== null && prev.kind === 'whitespace');

        if (atCompoundStart && tok.text.includes('-')) {
          currentCompoundTag = tok.text;
          const rewritten = compiled.rewriteTag(tok.text);
          if (rewritten !== tok.text) {
            edits.push({
              start: baseOffset + tok.start,
              end: baseOffset + tok.end,
              replacement: rewritten,
            });
            stats.tagRewrites += 1;
          }
        }
      }
    }

    i += 1;
  }
}

function collectValueTokenEdits(
  tokens: ReadonlyArray<CssToken>,
  startIdx: number,
  endIdx: number,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
  baseOffset: number,
): void {
  for (let i = startIdx; i < endIdx; i++) {
    const tok = tokens[i]!;
    if (tok.kind === 'ident' && tok.text.toLowerCase() === 'var') {
      const next = i + 1;
      if (next < endIdx && tokens[next]!.kind === 'lparen') {
        const argIdx = nextSignificant(tokens, next + 1);
        if (argIdx !== -1 && argIdx < endIdx) {
          const argTok = tokens[argIdx]!;
          if (argTok.kind === 'ident' && argTok.text.startsWith('--')) {
            const rewritten = compiled.rewriteToken(argTok.text);
            if (rewritten !== argTok.text) {
              edits.push({
                start: baseOffset + argTok.start,
                end: baseOffset + argTok.end,
                replacement: rewritten,
              });
              stats.tokenRenames += 1;
            }
          }
        }
      }
    }
  }
}

function collectBlockEdits(
  tokens: ReadonlyArray<CssToken>,
  startIdx: number,
  endIdx: number,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
  baseOffset: number,
): void {
  let i = startIdx;
  while (i < endIdx) {
    const sigIdx = nextSignificant(tokens, i);
    if (sigIdx === -1 || sigIdx >= endIdx) break;
    const tok = tokens[sigIdx]!;

    // At-rule
    if (tok.kind === 'at') {
      const atName = tok.text.toLowerCase();
      // Scan until '{' or ';' at depth 0
      let j = sigIdx + 1;
      let parenDepth = 0;
      while (j < endIdx) {
        const t = tokens[j]!;
        if (t.kind === 'lparen') parenDepth += 1;
        else if (t.kind === 'rparen') parenDepth = Math.max(0, parenDepth - 1);
        else if (parenDepth === 0 && (t.kind === 'lbrace' || t.kind === 'semicolon')) break;
        j += 1;
      }

      if (atName === '@property') {
        const propIdx = nextSignificant(tokens, sigIdx + 1);
        if (propIdx !== -1 && propIdx < j) {
          const propTok = tokens[propIdx]!;
          if (propTok.kind === 'ident' && propTok.text.startsWith('--')) {
            const rewritten = compiled.rewriteToken(propTok.text);
            if (rewritten !== propTok.text) {
              edits.push({
                start: baseOffset + propTok.start,
                end: baseOffset + propTok.end,
                replacement: rewritten,
              });
              stats.tokenRenames += 1;
            }
          }
        }
      }

      if (j < endIdx && tokens[j]!.kind === 'lbrace') {
        // Find matching '}'
        let depth = 1;
        let closeIdx = j + 1;
        while (closeIdx < endIdx && depth > 0) {
          if (tokens[closeIdx]!.kind === 'lbrace') depth += 1;
          else if (tokens[closeIdx]!.kind === 'rbrace') depth -= 1;
          closeIdx += 1;
        }
        if (atName !== '@property') {
          collectBlockEdits(tokens, j + 1, closeIdx - 1, compiled, edits, stats, baseOffset);
        }
        i = closeIdx;
      } else {
        i = j + 1;
      }
      continue;
    }

    // Look ahead to distinguish declaration (`prop: value;`) vs qualified rule (`selector { ... }`).
    let scan = sigIdx;
    let braceIdx = -1;
    let semiIdx = -1;
    let colonIdx = -1;
    let parenDepth = 0;
    let bracketDepth = 0;

    while (scan < endIdx) {
      const t = tokens[scan]!;
      if (t.kind === 'lparen') parenDepth += 1;
      else if (t.kind === 'rparen') parenDepth = Math.max(0, parenDepth - 1);
      else if (t.kind === 'lbracket') bracketDepth += 1;
      else if (t.kind === 'rbracket') bracketDepth = Math.max(0, bracketDepth - 1);
      else if (parenDepth === 0 && bracketDepth === 0) {
        if (t.kind === 'colon' && colonIdx === -1) colonIdx = scan;
        if (t.kind === 'semicolon') {
          semiIdx = scan;
          break;
        }
        if (t.kind === 'lbrace') {
          braceIdx = scan;
          break;
        }
      }
      scan += 1;
    }

    if (braceIdx !== -1) {
      // Qualified rule: selector is [sigIdx, braceIdx)
      collectSelectorEdits(tokens, sigIdx, braceIdx, compiled, edits, stats, baseOffset);
      // Find matching '}'
      let depth = 1;
      let closeIdx = braceIdx + 1;
      while (closeIdx < endIdx && depth > 0) {
        if (tokens[closeIdx]!.kind === 'lbrace') depth += 1;
        else if (tokens[closeIdx]!.kind === 'rbrace') depth -= 1;
        closeIdx += 1;
      }
      collectBlockEdits(tokens, braceIdx + 1, closeIdx - 1, compiled, edits, stats, baseOffset);
      i = closeIdx;
      continue;
    }

    // Declaration (terminated by ';' or end of block)
    const declEnd = semiIdx !== -1 ? semiIdx : endIdx;
    if (colonIdx !== -1 && tok.kind === 'ident' && colonIdx > sigIdx) {
      if (tok.text.startsWith('--')) {
        const rewritten = compiled.rewriteToken(tok.text);
        if (rewritten !== tok.text) {
          edits.push({
            start: baseOffset + tok.start,
            end: baseOffset + tok.end,
            replacement: rewritten,
          });
          stats.tokenRenames += 1;
        }
      }
      collectValueTokenEdits(tokens, colonIdx + 1, declEnd, compiled, edits, stats, baseOffset);
    } else {
      collectValueTokenEdits(tokens, sigIdx, declEnd, compiled, edits, stats, baseOffset);
    }

    i = semiIdx !== -1 ? semiIdx + 1 : endIdx;
  }
}

export function collectCssEdits(
  source: string,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
  baseOffset = 0,
): void {
  const tokens = tokenizeCss(source);
  collectBlockEdits(tokens, 0, tokens.length, compiled, edits, stats, baseOffset);
}

/**
 * Transform CSS inline declaration list (e.g. HTML `style="..."` attribute value).
 */
export function collectCssDeclarationEdits(
  source: string,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
  baseOffset = 0,
): void {
  const tokens = tokenizeCss(source);
  collectBlockEdits(tokens, 0, tokens.length, compiled, edits, stats, baseOffset);
}

/**
 * Transform a CSS stylesheet AST idempotently according to a `MigrationManifest`.
 */
export function transformCss(
  source: string,
  manifest: MigrationManifest | CompiledManifest,
): TransformResult {
  const compiled = 'rewriteTag' in manifest ? manifest : compileManifest(manifest);
  const edits: TextEdit[] = [];
  const stats = createMutableStats();
  collectCssEdits(source, compiled, edits, stats, 0);
  const { text, applied } = applyTextEdits(source, edits);
  return {
    code: text,
    changed: applied > 0,
    editsCount: applied,
    stats,
  };
}
