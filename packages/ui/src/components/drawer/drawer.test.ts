import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { drawerSpec } from './drawer.spec.js';
import { MthDrawer, registerMthDrawer } from './index.js';

describe('<mth-drawer>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite (native top-layer and fallback)', async () => {
    const compiled = compileSpec(drawerSpec);
    expect(compiled.docs).toContain('`<mth-drawer>`');

    const report = await runBehaviorSpecAssertions(drawerSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open drawer';
          const overlay = document.createElement('mth-drawer') as MthDrawer;
          overlay.label = 'Navigation';
          const item = document.createElement('button');
          item.textContent = 'Profile';
          overlay.appendChild(item);
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthDrawer).show();
        },
        close: async (overlay) => {
          await (overlay as MthDrawer).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthDrawer).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    // Explicit forceFallback=true conformance check
    const fallbackReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open fallback drawer';
        const overlay = document.createElement('mth-drawer') as MthDrawer;
        overlay.forceFallback = true;
        overlay.label = 'Filters';
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthDrawer).show();
      },
      close: async (overlay) => {
        await (overlay as MthDrawer).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthDrawer).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(fallbackReport.failures).toEqual([]);
    expect(fallbackReport.passed).toBe(true);
  });

  it('emits mth-cancel on backdrop click and Escape, respects dismissible=false, and supports placements/sizes', async () => {
    const drawer = document.createElement('mth-drawer') as MthDrawer;
    drawer.label = 'Details';
    drawer.placement = 'start';
    drawer.size = 'lg';
    document.body.appendChild(drawer);
    await drawer.updateComplete;

    expect(scanSameRootAria(drawer).valid).toBe(true);
    expect(drawer.motionPhase).toBe('closed');

    const cancelReasons: string[] = [];
    drawer.addEventListener('mth-cancel', (e) => {
      cancelReasons.push((e as CustomEvent<{ reason: string }>).detail.reason);
    });

    await drawer.show();
    expect(drawer.open).toBe(true);
    expect(drawer.motionPhase).toBe('open');

    // Backdrop click on <dialog> dismisses when dismissible=true
    const surface = drawer.shadowRoot!.querySelector<HTMLDialogElement>('#mth-drawer-surface')!;
    surface.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await drawer.updateComplete;
    expect(drawer.open).toBe(false);
    expect(cancelReasons).toEqual(['outside']);

    // Re-open with dismissible=false: Escape & backdrop click must not close
    drawer.dismissible = false;
    await drawer.show();
    await drawer.updateComplete;
    surface.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    drawer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await Promise.resolve();
    expect(drawer.open).toBe(true);

    // Escape closes when dismissible=true and emits mth-cancel
    drawer.dismissible = true;
    await drawer.updateComplete;
    drawer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await Promise.resolve();
    await drawer.updateComplete;
    expect(drawer.open).toBe(false);
    expect(cancelReasons).toEqual(['outside', 'escape']);
  });

  it('reverses start/end slide keyframes when ancestor has dir="rtl"', async () => {
    const rtlContainer = document.createElement('div');
    rtlContainer.setAttribute('dir', 'rtl');
    const drawer = document.createElement('mth-drawer') as MthDrawer;
    drawer.label = 'Settings';
    drawer.placement = 'start';
    rtlContainer.appendChild(drawer);
    document.body.appendChild(rtlContainer);
    await drawer.updateComplete;

    const surface = drawer.shadowRoot!.querySelector<HTMLElement>('#mth-drawer-surface')!;
    const calls: Keyframe[][] = [];
    surface.animate = vi.fn((keyframes: Keyframe[] | PropertyIndexedKeyframes | null) => {
      if (Array.isArray(keyframes)) {
        calls.push(keyframes);
      }
      return {
        finished: Promise.resolve(),
        cancel: vi.fn(),
        finish: vi.fn(),
      } as unknown as Animation;
    }) as unknown as HTMLElement['animate'];

    await drawer.show();
    await drawer.hide('programmatic');

    drawer.placement = 'end';
    await drawer.updateComplete;
    await drawer.show();
    await drawer.hide('programmatic');

    expect(calls[0]?.[0]).toMatchObject({ transform: 'translateX(100%)' });
    expect(calls[1]?.[1]).toMatchObject({ transform: 'translateX(100%)' });
    expect(calls[2]?.[0]).toMatchObject({ transform: 'translateX(-100%)' });
    expect(calls[3]?.[1]).toMatchObject({ transform: 'translateX(-100%)' });
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-drawer label="Filters" placement="bottom" size="sm"><p>Panel body</p></mth-drawer>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-drawer>', 'hyd-drawer>')
      .replaceAll('<mth-drawer', '<hyd-drawer');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDrawer('hyd');
        customElements.upgrade(host);
        await (host as MthDrawer).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
