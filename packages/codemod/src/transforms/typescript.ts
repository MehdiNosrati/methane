import ts from 'typescript';
import { applyTextEdits, createMutableStats, type MutableStats } from '../edits.js';
import { compileManifest, type CompiledManifest } from '../manifest.js';
import type { MigrationManifest, TextEdit, TransformResult } from '../types.js';
import { collectCssEdits } from './css.js';
import { collectHtmlEdits } from './html.js';

interface StitchedQuasi {
  readonly stitchedStart: number;
  readonly stitchedEnd: number;
  readonly sourceStart: number;
}

function getTemplateQuasiSpans(
  source: string,
  node: ts.TemplateLiteral,
  sourceFile: ts.SourceFile,
): { stitched: string; quasis: StitchedQuasi[] } | null {
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    const start = node.getStart(sourceFile) + 1;
    const end = node.getEnd() - 1;
    if (end < start) return null;
    const raw = source.slice(start, end);
    return {
      stitched: raw,
      quasis: [{ stitchedStart: 0, stitchedEnd: raw.length, sourceStart: start }],
    };
  }

  const headStart = node.head.getStart(sourceFile) + 1;
  // head.getEnd() points right after '${'
  const headEnd = node.head.getEnd() - 2;
  if (headEnd < headStart) return null;

  const quasis: StitchedQuasi[] = [];
  let stitched = '';
  const headRaw = source.slice(headStart, headEnd);
  quasis.push({
    stitchedStart: 0,
    stitchedEnd: headRaw.length,
    sourceStart: headStart,
  });
  stitched += headRaw;

  for (let idx = 0; idx < node.templateSpans.length; idx++) {
    const span = node.templateSpans[idx]!;
    const sentinel = `__MTH_EXPR_${idx}__`;
    stitched += sentinel;

    const lit = span.literal;
    const litStart = lit.getStart(sourceFile) + 1; // right after '}'
    const litEnd = ts.isTemplateTail(lit) ? lit.getEnd() - 1 : lit.getEnd() - 2;
    const litRaw = litEnd >= litStart ? source.slice(litStart, litEnd) : '';
    const sStart = stitched.length;
    quasis.push({
      stitchedStart: sStart,
      stitchedEnd: sStart + litRaw.length,
      sourceStart: litStart,
    });
    stitched += litRaw;
  }

  return { stitched, quasis };
}

function projectStitchedEdits(
  stitchedEdits: ReadonlyArray<TextEdit>,
  quasis: ReadonlyArray<StitchedQuasi>,
  targetEdits: TextEdit[],
): void {
  for (const edit of stitchedEdits) {
    for (const q of quasis) {
      if (edit.start >= q.stitchedStart && edit.end <= q.stitchedEnd) {
        targetEdits.push({
          start: q.sourceStart + (edit.start - q.stitchedStart),
          end: q.sourceStart + (edit.end - q.stitchedStart),
          replacement: edit.replacement,
        });
        break;
      }
    }
  }
}

function getTagNameFromTaggedTemplate(tag: ts.LeftHandSideExpression): string | null {
  if (ts.isIdentifier(tag)) return tag.text;
  if (ts.isPropertyAccessExpression(tag)) return tag.name.text;
  return null;
}

function getStringLiteralInfo(
  node: ts.Expression,
  sourceFile: ts.SourceFile,
): { value: string; innerStart: number; innerEnd: number } | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const start = node.getStart(sourceFile) + 1;
    const end = node.getEnd() - 1;
    if (end >= start) {
      return { value: node.text, innerStart: start, innerEnd: end };
    }
  }
  return null;
}

function getCalleeMethodName(expr: ts.LeftHandSideExpression): string | null {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return null;
}

function getCalleeReceiverName(expr: ts.LeftHandSideExpression): string | null {
  if (!ts.isPropertyAccessExpression(expr)) return null;
  if (ts.isIdentifier(expr.expression)) return expr.expression.text;
  return null;
}

function getJsxAttributeRemovalSpan(
  source: string,
  attr: ts.JsxAttribute,
  sourceFile: ts.SourceFile,
): { start: number; end: number } {
  const fullStart = attr.getFullStart();
  const end = attr.getEnd();
  const leading = source.slice(fullStart, attr.getStart(sourceFile));
  if (leading.includes('\n')) {
    const lastNl = leading.lastIndexOf('\n');
    return { start: fullStart + lastNl, end };
  }
  return { start: fullStart, end };
}

