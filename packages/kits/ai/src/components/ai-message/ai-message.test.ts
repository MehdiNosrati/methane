import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthAiMessage, aiMessageSpec, registerMthAiMessage } from './index.js';

describe('<mth-ai-message>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and neutralizes untrusted HTML and javascript: links by default', async () => {
    const compiled = compileSpec(aiMessageSpec);
    expect(compiled.docs).toContain('`<mth-ai-message>`');

    const report = await runBehaviorSpecAssertions(aiMessageSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const msg = document.createElement('mth-ai-message') as MthAiMessage;
    msg.content =
      'Hello **Methane** <script>alert(1)</script> [safe](https://example.com) [bad](javascript:alert(1))';
    document.body.appendChild(msg);
    await msg.updateComplete;

    const content = msg.shadowRoot!.querySelector('[part="content"]')!;
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('strong')?.textContent).toBe('Methane');
    const links = Array.from(content.querySelectorAll('a'));
    expect(links.length).toBe(1);
    expect(links[0]?.getAttribute('href')).toBe('https://example.com');
    expect(content.textContent).toContain('<script>alert(1)</script>');
    expect(content.textContent).toContain('bad');
    expect(scanSameRootAria(msg).valid).toBe(true);
  });

  it('sanitizes opt-in allowRawHtml via @methane-ui/sanitize and supports streaming pushChunk & actions', async () => {
    const msg = document.createElement('mth-ai-message') as MthAiMessage;
    msg.allowRawHtml = true;
    msg.streaming = true;
    document.body.appendChild(msg);
    await msg.updateComplete;

    msg.pushChunk('Answer: <img src="https://example.com/a.png" onerror="alert(1)"><script>evil()</script>');
    await msg.updateComplete;

    const content = msg.shadowRoot!.querySelector('[part="content"]')!;
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(msg.hasCustomState('streaming')).toBe(true);

    let regenerated = false;
    msg.addEventListener('mth-regenerate', () => {
      regenerated = true;
    });
    msg.shadowRoot!.querySelector<HTMLElement>('[part="regenerate-button"]')?.click();
    expect(regenerated).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-ai-message role="assistant" content="Ready **now**."></mth-ai-message>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('<mth-ai-message', '<hyd-ai-message')
      .replaceAll('</mth-ai-message>', '</hyd-ai-message>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAiMessage('hyd');
        customElements.upgrade(host);
        await (host as MthAiMessage).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
