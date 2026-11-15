import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthBottomSheet, bottomSheetSpec, registerMthBottomSheet } from './index.js';

describe('<mth-bottom-sheet>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(bottomSheetSpec);
    expect(compiled.docs).toContain('`<mth-bottom-sheet>`');

    const report = await runBehaviorSpecAssertions(bottomSheetSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open sheet';
          const overlay = document.createElement('mth-bottom-sheet') as MthBottomSheet;
          overlay.label = 'Filters';
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthBottomSheet).show();
        },
        close: async (overlay) => {
          await (overlay as MthBottomSheet).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthBottomSheet).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-bottom-sheet') as MthBottomSheet;
        overlay.label = 'Options';
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthBottomSheet).show();
      },
      close: async (overlay) => {
        await (overlay as MthBottomSheet).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthBottomSheet).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(suiteReport.passed).toBe(true);
  });

  it('supports keyboard detent changes and emits mth-detent-change', async () => {
    const sheet = document.createElement('mth-bottom-sheet') as MthBottomSheet;
    sheet.label = 'Sheet detents';
    document.body.appendChild(sheet);
    await sheet.show();
    await sheet.updateComplete;

    const detents: string[] = [];
    sheet.addEventListener('mth-detent-change', (e: Event) => {
      detents.push((e as CustomEvent<{ detent: string }>).detail.detent);
    });

    const handle = sheet.shadowRoot?.querySelector<HTMLButtonElement>('.handle-bar');
    expect(handle).not.toBeNull();
    handle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await sheet.updateComplete;
    expect(sheet.detent).toBe('full');
    expect(detents).toEqual(['full']);

    handle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await sheet.updateComplete;
    expect(sheet.detent).toBe('half');
    expect(detents).toEqual(['full', 'half']);

    expect(scanSameRootAria(sheet).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-bottom-sheet label="Filters"><p>Filter body</p></mth-bottom-sheet>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-bottom-sheet', '<hyd-bottom-sheet')
      .replaceAll('</mth-bottom-sheet>', '</hyd-bottom-sheet>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBottomSheet('hyd');
        customElements.upgrade(host);
        await (host as MthBottomSheet).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
