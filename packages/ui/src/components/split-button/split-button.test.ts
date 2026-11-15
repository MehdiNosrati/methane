import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { splitButtonSpec } from './split-button.spec.js';
import { MthSplitButton, registerMthSplitButton } from './index.js';

describe('<mth-split-button>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, passes OverlaySuite, and emits mth-press and mth-select', async () => {
    const compiled = compileSpec(splitButtonSpec);
    expect(compiled.docs).toContain('`<mth-split-button>`');

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open menu';
        const el = document.createElement('mth-split-button') as MthSplitButton;
        el.label = 'Deploy';
        el.items = [
          { label: 'Deploy staging', value: 'staging' },
          { label: 'Deploy production', value: 'prod' },
        ];
        return { overlay: el, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthSplitButton).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthSplitButton).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthSplitButton).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const specReport = await runBehaviorSpecAssertions(splitButtonSpec, {
      overlay: overlayAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);
    expect(overlayReport.passed).toBe(true);

    const el = document.createElement('mth-split-button') as MthSplitButton;
    el.label = 'Export';
    el.items = [{ label: 'CSV', value: 'csv' }];
    document.body.appendChild(el);
    await el.updateComplete;

    let presses = 0;
    const selected: string[] = [];
    el.addEventListener('mth-press', () => {
      presses += 1;
    });
    el.addEventListener('mth-select', (ev) => {
      selected.push((ev as CustomEvent<{ value: string }>).detail.value);
    });

    (el.shadowRoot?.querySelector('[part="primary"]') as HTMLButtonElement).click();
    expect(presses).toBe(1);

    await el.show();
    await el.updateComplete;
    (el.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(selected).toEqual(['csv']);
    expect(el.open).toBe(false);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-split-button label="Save"></mth-split-button>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-split-button>', 'hyd-split-button>')
      .replaceAll('<mth-split-button', '<hyd-split-button');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSplitButton('hyd');
        customElements.upgrade(host);
        await (host as MthSplitButton).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
