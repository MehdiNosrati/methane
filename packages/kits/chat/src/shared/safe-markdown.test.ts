import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderSafeMarkdown } from './safe-markdown.js';

describe('@methane-ui/chat renderSafeMarkdown', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('keeps allowRawHtml false by default, preserving query-string links and escaping raw HTML as text', () => {
    const host = document.createElement('div');
    const source =
      'See [docs](https://example.com/search?q=a&page=2) and <b>not html</b> <script>evil()</script> `a * b` [bad](javascript:alert(1))';
    render(html`${renderSafeMarkdown(source)}`, host);

    expect(host.querySelector('b')).toBeNull();
    expect(host.querySelector('script')).toBeNull();
    expect(host.textContent).toContain('<b>not html</b>');
    expect(host.textContent).toContain('<script>evil()</script>');
    expect(host.querySelector('code')?.textContent).toBe('a * b');

    const links = host.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe('https://example.com/search?q=a&page=2');
    expect(host.textContent).toContain('bad');
    expect(host.textContent).not.toContain('bad)');
  });

  it('sanitizes opt-in allowRawHtml via @methane-ui/sanitize parseSafeFragment without regex stripping', () => {
    const host = document.createElement('div');
    const payload =
      '<b>Safe</b> <img src="https://example.com/pic.png" onerror="alert(1)"><script>window.__xss=1</script><a href="javascript:alert(1)">bad</a> [q](https://example.com/?a=1&b=2)';

    render(html`${renderSafeMarkdown(payload, { allowRawHtml: true })}`, host);

    expect(host.querySelector('b')?.textContent).toBe('Safe');
    expect(host.querySelector('script')).toBeNull();
    const img = host.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/pic.png');
    expect(img?.hasAttribute('onerror')).toBe(false);

    const links = host.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0]?.hasAttribute('href')).toBe(false);
    expect(links[1]?.getAttribute('href')).toBe('https://example.com/?a=1&b=2');

    // Re-rendering updates cleanly in place
    render(html`${renderSafeMarkdown('<em>Updated</em>', { allowRawHtml: true })}`, host);
    expect(host.querySelector('b')).toBeNull();
    expect(host.querySelector('em')?.textContent).toBe('Updated');
  });
});
