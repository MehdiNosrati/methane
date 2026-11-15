import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthSsoButtons, registerMthSsoButtons, ssoButtonsSpec } from './index.js';

describe('<mth-sso-buttons>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, RovingFocusSuite, loading guards, and mth-sso-select', async () => {
    const compiled = compileSpec(ssoButtonsSpec);
    expect(compiled.docs).toContain('`<mth-sso-buttons>`');

    const report = await runBehaviorSpecAssertions(ssoButtonsSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const rf = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-sso-buttons') as MthSsoButtons;
        if (dir) el.setAttribute('dir', dir);
        el.orientation = 'horizontal';
        el.providers = [
          { id: 'google', label: 'Google' },
          { id: 'github', label: 'GitHub' },
          { id: 'saml', label: 'Okta SSO' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => (el as MthSsoButtons).getItemElements(),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rf.failures).toEqual([]);
    expect(rf.passed).toBe(true);

    const el = document.createElement('mth-sso-buttons') as MthSsoButtons;
    el.providers = [
      { id: 'google', label: 'Google' },
      { id: 'github', label: 'GitHub' },
    ];
    el.loadingProvider = 'github';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.hasCustomState('loading')).toBe(true);
    let selected: unknown = null;
    el.addEventListener('mth-sso-select', (e: Event) => {
      selected = (e as CustomEvent).detail;
    });

    const items = el.getItemElements();
    items[1]?.click(); // disabled while loading
    expect(selected).toBeNull();
    items[0]?.click();
    expect(selected).toEqual({ provider: 'google', label: 'Google' });
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-sso-buttons label="Sign in with"></mth-sso-buttons>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-sso-buttons', '<hyd-sso-buttons')
      .replaceAll('</mth-sso-buttons>', '</hyd-sso-buttons>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSsoButtons('hyd');
        customElements.upgrade(host);
        await (host as MthSsoButtons).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
