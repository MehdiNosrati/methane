import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { radioSpec } from './radio.spec.js';
import { MthRadio, registerMthRadio } from './index.js';

describe('<mth-radio>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and manages checked/disabled states and click/Space selection', async () => {
    const compiled = compileSpec(radioSpec);
    expect(compiled.docs).toContain('`<mth-radio>`');

    const report = await runBehaviorSpecAssertions(radioSpec, {});
    expect(report.failures).toEqual([]);

    const radio = document.createElement('mth-radio') as MthRadio;
    radio.value = 'pro';
    radio.textContent = 'Pro plan';
    document.body.appendChild(radio);
    await radio.updateComplete;

    const selected: string[] = [];
    radio.addEventListener('mth-radio-select', (ev) => {
      selected.push((ev as CustomEvent<{ value: string }>).detail.value);
    });

    radio.click();
    radio.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(selected).toEqual(['pro', 'pro']);

    radio.checked = true;
    await radio.updateComplete;
    expect(radio.hasCustomState('checked')).toBe(true);
    expect(scanSameRootAria(radio).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-radio value="basic" checked>Basic</mth-radio>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-radio>', 'hyd-radio>')
      .replaceAll('<mth-radio', '<hyd-radio');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthRadio('hyd');
        customElements.upgrade(host);
        await (host as MthRadio).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
