import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import {
  MthSuggestionChips,
  registerMthSuggestionChips,
  suggestionChipsSpec,
} from './index.js';

describe('<mth-suggestion-chips>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, RovingFocusSuite (LTR + RTL), and mth-select emission', async () => {
    const compiled = compileSpec(suggestionChipsSpec);
    expect(compiled.docs).toContain('`<mth-suggestion-chips>`');

    const report = await runBehaviorSpecAssertions(suggestionChipsSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const rf = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-suggestion-chips') as MthSuggestionChips;
        if (dir) el.setAttribute('dir', dir);
        el.items = [
          { label: 'Summarize', value: 'summarize' },
          { label: 'Write tests', value: 'tests' },
          { label: 'Explain ADR', value: 'adr' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => (el as MthSuggestionChips).getItemElements(),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rf.failures).toEqual([]);
    expect(rf.passed).toBe(true);

    const el = document.createElement('mth-suggestion-chips') as MthSuggestionChips;
    el.items = [{ label: 'Explain code', prompt: 'Explain this module' }];
    document.body.appendChild(el);
    await el.updateComplete;

    let selected: unknown = null;
    el.addEventListener('mth-select', (e: Event) => {
      selected = (e as CustomEvent).detail;
    });
    el.getItemElements()[0]?.click();
    expect(selected).toEqual({
      label: 'Explain code',
      value: 'Explain this module',
      index: 0,
    });
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-suggestion-chips label="Starters"></mth-suggestion-chips>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-suggestion-chips', '<hyd-suggestion-chips')
      .replaceAll('</mth-suggestion-chips>', '</hyd-suggestion-chips>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSuggestionChips('hyd');
        customElements.upgrade(host);
        await (host as MthSuggestionChips).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('respects ancestor dir="rtl" for roving horizontal arrows', async () => {
    const rtlContainer = document.createElement('div');
    rtlContainer.setAttribute('dir', 'rtl');
    const el = document.createElement('mth-suggestion-chips') as MthSuggestionChips;
    el.items = [{ label: 'First' }, { label: 'Second' }];
    rtlContainer.appendChild(el);
    document.body.appendChild(rtlContainer);
    await el.updateComplete;

    const items = el.getItemElements();
    items[0]!.focus();
    items[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
    expect(items[1]!.tabIndex).toBe(0);
  });
});
