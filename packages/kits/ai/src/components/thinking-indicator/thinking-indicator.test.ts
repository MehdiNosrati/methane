import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { thinkingIndicatorSpec } from './thinking-indicator.spec.js';
import { MthThinkingIndicator, registerMthThinkingIndicator } from './index.js';

describe('<mth-thinking-indicator>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, disclosure ARIA, and reduced-motion detection', async () => {
    const compiled = compileSpec(thinkingIndicatorSpec);
    expect(compiled.docs).toContain('`<mth-thinking-indicator>`');

    const report = await runBehaviorSpecAssertions(thinkingIndicatorSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-thinking-indicator') as MthThinkingIndicator;
    el.streaming = true;
    el.content = 'Step 1: inspect inputs.';
    document.body.appendChild(el);
    await el.updateComplete;

    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!;
    const panel = el.shadowRoot!.querySelector<HTMLElement>('[part="panel"]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(scanSameRootAria(el).valid).toBe(true);

    let toggled = false;
    el.addEventListener('mth-toggle', () => {
      toggled = true;
    });
    trigger.click();
    await el.updateComplete;
    expect(toggled).toBe(true);
    expect(el.open).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);

    el.streaming = false;
    el.elapsedSeconds = 4;
    await el.updateComplete;
    expect(trigger.textContent?.replace(/[\u2068\u2069]/g, '')).toContain('Thought for 4s');
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-thinking-indicator elapsed-seconds="3" content="Plan ready"></mth-thinking-indicator>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-thinking-indicator', '<hyd-thinking-indicator')
      .replaceAll('</mth-thinking-indicator>', '</hyd-thinking-indicator>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthThinkingIndicator('hyd');
        customElements.upgrade(host);
        await (host as MthThinkingIndicator).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
