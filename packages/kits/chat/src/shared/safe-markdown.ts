import { isSafeUrl, renderMarkdownToSafeHTML } from '@methane/sanitize';
import { html, type TemplateResult } from 'lit';

function renderInlineEmphasis(text: string): ReadonlyArray<TemplateResult | string> {
  const parts: Array<TemplateResult | string> = [];
  const emphasisRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
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

function renderPlainChunk(
  chunk: string,
  allowRawHtml: boolean,
): ReadonlyArray<TemplateResult | string> {
  if (!allowRawHtml) {
    return renderInlineEmphasis(chunk);
  }
  // When raw HTML is explicitly opted in, filter plain text segments through
  // @methane/sanitize without exposing code/link tokens to emphasis corruption.
  const sanitized = renderMarkdownToSafeHTML(chunk, { allowRawHtml: true });
  return renderInlineEmphasis(sanitized.replace(/<[^>]*>/g, ''));
}

/**
 * Renders lightweight markdown/streaming content into deterministic, SSR-safe Lit
 * templates via `@methane/sanitize` (`isSafeUrl`, `renderMarkdownToSafeHTML`),
 * tokenizing inline code spans and links before emphasis so `*` inside `` `code` ``
 * or URLs is never corrupted. Never uses `innerHTML` or `unsafeHTML`.
 */
export function renderSafeMarkdown(
  source: string,
  options?: { allowRawHtml?: boolean },
): ReadonlyArray<TemplateResult | string> {
  const safeInput = source ?? '';
  const allowRawHtml = options?.allowRawHtml ?? false;
  const parts: Array<TemplateResult | string> = [];

  // Tokenize inline code and links before running emphasis rules.
  const tokenRegex = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(safeInput)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderPlainChunk(safeInput.slice(lastIndex, match.index), allowRawHtml));
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
    parts.push(...renderPlainChunk(safeInput.slice(lastIndex), allowRawHtml));
  }

  return parts;
}
