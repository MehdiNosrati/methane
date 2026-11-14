import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createStreamSanitizer,
  escapeHtml,
  isNativeSetHTMLSupported,
  isSafeUrl,
  isTrustedTypesActive,
  parseSafeFragment,
  renderMarkdownToSafeHTML,
  safeSetHTML,
  safeSetMarkdown,
  sanitizeToTrustedHTML,
  sanitizeUrl,
} from './index.js';

describe('@methane/sanitize URL allowlist (ADR-012)', () => {
  it('allows https, http, mailto, tel, and relative / or # paths', () => {
    expect(isSafeUrl('https://methane.dev/docs')).toBe(true);
    expect(isSafeUrl('http://localhost:3000/test?a=1#b')).toBe(true);
    expect(isSafeUrl('mailto:security@methane.dev')).toBe(true);
    expect(isSafeUrl('tel:+15551234567')).toBe(true);
    expect(isSafeUrl('/')).toBe(true);
    expect(isSafeUrl('/components/button')).toBe(true);
    expect(isSafeUrl('./local')).toBe(true);
    expect(isSafeUrl('../parent')).toBe(true);
    expect(isSafeUrl('#section-1')).toBe(true);
    expect(sanitizeUrl('https://methane.dev')).toBe('https://methane.dev');
  });

  it('rejects javascript:, data:, vbscript:, protocol-relative //, and control characters', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('  JaVaScRiPt:alert(1)  ')).toBe(false);
    expect(isSafeUrl('java\tscript:alert(1)')).toBe(false);
    expect(isSafeUrl('\u0000javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('ftp://example.com/file')).toBe(false);
    expect(isSafeUrl('//evil.example/phish')).toBe(false);
    expect(isSafeUrl('/\\evil.example')).toBe(false);
    expect(isSafeUrl('')).toBe(false);
    expect(isSafeUrl('   ')).toBe(false);
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
  });
});

