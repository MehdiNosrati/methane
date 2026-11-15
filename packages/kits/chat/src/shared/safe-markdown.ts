import { isSafeUrl, parseSafeFragment, renderMarkdownToSafeHTML } from '@methane-ui/sanitize';
import { html, type TemplateResult } from 'lit';

export type SafeMarkdownPart = TemplateResult | DocumentFragment | string;

function renderInlineEmphasis(text: string): ReadonlyArray<TemplateResult | string> {
  const parts: Array<TemplateResult | string> = [];
  const emphasisRegex = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = emphasisRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(html`<strong>${match[1]}</strong>`);
    } else if (match[2] !== undefined) {
      parts.push(html`<em>${match[2]}</em>`);
    }
    lastIndex = emphasisRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function renderEscapedMarkdownTemplates(
  safeInput: string,
): ReadonlyArray<TemplateResult | string> {
  const parts: Array<TemplateResult | string> = [];

  // Tokenize inline code and links before running emphasis rules.
  const tokenRegex = /`([^`\n]+)`|\[([^\]]+)\]\(((?:[^()\s]+|\([^()\s]*\))+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(safeInput)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderInlineEmphasis(safeInput.slice(lastIndex, match.index)));
    }
    if (match[1] !== undefined) {
      parts.push(html`<code>${match[1]}</code>`);
    } else if (match[2] !== undefined && match[3] !== undefined) {
      const label = match[2];
      const href = match[3].trim();
      if (isSafeUrl(href)) {
        parts.push(html`<a href=${href} rel="noopener noreferrer">${renderInlineEmphasis(label)}</a>`);
      } else {
        parts.push(...renderInlineEmphasis(label));
      }
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < safeInput.length) {
    parts.push(...renderInlineEmphasis(safeInput.slice(lastIndex)));
  }

  return parts;
}

/**
 * Renders lightweight markdown/streaming content safely via `@methane-ui/sanitize`
 * (`isSafeUrl`, `renderMarkdownToSafeHTML`, `parseSafeFragment`).
 * `allowRawHtml` defaults to `false` (ADR-012): raw HTML is rendered as inert text via Lit
 * text bindings; when `allowRawHtml: true` is opted in, markup is sanitized through
 * DOMPurify (`renderMarkdownToSafeHTML` + `parseSafeFragment`) into a `DocumentFragment`.
 * Never uses `innerHTML`, `unsafeHTML`, or regex tag stripping.
 */
export function renderSafeMarkdown(
  source: string,
  options?: { allowRawHtml?: boolean; ownerDocument?: Document },
): ReadonlyArray<SafeMarkdownPart> {
  const safeInput = source ?? '';
  const allowRawHtml = options?.allowRawHtml ?? false;

  if (!allowRawHtml) {
    return renderEscapedMarkdownTemplates(safeInput);
  }

  const doc =
    options?.ownerDocument ?? (typeof document !== 'undefined' ? document : undefined);
  if (!doc || typeof doc.createDocumentFragment !== 'function') {
    return renderEscapedMarkdownTemplates(safeInput);
  }

  const sanitizedHtml = renderMarkdownToSafeHTML(safeInput, {
    allowRawHtml: true,
    ownerDocument: doc,
  });
  return [parseSafeFragment(sanitizedHtml, { ownerDocument: doc })];
}
