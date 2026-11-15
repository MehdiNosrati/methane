import { createArrayDataSource } from '@methane/primitives';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { chatThreadSpec, MthChatThread, registerMthChatThread } from './index.js';

describe('<mth-chat-thread>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, renders date/unread dividers, and sanitizes XSS', async () => {
    const compiled = compileSpec(chatThreadSpec);
    expect(compiled.tests).toContain('<mth-chat-thread>');
    const report = await runBehaviorSpecAssertions(chatThreadSpec, {});
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-chat-thread') as MthChatThread;
    el.unreadMessageId = 'm2';
    el.messages = [
      {
        id: 'm1',
        author: 'Ada',
        body: 'Hello <script>alert(1)</script> **world**',
        timestamp: '2026-11-15T10:00:00Z',
      },
      {
        id: 'm2',
        author: 'Grace',
        body: '[bad](javascript:alert(1)) and [ok](https://example.com)',
        timestamp: '2026-11-16T11:00:00Z',
        self: true,
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelectorAll('[part="date-separator"]').length).toBe(2);
    expect(el.shadowRoot!.querySelectorAll('[part="unread-divider"]').length).toBe(1);

    const bodies = el.shadowRoot!.querySelectorAll('[part="message-body"]');
    expect(bodies[0]!.querySelector('script')).toBeNull();
    expect(bodies[0]!.querySelector('strong')?.textContent).toBe('world');
    const links = Array.from(bodies[1]!.querySelectorAll('a'));
    expect(links.length).toBe(1);
    expect(links[0]!.getAttribute('href')).toBe('https://example.com');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('loads messages via DataSource<ChatMessage>', async () => {
    const el = document.createElement('mth-chat-thread') as MthChatThread;
    el.dataSource = createArrayDataSource([
      { id: 'd1', author: 'Bot', body: 'Stream ready' },
    ]);
    document.body.append(el);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    await el.updateComplete;

    expect(el.shadowRoot!.querySelectorAll('[part="message"]').length).toBe(1);
    let scrolled = 0;
    el.addEventListener('mth-scroll-bottom', () => {
      scrolled++;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="scroll-bottom"]')!.click();
    expect(scrolled).toBe(1);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthChatThread();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-chat-thread label="Thread"></mth-chat-thread>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-chat-thread>', 'hyd-chat-thread>')
      .replaceAll('<mth-chat-thread', '<hyd-chat-thread');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthChatThread('hyd');
        customElements.upgrade(host);
        await (host as MthChatThread).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });

  it('preserves asterisks in inline code and link URLs and retains adopted padSheet on reconnect', async () => {
    const el = document.createElement('mth-chat-thread') as MthChatThread;
    el.overscan = 2;
    el.messages = [
      {
        id: 'c1',
        author: 'Lin',
        body: 'Code `a * b * c` and [docs](https://example.com/a*b*c)',
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    const body = el.shadowRoot!.querySelector('[part="message-body"]')!;
    expect(body.querySelector('code')?.textContent).toBe('a * b * c');
    expect(body.querySelector('em')).toBeNull();
    const link = body.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('https://example.com/a*b*c');

    const sheetsBefore = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.append(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBeGreaterThanOrEqual(sheetsBefore);
  });

  it('preserves query-string links and sanitizes opt-in allowRawHtml without stripping safe tags', async () => {
    const el = document.createElement('mth-chat-thread') as MthChatThread;
    expect(el.allowRawHtml).toBe(false);
    el.messages = [
      {
        id: 'q1',
        author: 'Ada',
        body: '<b>literal</b> [search](https://example.com/search?q=a&page=2)',
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    let body = el.shadowRoot!.querySelector('[part="message-body"]')!;
    expect(body.querySelector('b')).toBeNull();
    expect(body.textContent).toContain('<b>literal</b>');
    expect(body.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com/search?q=a&page=2',
    );

    el.allowRawHtml = true;
    el.messages = [
      {
        id: 'q2',
        author: 'Grace',
        body: '<b>bold</b><script>evil()</script><img src="https://example.com/ok.png" onerror="alert(1)"> [q](https://example.com/?x=1&y=2)',
      },
    ];
    await el.updateComplete;

    body = el.shadowRoot!.querySelector('[part="message-body"]')!;
    expect(body.querySelector('b')?.textContent).toBe('bold');
    expect(body.querySelector('script')).toBeNull();
    expect(body.querySelector('img')?.hasAttribute('onerror')).toBe(false);
    expect(body.querySelector('a')?.getAttribute('href')).toBe('https://example.com/?x=1&y=2');
  });
});
