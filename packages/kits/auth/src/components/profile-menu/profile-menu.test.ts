import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthProfileMenu, profileMenuSpec, registerMthProfileMenu } from './index.js';

describe('<mth-profile-menu>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(profileMenuSpec);
    expect(compiled.docs).toContain('`<mth-profile-menu>`');

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Account';
        const overlay = document.createElement('mth-profile-menu') as MthProfileMenu;
        overlay.name = 'Ada Lovelace';
        overlay.email = 'ada@methane.dev';
        overlay.userRole = 'Admin';
        overlay.externalTrigger = trigger;
        overlay.items = [
          { id: 'settings', label: 'Settings' },
          { id: 'signout', label: 'Sign out', danger: true, separatorBefore: true },
        ];
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthProfileMenu).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthProfileMenu).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthProfileMenu).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const report = await runBehaviorSpecAssertions(profileMenuSpec, {
      overlay: overlayAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);
    expect(overlayReport.passed).toBe(true);
  });

  it('emits mth-select and closes when a menu item is clicked, and passes HydrationPuritySuite', async () => {
    const menu = document.createElement('mth-profile-menu') as MthProfileMenu;
    menu.name = 'Grace Hopper';
    menu.email = 'grace@methane.dev';
    menu.items = [
      { id: 'profile', label: 'Profile' },
      { id: 'signout', label: 'Sign out', danger: true },
    ];
    document.body.appendChild(menu);
    await menu.updateComplete;

    await menu.show();
    await menu.updateComplete;
    expect(menu.open).toBe(true);

    let selectedId = '';
    menu.addEventListener('mth-select', ((ev: CustomEvent<{ id: string }>) => {
      selectedId = ev.detail.id;
    }) as EventListener);

    const items = menu.getMenuItems();
    expect(items).toHaveLength(2);
    items[0]!.click();
    await Promise.resolve();
    await menu.updateComplete;

    expect(selectedId).toBe('profile');
    expect(menu.open).toBe(false);

    const aria = scanSameRootAria(menu.shadowRoot!);
    expect(aria.valid).toBe(true);

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-profile-menu name="Ada" email="ada@methane.dev"></mth-profile-menu>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-profile-menu', '<hyd-profile-menu')
      .replaceAll('</mth-profile-menu>', '</hyd-profile-menu>');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthProfileMenu('hyd');
        customElements.upgrade(host);
        await (host as MthProfileMenu).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
