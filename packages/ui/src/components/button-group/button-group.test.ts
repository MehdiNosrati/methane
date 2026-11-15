import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { buttonGroupSpec } from './button-group.spec.js';
import { MthButtonGroup, registerMthButtonGroup } from './index.js';

describe('<mth-button-group>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite in toolbar/roving mode (LTR and RTL)', async () => {
    const compiled = compileSpec(buttonGroupSpec);
    expect(compiled.docs).toContain('`<mth-button-group>`');

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const group = document.createElement('mth-button-group') as MthButtonGroup;
        group.setAttribute('dir', dir);
        group.roleMode = 'toolbar';
        group.label = 'Formatting';

        for (const text of ['Bold', 'Italic', 'Underline']) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = text;
          group.appendChild(btn);
        }

        document.body.appendChild(group);
        await group.updateComplete;
        return group;
      },
      getItems: (container: HTMLElement) => (container as MthButtonGroup).getItems() as HTMLElement[],
    };

    const specReport = await runBehaviorSpecAssertions(buttonGroupSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);

    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);
    expect(scanSameRootAria(document.body).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-button-group attached><button type="button">A</button><button type="button">B</button></mth-button-group>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-button-group>', 'hyd-button-group>')
      .replaceAll('<mth-button-group', '<hyd-button-group');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthButtonGroup('hyd');
        customElements.upgrade(host);
        await (host as MthButtonGroup).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
