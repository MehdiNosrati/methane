import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthSearchInput, registerMthSearchInput, searchInputSpec } from './index.js';

describe('<mth-search-input>', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(searchInputSpec);
    expect(compiled.tests).toContain('<mth-search-input>');

    let mounted: MthSearchInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-search-input') as MthSearchInput;
        mounted.label = 'Search catalog';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthSearchInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthSearchInput).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.effectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthSearchInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthSearchInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(searchInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('debounces mth-search, triggers immediate Enter search, and clears via button or Escape', async () => {
    vi.useFakeTimers();
    const el = document.createElement('mth-search-input') as MthSearchInput;
    el.label = 'Filter';
    el.shortcut = '⌘K';
    el.debounce = 200;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('[part="shortcut"]')?.textContent).toBe('⌘K');
    expect(scanSameRootAria(el).issues).toEqual([]);

    const searches: string[] = [];
    let clears = 0;
    el.addEventListener('mth-search', (ev) => searches.push((ev as CustomEvent<{ value: string }>).detail.value));
    el.addEventListener('mth-clear', () => {
      clears += 1;
    });

    const native = el.shadowRoot!.querySelector('input')!;
    native.value = 'methane';
    native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(searches).toEqual([]);
    expect(el.shadowRoot!.querySelector('[part="shortcut"]')).toBeNull();

    vi.advanceTimersByTime(200);
    expect(searches).toEqual(['methane']);

    native.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(searches).toEqual(['methane', 'methane']);

    const clearBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="clear"]');
    expect(clearBtn).not.toBeNull();
    clearBtn!.click();
    await el.updateComplete;
    expect(el.value).toBe('');
    expect(clears).toBe(1);
    expect(searches).toEqual(['methane', 'methane', '']);

    native.value = 'esc-test';
    native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    native.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('');
    expect(clears).toBe(2);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-search-input label="Search docs" placeholder="Type keyword" shortcut="/"></mth-search-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-search-input>', 'hyd-search-input>')
      .replaceAll('<mth-search-input', '<hyd-search-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSearchInput('hyd');
        customElements.upgrade(host);
        await (host as MthSearchInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
