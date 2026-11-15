import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { ICON_CATALOG, MthIcon, iconSpec, registerMthIcon, type MthIconName } from './index.js';

const EXPECTED_ICONS: ReadonlyArray<MthIconName> = [
  'check',
  'close',
  'chevron-down',
  'chevron-right',
  'chevron-left',
  'chevron-up',
  'search',
  'info',
  'warning',
  'error',
  'success',
  'external',
  'menu',
  'plus',
  'minus',
  'user',
  'copy',
  'share',
];

describe('<mth-icon>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, renders all 18 built-in SVG icons, and handles decorative vs labeled ARIA', async () => {
    const compiled = compileSpec(iconSpec);
    expect(compiled.docs).toContain('`<mth-icon>`');

    const report = await runBehaviorSpecAssertions(iconSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const icon = document.createElement('mth-icon') as MthIcon;
    document.body.appendChild(icon);

    for (const name of EXPECTED_ICONS) {
      expect(name in ICON_CATALOG).toBe(true);
      icon.name = name;
      await icon.updateComplete;
      expect(icon.shadowRoot!.querySelector('svg[part="svg"]')).not.toBeNull();
    }

    const base = icon.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute('aria-hidden')).toBe('true');
    expect(base.hasAttribute('role')).toBe(false);

    icon.label = 'Share item';
    await icon.updateComplete;
    expect(base.getAttribute('role')).toBe('img');
    expect(base.getAttribute('aria-label')).toBe('Share item');
    expect(base.hasAttribute('aria-hidden')).toBe(false);
    expect(scanSameRootAria(icon).valid).toBe(true);
  });

  it('supports slot fallback when name is omitted', async () => {
    const icon = document.createElement('mth-icon') as MthIcon;
    const customSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.appendChild(customSvg);
    document.body.appendChild(icon);
    await icon.updateComplete;

    const slot = icon.shadowRoot!.querySelector('slot');
    expect(slot).not.toBeNull();
    expect(slot!.assignedNodes()).toEqual([customSvg]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-icon name="check" label="Verified"></mth-icon>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-icon>', 'hyd-icon>').replaceAll('<mth-icon', '<hyd-icon');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthIcon('hyd');
        customElements.upgrade(host);
        await (host as MthIcon).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