describe('@methane/sanitize DOMPurify parity & XSS/mXSS defense', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (Element.prototype as { setHTML?: unknown }).setHTML;
    delete (Document as { parseHTML?: unknown }).parseHTML;
  });

  it('strips scripts, event handlers, iframes, and unsafe URLs while preserving safe markup', () => {
    const host = document.createElement('div');
    safeSetHTML(
      host,
      [
        '<p>Hello <strong>world</strong></p>',
        '<script>window.__xss = true;</script>',
        '<img src="https://example.com/ok.png" onerror="alert(1)">',
        '<a href="javascript:alert(1)">bad</a>',
        '<a href="/docs" title="docs">good</a>',
        '<iframe src="https://evil.example"></iframe>',
      ].join(''),
    );

    expect(host.querySelector('script')).toBeNull();
    expect(host.querySelector('iframe')).toBeNull();
    expect(host.querySelector('strong')?.textContent).toBe('world');
    const img = host.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/ok.png');
    expect(img?.hasAttribute('onerror')).toBe(false);

    const links = host.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0]?.hasAttribute('href')).toBe(false);
    expect(links[1]?.getAttribute('href')).toBe('/docs');
  });

  it('enforces native Sanitizer parity flags: strips aria-*, data-*, and forbidden tag text content (KEEP_CONTENT: false)', () => {
    const host = document.createElement('div');
    safeSetHTML(
      host,
      '<div aria-label="secret" data-user="123">visible</div><script>alert("leaked")</script><style>.x{color:red}</style>',
    );

    const innerDiv = host.querySelector('div');
    expect(innerDiv?.textContent).toBe('visible');
    expect(innerDiv?.hasAttribute('aria-label')).toBe(false);
    expect(innerDiv?.hasAttribute('data-user')).toBe(false);
    expect(host.textContent).not.toContain('alert("leaked")');
    expect(host.textContent).not.toContain('.x{color:red}');
  });

  it('neutralizes SVG/MathML/noscript/table mXSS mutation payloads', () => {
    const payloads = [
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
      '<form><math><mtext></form><form><mglyph><style></math><img src=x onerror=alert(1)>',
      '<svg><style><img src=x onerror=alert(1)></style></svg>',
      '<svg onload="alert(1)"><script>alert(1)</script></svg>',
      '<table><form><input><img src="x" onerror="alert(1)"></table>',
      '<img srcset="javascript:alert(1) 1x, https://example.com/a.png 2x">',
      '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">click</a>',
    ];

    for (const payload of payloads) {
      const host = document.createElement('div');
      safeSetHTML(host, payload);
      expect(host.querySelector('script')).toBeNull();
      expect(host.querySelector('svg')).toBeNull();
      expect(host.querySelector('math')).toBeNull();
      for (const el of host.querySelectorAll('*')) {
        for (const attr of Array.from(el.attributes)) {
          expect(attr.name.toLowerCase().startsWith('on')).toBe(false);
          if (['href', 'src', 'action', 'formaction'].includes(attr.name.toLowerCase())) {
            expect(isSafeUrl(attr.value)).toBe(true);
          }
          if (attr.name.toLowerCase() === 'srcset') {
            expect(attr.value).not.toContain('javascript:');
          }
        }
      }
    }
  });

  it('never round-trips parsed DOM nodes through target.innerHTML', () => {
    const host = document.createElement('div');
    const innerHtmlSetterSpy = vi.fn();
    Object.defineProperty(host, 'innerHTML', {
      configurable: true,
      set: innerHtmlSetterSpy,
      get: () => '',
    });

    safeSetHTML(host, '<p>Safe <em>node</em> transfer</p>');
    expect(innerHtmlSetterSpy).not.toHaveBeenCalled();
    expect(host.querySelector('em')?.textContent).toBe('node');
  });

  it('supports ShadowRoot targets without touching innerHTML', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    safeSetHTML(shadow, '<span data-x="1">shadow-ok</span><script>bad()</script>');
    expect(shadow.querySelector('script')).toBeNull();
    const span = shadow.querySelector('span');
    expect(span?.textContent).toBe('shadow-ok');
    expect(span?.hasAttribute('data-x')).toBe(false);
  });

  it('feature-detects native Element.prototype.setHTML and respects forceFallback', () => {
    expect(isNativeSetHTMLSupported()).toBe(false);

    const setHTMLMock = vi.fn(function (this: Element, input: string) {
      const doc = this.ownerDocument;
      const p = doc.createElement('p');
      p.textContent = `native:${input}`;
      this.replaceChildren(p);
    });
    Object.defineProperty(Element.prototype, 'setHTML', {
      configurable: true,
      writable: true,
      value: setHTMLMock,
    });

    expect(isNativeSetHTMLSupported()).toBe(true);

    const host = document.createElement('div');
    safeSetHTML(host, 'hello');
    expect(setHTMLMock).toHaveBeenCalledTimes(1);
    expect(host.textContent).toBe('native:hello');

    safeSetHTML(host, '<b>fallback</b>', { forceFallback: true });
    expect(setHTMLMock).toHaveBeenCalledTimes(1);
    expect(host.querySelector('b')?.textContent).toBe('fallback');
  });

  it('returns TrustedHTML when Trusted Types are active', () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    const createdPolicies: string[] = [];

    class FakeTrustedHTML {
      readonly value: string;
      constructor(value: string) {
        this.value = value;
      }
      toString(): string {
        return this.value;
      }
    }

    (dom.window as unknown as { trustedTypes: unknown }).trustedTypes = {
      createPolicy(name: string, rules: { createHTML?: (input: string) => string }) {
        createdPolicies.push(name);
        return {
          createHTML(input: string) {
            return new FakeTrustedHTML(rules.createHTML ? rules.createHTML(input) : input);
          },
        };
      },
    };

    expect(isTrustedTypesActive(dom.window as unknown as { trustedTypes?: unknown })).toBe(true);

    const trusted = sanitizeToTrustedHTML('<p onclick="alert(1)">Trusted</p>', {
      ownerDocument: dom.window.document,
    });
    expect(createdPolicies).toContain('dompurify');
    expect(trusted).toBeInstanceOf(FakeTrustedHTML);
    expect(String(trusted)).toBe('<p>Trusted</p>');

    const frag = parseSafeFragment('<p data-x="1">Frag</p>', {
      ownerDocument: dom.window.document,
    });
    expect(frag.querySelector('p')?.textContent).toBe('Frag');
    expect(frag.querySelector('p')?.hasAttribute('data-x')).toBe(false);
  });

  it('defaults raw HTML to OFF in markdown and streaming helpers', () => {
    const rawHtmlPayload = 'Hello <img src=x onerror=alert(1)> **bold** [link](javascript:alert(1))';
    const rendered = renderMarkdownToSafeHTML(rawHtmlPayload);
    expect(rendered).toContain(escapeHtml('<img src=x onerror=alert(1)>'));
    expect(rendered).toContain('<strong>bold</strong>');
    expect(rendered).not.toContain('javascript:');

    const host = document.createElement('div');
    safeSetMarkdown(host, '<b>not html</b> and *italic* and [ok](https://methane.dev)');
    expect(host.querySelector('b')).toBeNull();
    expect(host.textContent).toContain('<b>not html</b>');
    expect(host.querySelector('em')?.textContent).toBe('italic');
    expect(host.querySelector('a')?.getAttribute('href')).toBe('https://methane.dev');

    const stream = createStreamSanitizer();
    expect(stream.allowRawHtml).toBe(false);
    stream.push('Chunk 1 <script>evil()</script> ');
    stream.push('**safe**');
    const streamTarget = document.createElement('div');
    stream.flushTo(streamTarget);
    expect(streamTarget.querySelector('script')).toBeNull();
    expect(streamTarget.textContent).toContain('<script>evil()</script>');
    expect(streamTarget.querySelector('strong')?.textContent).toBe('safe');

    // Explicit opt-in still sanitizes unsafe markup via DOMPurify/setHTML
    const optInTarget = document.createElement('div');
    safeSetMarkdown(optInTarget, '<b>allowed</b><script>evil()</script>', { allowRawHtml: true });
    expect(optInTarget.querySelector('b')?.textContent).toBe('allowed');
    expect(optInTarget.querySelector('script')).toBeNull();
  });
});
