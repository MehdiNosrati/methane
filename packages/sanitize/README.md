# `@methane/sanitize`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Defense-in-depth HTML, Markdown, streaming chunk, and URL sanitization for **Methane UI** — built around native browser `Element.prototype.setHTML` (Sanitizer API) when available with a strict **DOMPurify** parity fallback, explicit URL protocol allowlisting, and **Trusted Types** compatibility.

## Installation

```bash
pnpm add @methane/sanitize
# or
npm install @methane/sanitize
```

## Exported API

| Symbol | Kind | Description |
| --- | --- | --- |
| `safeSetHTML(target, html, options?)` | Function | Safely populates `Element` / `ShadowRoot` using native `setHTML` or DOMPurify-sanitized fragment replacement |
| `parseSafeFragment(html, options?)` | Function | Parses untrusted HTML into an inert, sanitized `DocumentFragment` |
| `sanitizeToTrustedHTML(html, options?)` | Function | Sanitizes HTML and passes through an optional `TrustedTypePolicyLike` when Trusted Types are active |
| `renderMarkdownToSafeHTML(markdown, options?)` | Function | Renders constrained Markdown (headings, emphasis, lists, links, code blocks) into sanitized HTML |
| `safeSetMarkdown(target, markdown, options?)` | Function | Renders Markdown and injects it via `safeSetHTML` |
| `createStreamSanitizer(options?)` | Function | Creates an incremental `StreamSanitizer` for AI/streaming chunks (`push(chunk)`, `flushTo(target, options?)`, `toFragment(options?)`, `reset()`) |
| `isSafeUrl(rawUrl)` | Function | Validates URLs against `https:`, `http:`, `mailto:`, `tel:` (blocks `javascript:`, `vbscript:`, `data:`, and control-char obfuscation) |
| `sanitizeUrl(url, fallback?)` | Function | Returns `url` if `isSafeUrl(url)` passes, otherwise returns `fallback` (`'#'`) |
| `escapeHtml(text)` | Function | Escapes `&`, `<`, `>`, `"`, `'` for plain text interpolation |
| `isNativeSetHTMLSupported()` | Function | Feature-detects `Element.prototype.setHTML` |
| `isTrustedTypesActive(win?)` | Function | Detects active `window.trustedTypes` enforcement |
| `SanitizeOptions` / `MarkdownSanitizeOptions` / `StreamSanitizer` / `TrustedTypePolicyLike` | Types | Configuration and interface definitions |

## Usage Examples

### Safe DOM & ShadowRoot HTML Injection

```ts
import { safeSetHTML, sanitizeUrl } from '@methane/sanitize';

const container = document.getElementById('preview')!;
safeSetHTML(container, '<p>Hello <script>alert(1)</script><a href="javascript:evil()">link</a></p>');

const safeHref = sanitizeUrl(userProvidedUrl, '/fallback');
```

### Streaming Markdown for AI & Chat Surfaces

```ts
import { createStreamSanitizer, safeSetMarkdown } from '@methane/sanitize';

// Full Markdown render
safeSetMarkdown(articleEl, '## Summary\n\n- Verified **safe** output');

// Incremental AI token stream
const streamer = createStreamSanitizer({ allowRawHtml: false });
for await (const chunk of llmStream) {
  streamer.push(chunk);
  streamer.flushTo(messageBodyEl);
}
const finalFragment = streamer.toFragment();
streamer.reset();
```

### Strict Sanitization with Trusted Types

```ts
import { sanitizeToTrustedHTML, isTrustedTypesActive } from '@methane/sanitize';

const policy = isTrustedTypesActive()
  ? window.trustedTypes.createPolicy('methane-markdown', {
      createHTML: (dirty) => dirty,
    })
  : null;

const trusted = sanitizeToTrustedHTML(untrustedHtml, {
  forceFallback: true,
  trustedTypesPolicy: policy,
});
```

## Security Model & SSR Notes

- Blocks event-handler attributes (`on*`), `javascript:`, `vbscript:`, and untrusted `data:` URIs across `href`, `src`, `action`, `formaction`, `poster`, `cite`, `data`, `background`, `longdesc`, and `codebase`.
- Stripped control characters prevent whitespace/control-code protocol smuggling (e.g. `\u0000javascript:`).
- For non-browser DOM test environments (e.g., JSDOM or SSR pre-sanitization), pass `{ ownerDocument }` in `SanitizeOptions`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
