import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthHoverCard, hoverCardSpec, registerMthHoverCard } from './index.js';

describe('<mth-hover-card>', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(hoverCardSpec);
    expect(compiled.docs).toContain('`<mth-hover-card>`');

    const report = await runBehaviorSpecAssertions(hoverCardSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Hover target';
          const overlay = document.createElement('mth-hover-card') as MthHoverCard;
          overlay.label = 'Profile preview';
          overlay.textContent = 'Preview card details';
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthHoverCard).show();
        },
        close: async (overlay) => {
          await (overlay as MthHoverCard).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthHoverCard).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const standaloneReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-hover-card') as MthHoverCard;
        overlay.forceFallback = true;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthHoverCard).show();
      },
      close: async (overlay) => {
        await (overlay as MthHoverCard).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthHoverCard).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(standaloneReport.passed).toBe(true);
  });

  it('opens and closes after hover/focus delays and positions with fallback', async () => {
    vi.useFakeTimers();
    const card = document.createElement('mth-hover-card') as MthHoverCard;
    card.openDelay = 120;
    card.closeDelay = 150;
    card.forceFallback = true;

    const trigger = document.createElement('button');
    trigger.slot = 'trigger';
    trigger.textContent = '@methane';
    card.appendChild(trigger);

    const body = document.createElement('p');
    body.textContent = 'Design system profile';
    card.appendChild(body);

    document.body.appendChild(card);
    await card.updateComplete;

    const triggerSlot = card.shadowRoot!.querySelector<HTMLElement>('#mth-hc-trigger')!;
    triggerSlot.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    await vi.advanceTimersByTimeAsync(119);
    expect(card.open).toBe(false);

    await vi.advanceTimersByTimeAsync(2);
    await card.updateComplete;
    expect(card.open).toBe(true);
    expect(card.lastPositioningResult?.strategy).toBe('js-fallback');
    expect(scanSameRootAria(card).valid).toBe(true);

    triggerSlot.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    await vi.advanceTimersByTimeAsync(155);
    await card.updateComplete;
    expect(card.open).toBe(false);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-hover-card label="Details"><span slot="trigger">Target</span>Preview body</mth-hover-card>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('<mth-hover-card', '<hyd-hover-card')
      .replaceAll('</mth-hover-card>', '</hyd-hover-card>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthHoverCard('hyd');
        customElements.upgrade(host);
        await (host as MthHoverCard).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
