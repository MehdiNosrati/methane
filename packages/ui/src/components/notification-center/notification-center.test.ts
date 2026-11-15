import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { notificationCenterSpec } from './notification-center.spec.js';
import { MthNotificationCenter, registerMthNotificationCenter } from './index.js';

describe('<mth-notification-center>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(notificationCenterSpec);
    expect(compiled.docs).toContain('`<mth-notification-center>`');

    const report = await runBehaviorSpecAssertions(notificationCenterSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          const overlay = document.createElement('mth-notification-center') as MthNotificationCenter;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthNotificationCenter).show();
        },
        close: async (overlay) => {
          await (overlay as MthNotificationCenter).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthNotificationCenter).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-notification-center') as MthNotificationCenter;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthNotificationCenter).show();
      },
      close: async (overlay) => {
        await (overlay as MthNotificationCenter).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthNotificationCenter).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(suiteReport.passed).toBe(true);
  });

  it('manages runtime-scoped notifications with dismiss and clearAll', async () => {
    const center = document.createElement('mth-notification-center') as MthNotificationCenter;
    center.inline = true;
    document.body.appendChild(center);
    await center.updateComplete;

    center.clearAll();
    const item = center.notify({ title: 'Saved', message: 'Draft synced.', tone: 'success' });
    await center.updateComplete;
    expect(center.notifications.length).toBe(1);
    expect(center.shadowRoot?.querySelectorAll('[part="item"]').length).toBe(1);

    center.shadowRoot?.querySelector<HTMLButtonElement>('[part="dismiss-button"]')?.click();
    await center.updateComplete;
    expect(center.notifications.some((n) => n.id === item.id)).toBe(false);

    center.notify({ message: 'Second notice' });
    await center.updateComplete;
    center.shadowRoot?.querySelector<HTMLButtonElement>('[part="clear-button"]')?.click();
    await center.updateComplete;
    expect(center.notifications.length).toBe(0);
    expect(scanSameRootAria(center).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-notification-center inline></mth-notification-center>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-notification-center', '<hyd-notification-center')
      .replaceAll('</mth-notification-center>', '</hyd-notification-center>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthNotificationCenter('hyd');
        customElements.upgrade(host);
        await (host as MthNotificationCenter).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
