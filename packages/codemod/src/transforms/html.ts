import { applyTextEdits, createMutableStats, type MutableStats } from '../edits.js';
import { compileManifest, type CompiledManifest } from '../manifest.js';
import type { MigrationManifest, TextEdit, TransformResult } from '../types.js';
import { collectCssDeclarationEdits, collectCssEdits } from './css.js';

export interface HtmlAttrNode {
  readonly rawName: string;
  readonly nameStart: number;
  readonly nameEnd: number;
  readonly value: string | null;
  readonly valueStart: number; // start of unquoted or inside quotes
  readonly valueEnd: number;
  readonly attrStart: number; // start of attribute (after whitespace)
  readonly attrEnd: number;
  readonly quote: '"' | "'" | '';
  readonly leadingWsStart: number;
}

export interface HtmlElementOpen {
  readonly tagName: string;
  readonly tagStart: number;
  readonly tagEnd: number;
  readonly openEnd: number; // index right after '>' or '/>'
  readonly selfClosing: boolean;
  readonly attributes: ReadonlyArray<HtmlAttrNode>;
}

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function isTagNameChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    (code >= 48 && code <= 57) || // 0-9
    ch === '-' ||
    ch === '_' ||
    ch === ':' ||
    ch === '.'
  );
}

function isWs(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}

function parseOpenTag(source: string, ltIndex: number): HtmlElementOpen | null {
  const len = source.length;
  let i = ltIndex + 1;
  if (i >= len || !/[a-zA-Z]/.test(source[i]!)) return null;

  const tagStart = i;
  while (i < len && isTagNameChar(source[i]!)) i += 1;
  const tagEnd = i;
  const tagName = source.slice(tagStart, tagEnd);

  const attributes: HtmlAttrNode[] = [];
  let selfClosing = false;

  while (i < len) {
    const leadingWsStart = i;
    while (i < len && isWs(source[i]!)) i += 1;
    if (i >= len) break;

    if (source[i] === '>') {
      return {
        tagName,
        tagStart,
        tagEnd,
        openEnd: i + 1,
        selfClosing,
        attributes,
      };
    }

    if (source[i] === '/' && source[i + 1] === '>') {
      selfClosing = true;
      return {
        tagName,
        tagStart,
        tagEnd,
        openEnd: i + 2,
        selfClosing,
        attributes,
      };
    }

    // Parse attribute name (supports @event, .prop, ?bool, :bind, (event), [prop], v-on:event, on:event)
    const attrStart = i;
    const nameStart = i;
    while (i < len) {
      const ch = source[i]!;
      if (isWs(ch) || ch === '=' || ch === '>' || (ch === '/' && source[i + 1] === '>')) {
        break;
      }
      i += 1;
    }
    const nameEnd = i;
    if (nameEnd === nameStart) {
      i += 1;
      continue;
    }

    const rawName = source.slice(nameStart, nameEnd);
    let scan = i;
    while (scan < len && isWs(source[scan]!)) scan += 1;

    if (scan < len && source[scan] === '=') {
      scan += 1;
      while (scan < len && isWs(source[scan]!)) scan += 1;

      if (scan < len && (source[scan] === '"' || source[scan] === "'")) {
        const quote = source[scan] as '"' | "'";
        scan += 1;
        const valueStart = scan;
        while (scan < len && source[scan] !== quote) {
          scan += 1;
        }
        const valueEnd = scan;
        const value = source.slice(valueStart, valueEnd);
        if (scan < len && source[scan] === quote) scan += 1;
        attributes.push({
          rawName,
          nameStart,
          nameEnd,
          value,
          valueStart,
          valueEnd,
          attrStart,
          attrEnd: scan,
          quote,
          leadingWsStart,
        });
        i = scan;
      } else {
        const valueStart = scan;
        while (scan < len) {
          const ch = source[scan]!;
          if (isWs(ch) || ch === '>' || (ch === '/' && source[scan + 1] === '>')) break;
          scan += 1;
        }
        const valueEnd = scan;
        const value = source.slice(valueStart, valueEnd);
        attributes.push({
          rawName,
          nameStart,
          nameEnd,
          value,
          valueStart,
          valueEnd,
          attrStart,
          attrEnd: scan,
          quote: '',
          leadingWsStart,
        });
        i = scan;
      }
    } else {
      attributes.push({
        rawName,
        nameStart,
        nameEnd,
        value: null,
        valueStart: nameEnd,
        valueEnd: nameEnd,
        attrStart,
        attrEnd: nameEnd,
        quote: '',
        leadingWsStart,
      });
      i = nameEnd;
    }
  }

  return null;
}

interface ParsedEventBinding {
  readonly prefix: string;
  readonly eventName: string;
  readonly suffix: string;
}

