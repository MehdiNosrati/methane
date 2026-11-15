import { escapeHtml, isSafeUrl, safeSetHTML, sanitizeToTrustedHTML } from '@methane-ui/sanitize';

function applyInlineEmphasis(text: string): string {
  const withStrong = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  return withStrong.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
}

function renderInlineMarkdown(text: string, allowRawHtml: boolean): string {
  const codeTokens: Array<string> = [];
  const linkTokens: Array<string> = [];

  // Stash inline code spans first and HTML-escape their contents unconditionally.
  const withoutCode = text.replace(/`([^`\n]+)`/g, (_m, code: string) => {
    const idx = codeTokens.length;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return `\uE000MTHCODE${idx}\uE001`;
  });

  // Stash Markdown links next so URLs (including `&` and `*`) are validated unescaped and escaped once.
  const withoutLinks = withoutCode.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, label: string, rawUrl: string) => {
      const trimmedUrl = rawUrl.trim();
      if (!isSafeUrl(trimmedUrl)) {
        return label;
      }
      const escapedLabel = allowRawHtml ? label : escapeHtml(label);
      const formattedLabel = applyInlineEmphasis(escapedLabel);
      const idx = linkTokens.length;
      linkTokens.push(
        `<a href="${escapeHtml(trimmedUrl)}" rel="noopener noreferrer">${formattedLabel}</a>`,
      );
      return `\uE000MTHLINK${idx}\uE001`;
    },
  );

  const escapedOrRaw = allowRawHtml ? withoutLinks : escapeHtml(withoutLinks);
  const formatted = applyInlineEmphasis(escapedOrRaw);

  const restoredLinks = formatted.replace(
    /\uE000MTHLINK(\d+)\uE001/g,
    (_m, rawIdx: string) => linkTokens[Number(rawIdx)] ?? '',
  );
  return restoredLinks.replace(
    /\uE000MTHCODE(\d+)\uE001/g,
    (_m, rawIdx: string) => codeTokens[Number(rawIdx)] ?? '',
  );
}

/**
 * Converts Markdown blocks and inline syntax into sanitized HTML via `@methane-ui/sanitize`.
 * Raw HTML defaults to OFF (`allowRawHtml: false`).
 */
export function compileMarkdownToSafeHtml(
  markdown: string,
  options?: { allowRawHtml?: boolean },
): string {
  const allowRawHtml = options?.allowRawHtml ?? false;
  if (!markdown.trim()) return '';

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const htmlBlocks: Array<string> = [];
  let inCodeBlock = false;
  let codeLines: Array<string> = [];
  let listItems: Array<string> = [];

  const flushList = (): void => {
    if (listItems.length > 0) {
      htmlBlocks.push(`<ul>${listItems.join('')}</ul>`);
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        htmlBlocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      flushList();
      const level = headingMatch[1]!.length;
      const body = renderInlineMarkdown(headingMatch[2]!, allowRawHtml);
      htmlBlocks.push(`<h${level}>${body}</h${level}>`);
      continue;
    }

    const listMatch = /^[-*]\s+(.+)$/.exec(line.trim());
    if (listMatch) {
      listItems.push(`<li>${renderInlineMarkdown(listMatch[1]!, allowRawHtml)}</li>`);
      continue;
    }

    if (line.trim() === '') {
      flushList();
      continue;
    }

    flushList();
    const quoteMatch = /^>\s+(.+)$/.exec(line.trim());
    if (quoteMatch) {
      htmlBlocks.push(`<blockquote><p>${renderInlineMarkdown(quoteMatch[1]!, allowRawHtml)}</p></blockquote>`);
    } else {
      htmlBlocks.push(`<p>${renderInlineMarkdown(line, allowRawHtml)}</p>`);
    }
  }

  flushList();
  if (inCodeBlock && codeLines.length > 0) {
    htmlBlocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  return String(sanitizeToTrustedHTML(htmlBlocks.join('\n')));
}

/**
 * Populates a target Element safely with rendered Markdown HTML via `safeSetHTML`.
 */
export function renderMarkdownIntoElement(
  target: Element,
  markdown: string,
  options?: { allowRawHtml?: boolean },
): string {
  const compiled = compileMarkdownToSafeHtml(markdown, options);
  safeSetHTML(target, compiled);
  return compiled;
}
