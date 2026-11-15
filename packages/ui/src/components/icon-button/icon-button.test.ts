import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { iconButtonSpec } from './icon-button.spec.js';
import { MthIconButton, registerMthIconButton } from './index.js';

describe('<mth-icon-button>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, forwards label, warns if label is missing, and toggles aria-pressed', async () => {
    const compiled = compileSpec(iconButtonSpec);
    expect(compiled.docs).toContain('`<mth-icon-button>`');

    const report = await runBehaviorSpecAssertions(iconButtonSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = document.createElement('mth-icon-button') as MthIconButton;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();

    el.label = 'Bookmark';
    el.pressed = false;
    await el.updateComplete;

    const btn = el.shadowRoot?.querySelector('button[part="control"]') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Bookmark');
    expect(btn.getAttribute('aria-pressed')).toBe('false');

    const changes: boolean[] = [];
    el.addEventListener('mth-change', (ev) => {
      changes.push((ev as CustomEvent<{ pressed: boolean }>).detail.pressed);
    });
    btn.click();
    await el.updateComplete;
    expect(el.pressed).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(changes).toEqual([true]);

    el.pressed = undefined;
    await el.updateComplete;
    expect(btn.hasAttribute('aria-pressed')).toBe(false);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-icon-button label="Close">×</mth-icon-button>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-icon-button>', 'hyd-icon-button>')
      .replaceAll('<mth-icon-button', '<hyd-icon-button');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthIconButton('hyd');
        customElements.upgrade(host);
        await (host as MthIconButton).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
