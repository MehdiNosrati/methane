import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  OverlaySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { speedDialSpec } from './speed-dial.spec.js';
import { MthSpeedDial, registerMthSpeedDial } from './index.js';

describe('<mth-speed-dial>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes OverlaySuite, RovingFocusSuite, and emits mth-select', async () => {
    const compiled = compileSpec(speedDialSpec);
    expect(compiled.docs).toContain('`<mth-speed-dial>`');

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open dial';
        const el = document.createElement('mth-speed-dial') as MthSpeedDial;
        el.label = 'Quick create';
        el.actions = [
          { label: 'New note', value: 'note' },
          { label: 'Upload file', value: 'upload' },
        ];
        return { overlay: el, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthSpeedDial).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthSpeedDial).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthSpeedDial).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const rovingFocusAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-speed-dial') as MthSpeedDial;
        el.dir = dir;
        el.direction = 'up';
        el.actions = [
          { label: 'First', value: 'first' },
          { label: 'Second', value: 'second' },
          { label: 'Third', value: 'third' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        await el.show();
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) =>
        Array.from(container.shadowRoot!.querySelectorAll<HTMLElement>('[part="action"]')),
      orientation: 'vertical' as const,
      loop: true,
    };

    const specReport = await runBehaviorSpecAssertions(speedDialSpec, {
      overlay: overlayAdapter,
      rovingFocus: rovingFocusAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);
    const rovingReport = await RovingFocusSuite.run(rovingFocusAdapter);
    expect(rovingReport.failures).toEqual([]);

    const horizontalRovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-speed-dial') as MthSpeedDial;
        el.dir = dir;
        el.direction = 'end';
        el.actions = [
          { label: 'First', value: 'first' },
          { label: 'Second', value: 'second' },
          { label: 'Third', value: 'third' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        await el.show();
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) =>
        Array.from(container.shadowRoot!.querySelectorAll<HTMLElement>('[part="action"]')),
      orientation: 'horizontal' as const,
      loop: true,
    };
    const horizontalReport = await RovingFocusSuite.run(horizontalRovingAdapter);
    expect(horizontalReport.failures).toEqual([]);

    const el = document.createElement('mth-speed-dial') as MthSpeedDial;
    el.actions = [{ label: 'Share', value: 'share' }];
    document.body.appendChild(el);
    await el.updateComplete;
    await el.show();
    await el.updateComplete;

    let selected = '';
    el.addEventListener('mth-select', (ev) => {
      selected = (ev as CustomEvent<{ value: string }>).detail.value;
    });
    (el.shadowRoot!.querySelector('[part="action"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(selected).toBe('share');
    expect(el.open).toBe(false);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-speed-dial label="Create"></mth-speed-dial>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-speed-dial>', 'hyd-speed-dial>')
      .replaceAll('<mth-speed-dial', '<hyd-speed-dial');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSpeedDial('hyd');
        customElements.upgrade(host);
        await (host as MthSpeedDial).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
