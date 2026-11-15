import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { progressBarSpec } from './progress-bar.spec.js';
import { MthProgressBar, registerMthProgressBar } from './index.js';

describe('<mth-progress-bar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, uses adopted CSSStyleSheet --_progress without inline style=, and handles indeterminate', async () => {
    const compiled = compileSpec(progressBarSpec);
    expect(compiled.docs).toContain('`<mth-progress-bar>`');

    const report = await runBehaviorSpecAssertions(progressBarSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const pb = document.createElement('mth-progress-bar') as MthProgressBar;
    pb.value = 45;
    pb.max = 100;
    document.body.appendChild(pb);
    await pb.updateComplete;

    const track = pb.shadowRoot!.querySelector('[part="track"]')!;
    const fill = pb.shadowRoot!.querySelector('[part="fill"]')!;
    expect(track.getAttribute('role')).toBe('progressbar');
    expect(track.getAttribute('aria-label')).toBe('Progress');
    expect(track.getAttribute('aria-valuemin')).toBe('0');
    expect(track.getAttribute('aria-valuemax')).toBe('100');
    expect(track.getAttribute('aria-valuenow')).toBe('45');
    expect(fill.hasAttribute('style')).toBe(false);
    expect(track.hasAttribute('style')).toBe(false);

    // Adopted stylesheet carries --_progress: 45%
    const sheets = pb.shadowRoot!.adoptedStyleSheets;
    expect(sheets.some((s) => Array.from(s.cssRules).some((r) => r.cssText.includes('45%')))).toBe(true);

    pb.indeterminate = true;
    await pb.updateComplete;
    expect(pb.hasCustomState('indeterminate')).toBe(true);
    expect(track.hasAttribute('aria-valuenow')).toBe(false);
    expect(scanSameRootAria(pb).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-progress-bar value="60" max="100" label="Upload"></mth-progress-bar>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    expect(rawSsr).not.toContain('style=');

    const ssrHtml = rawSsr
      .replaceAll('mth-progress-bar>', 'hyd-progress-bar>')
      .replaceAll('<mth-progress-bar', '<hyd-progress-bar');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthProgressBar('hyd');
        customElements.upgrade(host);
        await (host as MthProgressBar).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
