import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { settingsShellSpec } from './settings-shell.spec.js';
import { MthSettingsShell, registerMthSettingsShell } from './index.js';

describe('<mth-settings-shell>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite', async () => {
    registerMthSettingsShell();
    const compiled = compileSpec(settingsShellSpec);
    expect(compiled.docs).toContain('`<mth-settings-shell>`');

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-settings-shell') as MthSettingsShell;
        el.dir = dir;
        el.sections = [
          { id: 'general', label: 'General' },
          { id: 'security', label: 'Security' },
          { id: 'billing', label: 'Billing' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="tab"]')),
      orientation: 'vertical' as const,
      loop: true,
    };

    const report = await RovingFocusSuite.run(rovingAdapter);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(settingsShellSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('switches sections, exposes save bar on dirty state, and passes ARIA scan', async () => {
    registerMthSettingsShell();
    const el = document.createElement('mth-settings-shell') as MthSettingsShell;
    el.sections = [
      { id: 'profile', label: 'Profile' },
      { id: 'tokens', label: 'API Tokens' },
    ];
    el.dirty = true;
    document.body.appendChild(el);
    await el.updateComplete;

    el.selectSection('tokens');
    await el.updateComplete;
    expect(el.activeSectionId).toBe('tokens');

    const saveBar = el.shadowRoot!.querySelector('[part="save-bar"]') as HTMLElement;
    expect(saveBar.hidden).toBe(false);

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-settings-shell active-section-id="general"><p>Form body</p></mth-settings-shell>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-settings-shell>', 'hyd-settings-shell>')
      .replaceAll('<mth-settings-shell', '<hyd-settings-shell');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSettingsShell('hyd');
        customElements.upgrade(host);
        await (host as MthSettingsShell).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
