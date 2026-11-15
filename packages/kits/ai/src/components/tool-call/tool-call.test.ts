import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthToolCall, registerMthToolCall, toolCallSpec } from './index.js';

describe('<mth-tool-call>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, status states, and escaped JSON args/output', async () => {
    const compiled = compileSpec(toolCallSpec);
    expect(compiled.docs).toContain('`<mth-tool-call>`');

    const report = await runBehaviorSpecAssertions(toolCallSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-tool-call') as MthToolCall;
    el.name = 'search_docs';
    el.status = 'success';
    el.durationMs = 42;
    el.args = { query: '<script>alert(1)</script>' };
    el.output = { hits: 2 };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.hasCustomState('success')).toBe(true);
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!;
    trigger.click();
    await el.updateComplete;

    expect(el.open).toBe(true);
    const argsEl = el.shadowRoot!.querySelector('[part="args"]')!;
    expect(argsEl.querySelector('script')).toBeNull();
    expect(argsEl.textContent).toContain('<script>alert(1)</script>');
    expect(el.shadowRoot!.querySelector('[part="output"]')?.textContent).toContain('"hits": 2');
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tool-call name="fetch" status="running"></mth-tool-call>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-tool-call', '<hyd-tool-call')
      .replaceAll('</mth-tool-call>', '</hyd-tool-call>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthToolCall('hyd');
        customElements.upgrade(host);
        await (host as MthToolCall).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
