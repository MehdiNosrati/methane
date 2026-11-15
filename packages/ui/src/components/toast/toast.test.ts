import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { getRuntime } from '@methane-ui/core';
import { LiveAnnouncer } from '@methane-ui/primitives';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MthToast, registerMthToast, toastSpec } from './index.js';

describe('<mth-toast>', () => {
  afterEach(() => {
    vi.useRealTimers();
    MthToast.clear();
    LiveAnnouncer.clear();
    document.body.replaceChildren();
  });

  it('compiles spec, runs auto-dismiss with pause-on-hover/focus, and announces via LiveAnnouncer', async () => {
    vi.useFakeTimers();

    const compiled = compileSpec(toastSpec);
    expect(compiled.docs).toContain('`<mth-toast>`');

    const report = await runBehaviorSpecAssertions(toastSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const toast = document.createElement('mth-toast') as MthToast;
    toast.variant = 'success';
    toast.heading = 'Saved';
    toast.message = 'Profile updated';
    toast.duration = 2000;
    document.body.appendChild(toast);
    await toast.updateComplete;

    await toast.show();
    await toast.updateComplete;
    expect(toast.open).toBe(true);
    expect(scanSameRootAria(toast).valid).toBe(true);
    expect(LiveAnnouncer.getLastAnnouncement()).toEqual({
      message: 'Saved: Profile updated',
      politeness: 'polite',
    });

    // Advance 1000ms, then pause on hover
    await vi.advanceTimersByTimeAsync(1000);
    const surface = toast.shadowRoot!.querySelector<HTMLElement>('#mth-toast-surface')!;
    const PointerEv = typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
    surface.dispatchEvent(new PointerEv('pointerenter', { bubbles: true }));
    expect(toast.isPaused).toBe(true);

    // Even after 5s while hovered, toast remains open
    await vi.advanceTimersByTimeAsync(5000);
    expect(toast.open).toBe(true);

    // Resume on pointerleave; remaining ~1000ms dismisses toast
    surface.dispatchEvent(new PointerEv('pointerleave', { bubbles: true }));
    expect(toast.isPaused).toBe(false);
    await vi.advanceTimersByTimeAsync(1100);
    await toast.updateComplete;
    expect(toast.open).toBe(false);
  });

  it('supports static MthToast.notify(...) backed by runtime NotificationStore and assertive danger tone', async () => {
    vi.useFakeTimers();

    const viewport = document.createElement('mth-toast') as MthToast;
    viewport.placement = 'top-end';
    document.body.appendChild(viewport);
    await viewport.updateComplete;

    const item = MthToast.notify({
      title: 'Connection Lost',
      message: 'Retrying in 5s',
      variant: 'danger',
      duration: 3000,
    });
    await viewport.updateComplete;

    expect(getRuntime().notifications.list().some((n) => n.id === item.id)).toBe(true);
    expect(viewport.notifications).toHaveLength(1);
    expect(viewport.shadowRoot!.querySelectorAll('[part="item"]')).toHaveLength(1);
    expect(LiveAnnouncer.getLastAnnouncement()).toEqual({
      message: 'Connection Lost: Retrying in 5s',
      politeness: 'assertive',
    });

    await vi.advanceTimersByTimeAsync(3100);
    await viewport.updateComplete;
    expect(viewport.notifications).toHaveLength(0);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-toast variant="info" heading="Sync">All changes synced</mth-toast>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-toast>', 'hyd-toast>')
      .replaceAll('<mth-toast', '<hyd-toast');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthToast('hyd');
        customElements.upgrade(host);
        await (host as MthToast).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
