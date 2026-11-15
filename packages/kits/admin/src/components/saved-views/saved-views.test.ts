import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthSavedViews,
  registerMthSavedViews,
  savedViewsSpec,
} from './index.js';

describe('<mth-saved-views>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite (LTR + RTL)', async () => {
    registerMthSavedViews();
    const compiled = compileSpec(savedViewsSpec);
    expect(compiled.docs).toContain('`<mth-saved-views>`');

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-saved-views') as MthSavedViews;
        el.dir = dir;
        el.views = [
          { id: 'all', label: 'All' },
          { id: 'open', label: 'Open' },
          { id: 'closed', label: 'Closed' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="tab"]')),
      orientation: 'horizontal' as const,
      loop: true,
    };

    const report = await RovingFocusSuite.run(rovingAdapter);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(savedViewsSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('creates, duplicates, pins, and deletes saved views cleanly', async () => {
    registerMthSavedViews();
    const el = document.createElement('mth-saved-views') as MthSavedViews;
    el.views = [{ id: 'all', label: 'All' }];
    document.body.appendChild(el);
    await el.updateComplete;

    const created = el.createView('VIP');
    await el.updateComplete;
    expect(el.activeViewId).toBe(created.id);

    el.togglePinActiveView();
    await el.updateComplete;
    expect(el.views.find((v) => v.id === created.id)?.pinned).toBe(true);

    const copy = el.duplicateActiveView();
    expect(copy).not.toBeNull();
    el.deleteView(created.id);
    await el.updateComplete;

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('inherits ancestor [dir="rtl"] and blocks sibling action key-hijacking', async () => {
    registerMthSavedViews();
    const wrapper = document.createElement('div');
    wrapper.setAttribute('dir', 'rtl');
    const el = document.createElement('mth-saved-views') as MthSavedViews;
    el.views = [
      { id: 'v1', label: 'First' },
      { id: 'v2', label: 'Second' },
    ];
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('[part="base"]')?.getAttribute('dir')).toBe('rtl');
    const actionBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="actions"] button')!;
    actionBtn.focus();
    actionBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(el.shadowRoot!.activeElement).toBe(actionBtn);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-saved-views active-view-id="all"></mth-saved-views>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-saved-views>', 'hyd-saved-views>')
      .replaceAll('<mth-saved-views', '<hyd-saved-views');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSavedViews('hyd');
        customElements.upgrade(host);
        await (host as MthSavedViews).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
