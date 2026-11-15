import { runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthNotificationBell, notificationBellSpec, registerMthNotificationBell } from './index.js';

describe('<mth-notification-bell>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite (show, hide, Escape, light dismiss)', async () => {
    registerMthNotificationBell();

    const report = await runBehaviorSpecAssertions(notificationBellSpec, {
      overlay: {
        mount: async () => {
          const overlay = document.createElement('mth-notification-bell') as MthNotificationBell;
          overlay.forceFallback = true;
          overlay.items = [{ id: 'n1', title: 'Alert', message: 'Build succeeded' }];
          return { overlay, trigger: overlay };
        },
        open: async (overlay) => {
          await (overlay as MthNotificationBell).show();
        },
        close: async (overlay) => {
          await (overlay as MthNotificationBell).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthNotificationBell).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const overlayReport = await OverlaySuite.run({
      mount: async () => {
        const overlay = document.createElement('mth-notification-bell') as MthNotificationBell;
        overlay.forceFallback = true;
        return { overlay, trigger: overlay };
      },
      open: async (overlay) => {
        await (overlay as MthNotificationBell).show();
      },
      close: async (overlay) => {
        await (overlay as MthNotificationBell).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthNotificationBell).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(overlayReport.failures).toEqual([]);
  });

  it('tracks unread count, marks items read, dismisses items, and emits events', async () => {
    registerMthNotificationBell();
    const el = document.createElement('mth-notification-bell') as MthNotificationBell;
    el.forceFallback = true;
    el.useStore = false;
    el.items = [
      { id: '1', title: 'Deploy', message: 'Release **v1.2** live', timestamp: '2m ago' },
      { id: '2', title: 'Comment', message: 'Check [link](javascript:alert(1))', read: true },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.computedUnreadCount).toBe(1);
    const badge = el.shadowRoot?.querySelector('mth-badge');
    expect(badge?.textContent?.trim()).toBe('1');

    const selected: string[] = [];
    const dismissed: string[] = [];
    el.addEventListener('mth-item-select', (e) => {
      selected.push((e as CustomEvent<{ id: string }>).detail.id);
    });
    el.addEventListener('mth-item-dismiss', (e) => {
      dismissed.push((e as CustomEvent<{ id: string }>).detail.id);
    });

    await el.show();
    await el.updateComplete;

    // Dangerous javascript: URI stripped cleanly
    const links = el.shadowRoot?.querySelectorAll('a') ?? [];
    expect(links.length).toBe(0);

    const itemBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.item-body');
    itemBtn?.click();
    await el.updateComplete;
    expect(selected).toEqual(['1']);
    expect(el.computedUnreadCount).toBe(0);

    const dismissBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.dismiss-btn');
    dismissBtn?.click();
    await el.updateComplete;
    expect(dismissed).toEqual(['1']);
    expect(el.effectiveItems.map((i) => i.id)).toEqual(['2']);
  });

  it('passes HydrationPuritySuite and scanSameRootAria without violations', async () => {
    registerMthNotificationBell();
    const rawSsr = await renderLitDsdHtml(litHtml`
      <mth-notification-bell unread-count="3"></mth-notification-bell>
    `);
    const ssrHtml = rawSsr
      .replaceAll('mth-notification-bell>', 'hyd-notification-bell>')
      .replaceAll('<mth-notification-bell', '<hyd-notification-bell');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthNotificationBell('hyd');
        customElements.upgrade(host);
        await (host as MthNotificationBell).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);

    const el = document.createElement('mth-notification-bell') as MthNotificationBell;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('uses accessible role="img" only on unread indicator dot and preserves position sheet across reconnect', async () => {
    const el = document.createElement('mth-notification-bell') as MthNotificationBell;
    el.forceFallback = true;
    el.items = [
      { id: 'u1', message: 'Unread alert', read: false },
      { id: 'r1', message: 'Read alert', read: true },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    await el.show();
    await el.updateComplete;

    const dots = Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.dot'));
    expect(dots[0]!.getAttribute('role')).toBe('img');
    expect(dots[0]!.getAttribute('aria-label')).toBeTruthy();
    expect(dots[1]!.getAttribute('role')).toBeNull();
    expect(dots[1]!.getAttribute('aria-label')).toBeNull();
    expect(dots[1]!.getAttribute('aria-hidden')).toBe('true');

    const sheetsBefore = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBeGreaterThanOrEqual(sheetsBefore);
  });
});
