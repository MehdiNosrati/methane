import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { beforeAfterSpec, MthBeforeAfter, registerMthBeforeAfter } from './index.js';

describe('<mth-before-after>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and same-root ARIA', async () => {
    const compiled = compileSpec(beforeAfterSpec);
    expect(compiled.tests).toContain('<mth-before-after>');

    const specReport = await runBehaviorSpecAssertions(beforeAfterSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-before-after') as MthBeforeAfter;
    el.label = 'Photo edit comparison';
    document.body.append(el);
    await el.updateComplete;

    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('adjusts split position via keyboard arrows, Home/End, and emits mth-change', async () => {
    const el = document.createElement('mth-before-after') as MthBeforeAfter;
    el.position = 50;
    el.step = 5;
    document.body.append(el);
    await el.updateComplete;

    const changes: number[] = [];
    el.addEventListener('mth-change', (e) => {
      changes.push((e as CustomEvent<{ position: number }>).detail.position);
    });

    const handle = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="handle"]')!;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.position).toBe(55);
    expect(handle.getAttribute('aria-valuenow')).toBe('55');

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await el.updateComplete;
    expect(el.position).toBe(0);

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await el.updateComplete;
    expect(el.position).toBe(100);
    expect(changes).toEqual([55, 0, 100]);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthBeforeAfter();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-before-after position="40" label="Compare"></mth-before-after>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-before-after>', 'hyd-before-after>')
      .replaceAll('<mth-before-after', '<hyd-before-after');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBeforeAfter('hyd');
        customElements.upgrade(host);
        await (host as MthBeforeAfter).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
