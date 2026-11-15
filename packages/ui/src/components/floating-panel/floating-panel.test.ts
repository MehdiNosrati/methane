import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { floatingPanelSpec } from './floating-panel.spec.js';
import { MthFloatingPanel, registerMthFloatingPanel } from './index.js';

describe('<mth-floating-panel>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(floatingPanelSpec);
    expect(compiled.docs).toContain('`<mth-floating-panel>`');

    const report = await runBehaviorSpecAssertions(floatingPanelSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          const overlay = document.createElement('mth-floating-panel') as MthFloatingPanel;
          overlay.label = 'Inspector';
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthFloatingPanel).show();
        },
        close: async (overlay) => {
          await (overlay as MthFloatingPanel).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthFloatingPanel).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-floating-panel') as MthFloatingPanel;
        overlay.label = 'Inspector';
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthFloatingPanel).show();
      },
      close: async (overlay) => {
        await (overlay as MthFloatingPanel).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthFloatingPanel).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(suiteReport.passed).toBe(true);
  });

  it('supports moving, minimizing, and docking', async () => {
    const panel = document.createElement('mth-floating-panel') as MthFloatingPanel;
    panel.label = 'Layers';
    document.body.appendChild(panel);
    await panel.show();
    await panel.updateComplete;

    const handle = panel.shadowRoot?.querySelector<HTMLElement>('.drag-handle');
    handle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await panel.updateComplete;
    expect(panel.x).toBe(36);

    const minBtn = panel.shadowRoot?.querySelector<HTMLButtonElement>('[part="minimize-button"]');
    minBtn?.click();
    await panel.updateComplete;
    expect(panel.minimized).toBe(true);
    expect(panel.shadowRoot?.querySelector('.body')?.hasAttribute('hidden')).toBe(true);

    const dockBtn = panel.shadowRoot?.querySelector<HTMLButtonElement>('[part="dock-button"]');
    dockBtn?.click();
    await panel.updateComplete;
    expect(panel.dock).toBe('end');

    // RTL ArrowLeft advances inline-start x
    panel.setDock('none');
    panel.moveTo(20, 20);
    panel.setAttribute('dir', 'rtl');
    await panel.updateComplete;
    handle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await panel.updateComplete;
    expect(panel.x).toBe(32);

    expect(scanSameRootAria(panel).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-floating-panel label="Tools"><p>Content</p></mth-floating-panel>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-floating-panel', '<hyd-floating-panel')
      .replaceAll('</mth-floating-panel>', '</hyd-floating-panel>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFloatingPanel('hyd');
        customElements.upgrade(host);
        await (host as MthFloatingPanel).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
