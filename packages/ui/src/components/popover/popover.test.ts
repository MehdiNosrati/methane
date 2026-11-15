import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthPopover, popoverSpec, registerMthPopover } from './index.js';

describe('<mth-popover>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite in fallback and mocked native top-layer modes', async () => {
    const compiled = compileSpec(popoverSpec);
    expect(compiled.docs).toContain('`<mth-popover>`');

    const report = await runBehaviorSpecAssertions(popoverSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Trigger';
          const overlay = document.createElement('mth-popover') as MthPopover;
          overlay.anchor = trigger;
          overlay.textContent = 'Popover content';
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthPopover).show();
        },
        close: async (overlay) => {
          await (overlay as MthPopover).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthPopover).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    // Explicit native [popover] top-layer simulation + forceFallback check
    const nativeReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Native Trigger';
        const overlay = document.createElement('mth-popover') as MthPopover;
        overlay.anchor = trigger;
        document.body.appendChild(overlay);
        await overlay.updateComplete;
        const surface = overlay.shadowRoot!.querySelector<HTMLElement>('#mth-popover-surface')!;
        Object.assign(surface, {
          showPopover: vi.fn(),
          hidePopover: vi.fn(),
        });
        overlay.remove();
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthPopover).show();
      },
      close: async (overlay) => {
        await (overlay as MthPopover).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthPopover).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(nativeReport.failures).toEqual([]);
    expect(nativeReport.passed).toBe(true);

    const fallbackReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Fallback Trigger';
        const overlay = document.createElement('mth-popover') as MthPopover;
        overlay.forceFallback = true;
        overlay.anchor = trigger;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthPopover).show();
      },
      close: async (overlay) => {
        await (overlay as MthPopover).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthPopover).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(fallbackReport.failures).toEqual([]);
    expect(fallbackReport.passed).toBe(true);
  });

  it('positions via dual-path PositioningController + adopted CSSStyleSheet with zero inline style=', async () => {
    const origCss = globalThis.CSS;
    try {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: {
          supports: vi.fn((prop: string, val?: string) => prop === 'position-area' && Boolean(val)),
        },
      });

      const popover = document.createElement('mth-popover') as MthPopover;
      const triggerBtn = document.createElement('button');
      triggerBtn.setAttribute('slot', 'trigger');
      triggerBtn.textContent = 'Info';
      popover.appendChild(triggerBtn);
      popover.append('Details body');
      document.body.appendChild(popover);
      await popover.updateComplete;

      // Trigger click opens popover via CSS Anchor path
      triggerBtn.click();
      await Promise.resolve();
      await popover.updateComplete;
      expect(popover.open).toBe(true);
      expect(popover.lastPositioningResult?.strategy).toBe('css-anchor');

      const surface = popover.shadowRoot!.querySelector<HTMLElement>('#mth-popover-surface')!;
      expect(surface.hasAttribute('style')).toBe(false);
      expect(popover.shadowRoot!.adoptedStyleSheets.length).toBeGreaterThan(0);

      // Virtual DOMRect anchor + forceFallback triggers JS collision fallback with zero inline style=
      popover.forceFallback = true;
      popover.anchor = new DOMRect(40, 20, 80, 32);
      await popover.updateComplete;
      expect(popover.lastPositioningResult?.strategy).toBe('js-fallback');
      expect(surface.hasAttribute('style')).toBe(false);
      expect(scanSameRootAria(popover).valid).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: origCss,
      });
    }
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-popover placement="top-start"><button slot="trigger">Open</button><p>Body</p></mth-popover>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-popover>', 'hyd-popover>')
      .replaceAll('<mth-popover', '<hyd-popover');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPopover('hyd');
        customElements.upgrade(host);
        await (host as MthPopover).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('renders arrow, supports placement & cancelable mth-show, and toggles via trigger', async () => {
    const pop = document.createElement('mth-popover') as MthPopover;
    pop.placement = 'bottom-end';
    const trigger = document.createElement('button');
    trigger.slot = 'trigger';
    trigger.textContent = 'Info';
    const body = document.createElement('p');
    body.textContent = 'Helpful details';
    pop.append(trigger, body);
    document.body.appendChild(pop);
    await pop.updateComplete;

    expect(pop.placement).toBe('bottom-end');
    expect(pop.getAttribute('placement')).toBe('bottom-end');

    pop.addEventListener(
      'mth-open',
      (ev) => {
        ev.preventDefault();
      },
      { once: true },
    );
    await pop.show();
    expect(pop.open).toBe(false);

    await pop.show();
    await pop.updateComplete;
    expect(pop.open).toBe(true);
    const surface = pop.shadowRoot!.querySelector<HTMLElement>('#mth-popover-surface')!;
    expect(surface.hidden).toBe(false);
    expect(pop.shadowRoot!.querySelector('#mth-popover-arrow')).not.toBeNull();

    await pop.hide('programmatic');
    await pop.updateComplete;
    expect(pop.open).toBe(false);
    expect(surface.hidden).toBe(true);
  });
});
