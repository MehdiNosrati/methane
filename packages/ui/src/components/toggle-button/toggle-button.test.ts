import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { toggleButtonSpec } from './toggle-button.spec.js';
import { MthToggleButton, registerMthToggleButton } from './index.js';

describe('<mth-toggle-button>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('toggles pressed state, reflects aria-pressed, and supports cancelable mth-change', async () => {
    const compiled = compileSpec(toggleButtonSpec);
    expect(compiled.docs).toContain('`<mth-toggle-button>`');
    const specReport = await runBehaviorSpecAssertions(toggleButtonSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-toggle-button') as MthToggleButton;
    el.textContent = 'Bold';
    el.value = 'bold';
    document.body.appendChild(el);
    await el.updateComplete;

    const btn = el.shadowRoot!.querySelector('button')!;
    expect(btn.getAttribute('aria-pressed')).toBe('false');

    const events: Array<{ pressed: boolean; value: string }> = [];
    el.addEventListener('mth-change', (ev) => {
      events.push((ev as CustomEvent<{ pressed: boolean; value: string }>).detail);
    });

    btn.click();
    await el.updateComplete;
    expect(el.pressed).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(events).toEqual([{ pressed: true, value: 'bold' }]);

    el.addEventListener('mth-change', (ev) => ev.preventDefault(), { once: true });
    btn.click();
    await el.updateComplete;
    expect(el.pressed).toBe(true);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-toggle-button pressed>Bold</mth-toggle-button>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-toggle-button>', 'hyd-toggle-button>')
      .replaceAll('<mth-toggle-button', '<hyd-toggle-button');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthToggleButton('hyd');
        customElements.upgrade(host);
        await (host as MthToggleButton).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