function transformStringValueVarTokens(
  text: string,
  baseInnerStart: number,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
): void {
  const re = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const token = m[1];
    if (!token) continue;
    const rewritten = compiled.rewriteToken(token);
    if (rewritten !== token) {
      const tokenOffset = m[0].indexOf(token);
      const start = baseInnerStart + m.index + tokenOffset;
      edits.push({
        start,
        end: start + token.length,
        replacement: rewritten,
      });
      stats.tokenRenames += 1;
    }
  }
}

function getJsxTagText(tagName: ts.JsxTagNameExpression, sourceFile: ts.SourceFile): string {
  return tagName.getText(sourceFile);
}

export function collectTypeScriptEdits(
  source: string,
  compiled: CompiledManifest,
  edits: TextEdit[],
  stats: MutableStats,
  baseOffset = 0,
  fileName = 'file.tsx',
): void {
  const scriptKind =
    fileName.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : fileName.endsWith('.jsx')
        ? ts.ScriptKind.JSX
        : fileName.endsWith('.js') || fileName.endsWith('.mjs')
          ? ts.ScriptKind.JS
          : ts.ScriptKind.TSX;

  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  const jsxStack: string[] = [];
  const varTags = new Map<string, string>();

  function inferTagFromInit(expr: ts.Expression): string | null {
    if (!ts.isCallExpression(expr)) return null;
    const method = getCalleeMethodName(expr.expression);
    const arg0 = expr.arguments[0] ? getStringLiteralInfo(expr.arguments[0], sf) : null;
    if (!arg0) return null;
    if (method === 'createElement' && arg0.value.includes('-')) {
      return arg0.value;
    }
    if (method === 'querySelector' || method === 'closest') {
      const m = /^([a-zA-Z][a-zA-Z0-9-]*-[a-zA-Z0-9-]*)(?:$|[\s.:[#])/.exec(arg0.value.trim());
      return m?.[1] ?? null;
    }
    return null;
  }

  function pushEdit(start: number, end: number, replacement: string): void {
    edits.push({
      start: baseOffset + start,
      end: baseOffset + end,
      replacement,
    });
  }

  function processJsxAttributes(
    tagName: string,
    parentTag: string | null,
    attributes: ts.JsxAttributes,
  ): void {
    const existingAttrs = new Set<string>();
    for (const prop of attributes.properties) {
      if (ts.isJsxAttribute(prop)) {
        existingAttrs.add(prop.name.getText(sf).toLowerCase());
      }
    }

    for (const prop of attributes.properties) {
      if (!ts.isJsxAttribute(prop)) continue;
      const attrName = prop.name.getText(sf);

      // style={{ '--mth-...': 'var(--mth-...)' }}
      if (
        attrName === 'style' &&
        prop.initializer &&
        ts.isJsxExpression(prop.initializer) &&
        prop.initializer.expression &&
        ts.isObjectLiteralExpression(prop.initializer.expression)
      ) {
        for (const styleProp of prop.initializer.expression.properties) {
          if (!ts.isPropertyAssignment(styleProp)) continue;
          if (ts.isStringLiteral(styleProp.name)) {
            const tokenName = styleProp.name.text;
            if (tokenName.startsWith('--')) {
              const rewritten = compiled.rewriteToken(tokenName);
              if (rewritten !== tokenName) {
                pushEdit(
                  styleProp.name.getStart(sf) + 1,
                  styleProp.name.getEnd() - 1,
                  rewritten,
                );
                stats.tokenRenames += 1;
              }
            }
          }
          const valLit = getStringLiteralInfo(styleProp.initializer, sf);
          if (valLit) {
            const tempEdits: TextEdit[] = [];
            transformStringValueVarTokens(valLit.value, valLit.innerStart, compiled, tempEdits, stats);
            for (const te of tempEdits) {
              edits.push({
                start: baseOffset + te.start,
                end: baseOffset + te.end,
                replacement: te.replacement,
              });
            }
          }
        }
        continue;
      }

      // slot="old-slot"
      if (attrName === 'slot' && prop.initializer) {
        const strLit = ts.isStringLiteral(prop.initializer)
          ? getStringLiteralInfo(prop.initializer, sf)
          : ts.isJsxExpression(prop.initializer) && prop.initializer.expression
            ? getStringLiteralInfo(prop.initializer.expression, sf)
            : null;
        if (strLit) {
          const slotRule =
            compiled.matchSlot(parentTag, strLit.value) ??
            compiled.matchSlot(tagName, strLit.value);
          if (slotRule && slotRule.to !== strLit.value) {
            pushEdit(strLit.innerStart, strLit.innerEnd, slotRule.to);
            stats.slotMigrations += 1;
          }
        }
        continue;
      }

      // React event prop onMthOld -> onMthNew
      const reactEventMatch = compiled.matchReactEventProp(tagName, attrName);
      if (reactEventMatch && reactEventMatch.toProp !== attrName) {
        pushEdit(prop.name.getStart(sf), prop.name.getEnd(), reactEventMatch.toProp);
        stats.eventMigrations += 1;
        continue;
      }

      // Deprecated attribute migration
      const attrRule = compiled.matchAttribute(tagName, attrName);
      if (attrRule) {
        if (attrRule.remove) {
          const span = getJsxAttributeRemovalSpan(source, prop, sf);
          pushEdit(span.start, span.end, '');
          stats.attributeMigrations += 1;
          continue;
        }

        let attrChanged = false;
        if (attrRule.to && attrRule.to !== attrName) {
          if (existingAttrs.has(attrRule.to.toLowerCase())) {
            const span = getJsxAttributeRemovalSpan(source, prop, sf);
            pushEdit(span.start, span.end, '');
            stats.attributeMigrations += 1;
            continue;
          }
          pushEdit(prop.name.getStart(sf), prop.name.getEnd(), attrRule.to);
          attrChanged = true;
        }

        if (attrRule.valueMap && prop.initializer) {
          const strLit = ts.isStringLiteral(prop.initializer)
            ? getStringLiteralInfo(prop.initializer, sf)
            : ts.isJsxExpression(prop.initializer) && prop.initializer.expression
              ? getStringLiteralInfo(prop.initializer.expression, sf)
              : null;
          if (strLit) {
            const mapped = attrRule.valueMap[strLit.value];
            if (mapped !== undefined && mapped !== strLit.value) {
              pushEdit(strLit.innerStart, strLit.innerEnd, mapped);
              attrChanged = true;
            }
          }
        }

        if (attrChanged) {
          stats.attributeMigrations += 1;
        }
      }
    }
  }

  function visit(node: ts.Node): void {
    // 1. Tagged templates: html`...`, svg`...`, css`...`
    if (ts.isTaggedTemplateExpression(node)) {
      const tagIdent = getTagNameFromTaggedTemplate(node.tag);
      if (tagIdent === 'html' || tagIdent === 'svg') {
        const spans = getTemplateQuasiSpans(source, node.template, sf);
        if (spans) {
          const localEdits: TextEdit[] = [];
          collectHtmlEdits(spans.stitched, compiled, localEdits, stats, 0);
          const projected: TextEdit[] = [];
          projectStitchedEdits(localEdits, spans.quasis, projected);
          for (const pe of projected) {
            edits.push({
              start: baseOffset + pe.start,
              end: baseOffset + pe.end,
              replacement: pe.replacement,
            });
          }
        }
      } else if (tagIdent === 'css') {
        const spans = getTemplateQuasiSpans(source, node.template, sf);
        if (spans) {
          const localEdits: TextEdit[] = [];
          collectCssEdits(spans.stitched, compiled, localEdits, stats, 0);
          const projected: TextEdit[] = [];
          projectStitchedEdits(localEdits, spans.quasis, projected);
          for (const pe of projected) {
            edits.push({
              start: baseOffset + pe.start,
              end: baseOffset + pe.end,
              replacement: pe.replacement,
            });
          }
        }
      }
      // Visit expressions inside template spans too (e.g. nested html``)
      ts.forEachChild(node, visit);
      return;
    }

    // 2. JSX Element (with open/close pair and parent tracking)
    if (ts.isJsxElement(node)) {
      const open = node.openingElement;
      const close = node.closingElement;
      const tagName = getJsxTagText(open.tagName, sf);
      const parentTag = jsxStack.length > 0 ? (jsxStack[jsxStack.length - 1] ?? null) : null;

      if (tagName.includes('-')) {
        const rewritten = compiled.rewriteTag(tagName);
        if (rewritten !== tagName) {
          pushEdit(open.tagName.getStart(sf), open.tagName.getEnd(), rewritten);
          pushEdit(close.tagName.getStart(sf), close.tagName.getEnd(), rewritten);
          stats.tagRewrites += 1;
        }
      }

      processJsxAttributes(tagName, parentTag, open.attributes);
      jsxStack.push(tagName);
      for (const child of node.children) {
        visit(child);
      }
      jsxStack.pop();
      return;
    }

    // 3. JSX Self-Closing Element
    if (ts.isJsxSelfClosingElement(node)) {
      const tagName = getJsxTagText(node.tagName, sf);
      const parentTag = jsxStack.length > 0 ? (jsxStack[jsxStack.length - 1] ?? null) : null;

      if (tagName.includes('-')) {
        const rewritten = compiled.rewriteTag(tagName);
        if (rewritten !== tagName) {
          pushEdit(node.tagName.getStart(sf), node.tagName.getEnd(), rewritten);
          stats.tagRewrites += 1;
        }
      }

      processJsxAttributes(tagName, parentTag, node.attributes);
      ts.forEachChild(node, visit);
      return;
    }

    // 4. Decorators: @customElement('mth-button')
    if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
      const call = node.expression;
      if (getCalleeMethodName(call.expression) === 'customElement' && call.arguments[0]) {
        const arg0 = getStringLiteralInfo(call.arguments[0], sf);
        if (arg0 && arg0.value.includes('-')) {
          const rewritten = compiled.rewriteTag(arg0.value);
          if (rewritten !== arg0.value) {
            pushEdit(arg0.innerStart, arg0.innerEnd, rewritten);
            stats.tagRewrites += 1;
          }
        }
      }
    }

    // 4b. Track local variable tag bindings: const btn = document.createElement('mth-button')
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const inferred = inferTagFromInit(node.initializer);
      if (inferred) {
        varTags.set(node.name.text, inferred);
      }
    }

    // 5. DOM & Custom Element API CallExpressions
    if (ts.isCallExpression(node)) {
      const method = getCalleeMethodName(node.expression);
      const receiver = getCalleeReceiverName(node.expression);
      const receiverTag = receiver ? (varTags.get(receiver) ?? null) : null;
      const arg0 = node.arguments[0] ? getStringLiteralInfo(node.arguments[0], sf) : null;
      const arg1 = node.arguments[1] ? getStringLiteralInfo(node.arguments[1], sf) : null;

      if (
        arg0 &&
        (method === 'createElement' ||
          (receiver === 'customElements' &&
            (method === 'define' || method === 'get' || method === 'whenDefined')))
      ) {
        if (arg0.value.includes('-')) {
          const rewritten = compiled.rewriteTag(arg0.value);
          if (rewritten !== arg0.value) {
            pushEdit(arg0.innerStart, arg0.innerEnd, rewritten);
            stats.tagRewrites += 1;
          }
        }
      } else if (
        arg0 &&
        (method === 'querySelector' ||
          method === 'querySelectorAll' ||
          method === 'closest' ||
          method === 'matches')
      ) {
        // Parse selector via CSS AST by wrapping `selector {}`
        const wrapped = `${arg0.value} {}`;
        const localEdits: TextEdit[] = [];
        collectCssEdits(wrapped, compiled, localEdits, stats, 0);
        for (const le of localEdits) {
          if (le.end <= arg0.value.length) {
            pushEdit(arg0.innerStart + le.start, arg0.innerStart + le.end, le.replacement);
          }
        }
      } else if (
        arg0 &&
        (method === 'addEventListener' || method === 'removeEventListener')
      ) {
        const eventRule = compiled.matchEvent(receiverTag, arg0.value);
        if (eventRule && eventRule.to !== arg0.value) {
          pushEdit(arg0.innerStart, arg0.innerEnd, eventRule.to);
          stats.eventMigrations += 1;
        }
      } else if (
        arg0 &&
        (method === 'setAttribute' ||
          method === 'getAttribute' ||
          method === 'hasAttribute' ||
          method === 'removeAttribute' ||
          method === 'toggleAttribute')
      ) {
        if (method === 'setAttribute' && arg0.value.toLowerCase() === 'slot' && arg1) {
          const slotRule = compiled.matchSlot(receiverTag, arg1.value);
          if (slotRule && slotRule.to !== arg1.value) {
            pushEdit(arg1.innerStart, arg1.innerEnd, slotRule.to);
            stats.slotMigrations += 1;
          }
        } else {
          const attrRule = compiled.matchAttribute(receiverTag, arg0.value);
          if (attrRule && !attrRule.remove) {
            let changed = false;
            if (attrRule.to && attrRule.to !== arg0.value) {
              pushEdit(arg0.innerStart, arg0.innerEnd, attrRule.to);
              changed = true;
            }
            if (method === 'setAttribute' && attrRule.valueMap && arg1) {
              const mapped = attrRule.valueMap[arg1.value];
              if (mapped !== undefined && mapped !== arg1.value) {
                pushEdit(arg1.innerStart, arg1.innerEnd, mapped);
                changed = true;
              }
            }
            if (changed) stats.attributeMigrations += 1;
          }
        }
      } else if (
        arg0 &&
        (method === 'setProperty' || method === 'getPropertyValue' || method === 'removeProperty')
      ) {
        if (arg0.value.startsWith('--')) {
          const rewritten = compiled.rewriteToken(arg0.value);
          if (rewritten !== arg0.value) {
            pushEdit(arg0.innerStart, arg0.innerEnd, rewritten);
            stats.tokenRenames += 1;
          }
        }
        if (method === 'setProperty' && arg1) {
          const tempEdits: TextEdit[] = [];
          transformStringValueVarTokens(arg1.value, arg1.innerStart, compiled, tempEdits, stats);
          for (const te of tempEdits) {
            edits.push({
              start: baseOffset + te.start,
              end: baseOffset + te.end,
              replacement: te.replacement,
            });
          }
        }
      }
    }

    // 6. new CustomEvent('old-event', ...)
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'CustomEvent' && node.arguments?.[0]) {
        const arg0 = getStringLiteralInfo(node.arguments[0], sf);
        if (arg0) {
          const eventRule = compiled.matchEvent(null, arg0.value);
          if (eventRule && eventRule.to !== arg0.value) {
            pushEdit(arg0.innerStart, arg0.innerEnd, eventRule.to);
            stats.eventMigrations += 1;
          }
        }
      }
    }

    // 7. TypeScript interface HTMLElementTagNameMap / HTMLElementEventMap
    if (ts.isInterfaceDeclaration(node)) {
      const ifaceName = node.name.text;
      if (ifaceName === 'HTMLElementTagNameMap') {
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && ts.isStringLiteral(member.name)) {
            const tag = member.name.text;
            if (tag.includes('-')) {
              const rewritten = compiled.rewriteTag(tag);
              if (rewritten !== tag) {
                pushEdit(
                  member.name.getStart(sf) + 1,
                  member.name.getEnd() - 1,
                  rewritten,
                );
                stats.tagRewrites += 1;
              }
            }
          }
        }
      } else if (ifaceName === 'HTMLElementEventMap') {
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && ts.isStringLiteral(member.name)) {
            const ev = member.name.text;
            const rule = compiled.matchEvent(null, ev);
            if (rule && rule.to !== ev) {
              pushEdit(
                member.name.getStart(sf) + 1,
                member.name.getEnd() - 1,
                rule.to,
              );
              stats.eventMigrations += 1;
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);
}

/**
 * Transform a TypeScript/TSX/JS/JSX source string AST idempotently according to a `MigrationManifest`.
 */
export function transformTypeScript(
  source: string,
  manifest: MigrationManifest | CompiledManifest,
  fileName = 'file.tsx',
): TransformResult {
  const compiled = 'rewriteTag' in manifest ? manifest : compileManifest(manifest);
  const edits: TextEdit[] = [];
  const stats = createMutableStats();
  collectTypeScriptEdits(source, compiled, edits, stats, 0, fileName);
  const { text, applied } = applyTextEdits(source, edits);
  return {
    code: text,
    changed: applied > 0,
    editsCount: applied,
    stats,
  };
}