function parseEventBindingAttr(rawName: string): ParsedEventBinding | null {
  if (rawName.startsWith('@')) {
    const rest = rawName.slice(1);
    const dotIdx = rest.indexOf('.');
    const eventName = dotIdx === -1 ? rest : rest.slice(0, dotIdx);
    const suffix = dotIdx === -1 ? '' : rest.slice(dotIdx);
    return eventName ? { prefix: '@', eventName, suffix } : null;
  }
  if (rawName.startsWith('v-on:')) {
    const rest = rawName.slice(5);
    const dotIdx = rest.indexOf('.');
    const eventName = dotIdx === -1 ? rest : rest.slice(0, dotIdx);
    const suffix = dotIdx === -1 ? '' : rest.slice(dotIdx);
    return eventName ? { prefix: 'v-on:', eventName, suffix } : null;
  }
  if (rawName.startsWith('on:')) {
    const rest = rawName.slice(3);
    const pipeIdx = rest.indexOf('|');
    const eventName = pipeIdx === -1 ? rest : rest.slice(0, pipeIdx);
    const suffix = pipeIdx === -1 ? '' : rest.slice(pipeIdx);
    return eventName ? { prefix: 'on:', eventName, suffix } : null;
  }
  if (rawName.startsWith('(') && rawName.endsWith(')') && rawName.length > 2) {
    return {
      prefix: '(',
      eventName: rawName.slice(1, -1),
      suffix: ')',
    };
  }
  return null;
}

function getRemovalSpan(source: string, attr: HtmlAttrNode): { start: number; end: number } {
  const ws = source.slice(attr.leadingWsStart, attr.attrStart);
  if (ws.includes('\n')) {
    // Attribute was on its own line; trim only spaces/tabs on that line before attr, or keep newline structure clean
    const lastNl = ws.lastIndexOf('\n');
    return {
      start: attr.leadingWsStart + lastNl,
      end: attr.attrEnd,
    };
  }
  return {
    start: attr.leadingWsStart,
    end: attr.attrEnd,
  };
}

export interface HtmlTransformHooks {
  readonly collectScriptEdits?: (
    scriptCode: string,
    compiled: CompiledManifest,
    edits: TextEdit[],
    stats: MutableStats,
    baseOffset: number,
  ) => void;
}

