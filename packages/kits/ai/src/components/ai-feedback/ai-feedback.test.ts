import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthAiFeedback, aiFeedbackSpec, registerMthAiFeedback } from './index.js';

describe('<mth-ai-feedback>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, RovingFocusSuite (LTR + RTL), and multi-reason selection', async () => {
    const compiled = compileSpec(aiFeedbackSpec);
    expect(compiled.docs).toContain('`<mth-ai-feedback>`');

    const report = await runBehaviorSpecAssertions(aiFeedbackSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const rf = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-ai-feedback') as MthAiFeedback;
        if (dir) el.setAttribute('dir', dir);
        el.rating = 'down';
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => (el as MthAiFeedback).getItemElements(),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rf.failures).toEqual([]);
    expect(rf.passed).toBe(true);

    const el = document.createElement('mth-ai-feedback') as MthAiFeedback;
    document.body.appendChild(el);
    await el.updateComplete;

    const buttons = el.getItemElements();
    buttons[1]?.click();
    await el.updateComplete;
    expect(el.rating).toBe('down');
    expect(el.hasCustomState('negative')).toBe(true);

    const withReasons = el.getItemElements();
    expect(withReasons.length).toBeGreaterThan(2);
    withReasons[2]?.click();
    await el.updateComplete;
    expect(el.selectedReasons.length).toBe(1);

    let lastDetail: unknown = null;
    el.addEventListener('mth-feedback', (e: Event) => {
      lastDetail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLElement>('[part="submit-button"]')?.click();
    await el.updateComplete;
    expect(el.submitted).toBe(true);
    expect((lastDetail as { submitted: boolean }).submitted).toBe(true);
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-ai-feedback label="Rate answer"></mth-ai-feedback>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-ai-feedback', '<hyd-ai-feedback')
      .replaceAll('</mth-ai-feedback>', '</hyd-ai-feedback>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAiFeedback('hyd');
        customElements.upgrade(host);
        await (host as MthAiFeedback).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
