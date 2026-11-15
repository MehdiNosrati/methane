import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { tooltipSpec } from './tooltip.spec.js';
import { MthTooltip, registerMthTooltip } from './index.js';

describe('<mth-tooltip>', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, OverlaySuite, and zero cross-root ARIA IDs', async () => {
    const compiled = compileSpec(tooltipSpec);
    expect(compiled.docs).toContain('`<mth-tooltip>`');

    const report = await runBehaviorSpecAssertions(tooltipSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Save';
          const overlay = document.createElement('mth-tooltip') as MthTooltip;
          overlay.content = 'Save changes (Ctrl+S)';
          overlay.anchor = trigger;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthTooltip).show();
        },
        close: async (overlay) => {
          await (overlay as MthTooltip).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthTooltip).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const fallbackReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Fallback trigger';
        const overlay = document.createElement('mth-tooltip') as MthTooltip;
        overlay.forceFallback = true;
        overlay.content = 'Fallback tooltip';
        overlay.anchor = trigger;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthTooltip).show();
      },
      close: async (overlay) => {
        await (overlay as MthTooltip).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthTooltip).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(fallbackReport.failures).toEqual([]);
    expect(fallbackReport.passed).toBe(true);
  });

  it('triggers via hover/focus/long-press/interestfor and dismisses on Escape without stealing focus', async () => {
    vi.useFakeTimers();

    const outsideInput = document.createElement('input');
    document.body.appendChild(outsideInput);

    const tooltip = document.createElement('mth-tooltip') as MthTooltip;
    tooltip.content = 'Copy link to clipboard';
    tooltip.delay = 150;
    const triggerBtn = document.createElement('button');
    triggerBtn.textContent = 'Copy';
    tooltip.appendChild(triggerBtn);
    document.body.appendChild(tooltip);
    await tooltip.updateComplete;

    // Zero cross-root ARIA references on Light-DOM button or shadow tree
    expect(triggerBtn.hasAttribute('aria-describedby')).toBe(false);
    expect(scanSameRootAria(tooltip).issues).toEqual([]);

    // 1. Focus trigger -> opens after delay, focus remains on trigger
    const wrapper = tooltip.shadowRoot!.querySelector<HTMLElement>('#mth-tooltip-trigger')!;
    triggerBtn.focus();
    wrapper.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(150);
    await tooltip.updateComplete;
    expect(tooltip.open).toBe(true);
    expect(document.activeElement).toBe(triggerBtn);

    // Adopted CSSStyleSheet applied without inline style=
    const surface = tooltip.shadowRoot!.querySelector<HTMLElement>('#mth-tooltip-surface')!;
    expect(surface.hasAttribute('style')).toBe(false);
    expect(tooltip.shadowRoot!.adoptedStyleSheets.length).toBeGreaterThan(0);

    // 2. Escape dismisses without stealing focus (even when another element holds focus)
    outsideInput.focus();
    tooltip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await Promise.resolve();
    await tooltip.updateComplete;
    expect(tooltip.open).toBe(false);
    expect(document.activeElement).toBe(outsideInput);

    // 3. Hover intent + pointerleave
    const PointerEv = typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
    wrapper.dispatchEvent(new PointerEv('pointerenter', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(150);
    await tooltip.updateComplete;
    expect(tooltip.open).toBe(true);

    wrapper.dispatchEvent(new PointerEv('pointerleave', { bubbles: true }));
    await Promise.resolve();
    await tooltip.updateComplete;
    expect(tooltip.open).toBe(false);

    // 4. Touch long-press fallback + native interest/loseinterest
    if (typeof PointerEvent !== 'undefined') {
      wrapper.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
      await vi.advanceTimersByTimeAsync(500);
      await tooltip.updateComplete;
      expect(tooltip.open).toBe(true);
      wrapper.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }));
      await tooltip.hide();
    }

    expect(typeof tooltip.supportsInterestFor).toBe('boolean');
    wrapper.dispatchEvent(new Event('interest', { bubbles: true }));
    await Promise.resolve();
    await tooltip.updateComplete;
    expect(tooltip.open).toBe(true);
    wrapper.dispatchEvent(new Event('loseinterest', { bubbles: true }));
    await Promise.resolve();
    await tooltip.updateComplete;
    expect(tooltip.open).toBe(false);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tooltip content="Help text"><button>?</button></mth-tooltip>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-tooltip>', 'hyd-tooltip>')
      .replaceAll('<mth-tooltip', '<hyd-tooltip');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTooltip('hyd');
        customElements.upgrade(host);
        await (host as MthTooltip).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