export function collectHtmlEdits(
  source: string,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
  baseOffset = 0,
  hooks?: HtmlTransformHooks,
): void {
  const len = source.length;
  const tagStack: string[] = [];
  let i = 0;

  while (i < len) {
    const lt = source.indexOf('<', i);
    if (lt === -1) break;

    // HTML comment <!-- ... -->
    if (source.startsWith('<!--', lt)) {
      const endComment = source.indexOf('-->', lt + 4);
      i = endComment === -1 ? len : endComment + 3;
      continue;
    }

    // Doctype or processing instruction <!...> / <?...>
    if (source[lt + 1] === '!' || source[lt + 1] === '?') {
      const gt = source.indexOf('>', lt + 2);
      i = gt === -1 ? len : gt + 1;
      continue;
    }

    // Closing tag </tag>
    if (source[lt + 1] === '/') {
      const nameStart = lt + 2;
      let scan = nameStart;
      while (scan < len && isTagNameChar(source[scan]!)) scan += 1;
      const closeTagName = source.slice(nameStart, scan);
      const gt = source.indexOf('>', scan);
      const closeEnd = gt === -1 ? len : gt + 1;

      if (closeTagName) {
        const rewrittenClose = compiled.rewriteTag(closeTagName);
        if (rewrittenClose !== closeTagName) {
          edits.push({
            start: baseOffset + nameStart,
            end: baseOffset + scan,
            replacement: rewrittenClose,
          });
          // Tag rewrite count is incremented on open tag (or here only if unmatched).
          const top = tagStack[tagStack.length - 1];
          if (!top || top.toLowerCase() !== closeTagName.toLowerCase()) {
            stats.tagRewrites += 1;
          }
        }
        // Pop matching tag from stack
        for (let s = tagStack.length - 1; s >= 0; s--) {
          if (tagStack[s]!.toLowerCase() === closeTagName.toLowerCase()) {
            tagStack.splice(s);
            break;
          }
        }
      }

      i = closeEnd;
      continue;
    }

    // Opening tag
    const open = parseOpenTag(source, lt);
    if (!open) {
      i = lt + 1;
      continue;
    }

    const parentTag = tagStack.length > 0 ? (tagStack[tagStack.length - 1] ?? null) : null;
    const rewrittenTag = compiled.rewriteTag(open.tagName);
    if (rewrittenTag !== open.tagName) {
      edits.push({
        start: baseOffset + open.tagStart,
        end: baseOffset + open.tagEnd,
        replacement: rewrittenTag,
      });
      stats.tagRewrites += 1;
    }

    const existingAttrNames = new Set(
      open.attributes.map((a) => {
        const name = a.rawName.startsWith('?') ? a.rawName.slice(1) : a.rawName;
        return name.toLowerCase();
      }),
    );

    for (const attr of open.attributes) {
      // 1. Inline style="--mth-..."
      if (attr.rawName.toLowerCase() === 'style' && attr.value !== null) {
        collectCssDeclarationEdits(
          attr.value,
          compiled,
          edits,
          stats,
          baseOffset + attr.valueStart,
        );
        continue;
      }

      // 2. Event bindings (@event, v-on:event, (event), on:event)
      const eventBinding = parseEventBindingAttr(attr.rawName);
      if (eventBinding) {
        const eventRule = compiled.matchEvent(open.tagName, eventBinding.eventName);
        if (eventRule && eventRule.to !== eventBinding.eventName) {
          edits.push({
            start: baseOffset + attr.nameStart,
            end: baseOffset + attr.nameEnd,
            replacement: `${eventBinding.prefix}${eventRule.to}${eventBinding.suffix}`,
          });
          stats.eventMigrations += 1;
        }
        continue;
      }

      // 3. Slot attribute (`slot="old"` on child, or `<slot name="old">` inside shadow template)
      if (attr.rawName.toLowerCase() === 'slot' && attr.value !== null) {
        const slotRule =
          compiled.matchSlot(parentTag, attr.value) ??
          compiled.matchSlot(open.tagName, attr.value);
        if (slotRule && slotRule.to !== attr.value) {
          edits.push({
            start: baseOffset + attr.valueStart,
            end: baseOffset + attr.valueEnd,
            replacement: slotRule.to,
          });
          stats.slotMigrations += 1;
        }
        continue;
      }

      if (
        open.tagName.toLowerCase() === 'slot' &&
        attr.rawName.toLowerCase() === 'name' &&
        attr.value !== null
      ) {
        const slotRule = compiled.matchSlot(parentTag, attr.value);
        if (slotRule && slotRule.to !== attr.value) {
          edits.push({
            start: baseOffset + attr.valueStart,
            end: baseOffset + attr.valueEnd,
            replacement: slotRule.to,
          });
          stats.slotMigrations += 1;
        }
        continue;
      }

      // 4. Attribute migrations (supports optional Lit '?' boolean prefix)
      const isLitBool = attr.rawName.startsWith('?') && attr.rawName.length > 1;
      const cleanAttrName = isLitBool ? attr.rawName.slice(1) : attr.rawName;
      const attrRule = compiled.matchAttribute(open.tagName, cleanAttrName);
      if (attrRule) {
        if (attrRule.remove) {
          const span = getRemovalSpan(source, attr);
          edits.push({
            start: baseOffset + span.start,
            end: baseOffset + span.end,
            replacement: '',
          });
          stats.attributeMigrations += 1;
          continue;
        }

        let attrChanged = false;
        if (attrRule.to && attrRule.to.toLowerCase() !== cleanAttrName.toLowerCase()) {
          if (existingAttrNames.has(attrRule.to.toLowerCase())) {
            // Target attribute already exists; remove deprecated duplicate cleanly.
            const span = getRemovalSpan(source, attr);
            edits.push({
              start: baseOffset + span.start,
              end: baseOffset + span.end,
              replacement: '',
            });
            stats.attributeMigrations += 1;
            continue;
          }
          edits.push({
            start: baseOffset + attr.nameStart,
            end: baseOffset + attr.nameEnd,
            replacement: isLitBool ? `?${attrRule.to}` : attrRule.to,
          });
          attrChanged = true;
        }

        if (attrRule.valueMap && attr.value !== null) {
          const mappedValue = attrRule.valueMap[attr.value];
          if (mappedValue !== undefined && mappedValue !== attr.value) {
            edits.push({
              start: baseOffset + attr.valueStart,
              end: baseOffset + attr.valueEnd,
              replacement: mappedValue,
            });
            attrChanged = true;
          }
        }

        if (attrChanged) {
          stats.attributeMigrations += 1;
        }
      }
    }

    const lowerTag = open.tagName.toLowerCase();

    // Embedded <style>...</style> or <script>...</script>
    if (!open.selfClosing && (lowerTag === 'style' || lowerTag === 'script')) {
      const closeTagPattern = new RegExp(`</${lowerTag}\\s*>`, 'i');
      const rest = source.slice(open.openEnd);
      const closeMatch = closeTagPattern.exec(rest);
      if (closeMatch) {
        const contentStart = open.openEnd;
        const contentEnd = open.openEnd + closeMatch.index;
        const inner = source.slice(contentStart, contentEnd);
        if (lowerTag === 'style') {
          collectCssEdits(inner, compiled, edits, stats, baseOffset + contentStart);
        } else if (hooks?.collectScriptEdits) {
          hooks.collectScriptEdits(inner, compiled, edits, stats, baseOffset + contentStart);
        }
        i = contentEnd + closeMatch[0].length;
        continue;
      }
    }

    if (!open.selfClosing && !VOID_ELEMENTS.has(lowerTag)) {
      tagStack.push(open.tagName);
    }

    i = open.openEnd;
  }
}

/**
 * Transform an HTML/template string AST idempotently according to a `MigrationManifest`.
 */
export function transformHtml(
  source: string,
  manifest: MigrationManifest | CompiledManifest,
  hooks?: HtmlTransformHooks,
): TransformResult {
  const compiled = 'rewriteTag' in manifest ? manifest : compileManifest(manifest);
  const edits: TextEdit[] = [];
  const stats = createMutableStats();
  collectHtmlEdits(source, compiled, edits, stats, 0, hooks);
  const { text, applied } = applyTextEdits(source, edits);
  return {
    code: text,
    changed: applied > 0,
    editsCount: applied,
    stats,
  };
}
