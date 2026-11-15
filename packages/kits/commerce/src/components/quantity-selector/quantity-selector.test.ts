import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthQuantitySelector, quantitySelectorSpec, registerMthQuantitySelector } from './index.js';

describe('<mth-quantity-selector>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, clamps min/max, and handles stepper & arrow keys', async () => {
    const report = await runBehaviorSpecAssertions(quantitySelectorSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-quantity-selector') as MthQuantitySelector;
    el.min = 1;
    el.max = 3;
    el.value = 1;
    document.body.append(el);
    await el.updateComplete;

    const events: number[] = [];
    el.addEventListener('mth-change', (e) => {
      events.push((e as CustomEvent<{ value: number }>).detail.value);
    });

    const incBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="increment"]')!;
    const decBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="decrement"]')!;
    const inputEl = el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;

    expect(decBtn.disabled).toBe(true);
    incBtn.click();
    await el.updateComplete;
    expect(el.value).toBe(2);
    expect(events).toEqual([2]);

    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe(3);
    expect(incBtn.disabled).toBe(true);
    expect(el.hasCustomState('max')).toBe(true);

    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe(2);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes FormControlSuite', async () => {
    let mounted: MthQuantitySelector | null = null;
    const fc = await FormControlSuite.run({
      mount: async () => {
        mounted = document.createElement('mth-quantity-selector') as MthQuantitySelector;
        mounted.value = 1;
        return mounted;
      },
      defaultValue: '1',
      nextValue: '4',
      setValue: async (el, val) => {
        (el as MthQuantitySelector).value = Number(val);
        await (el as MthQuantitySelector).updateComplete;
      },
      getValue: (el) => String((el as MthQuantitySelector).clampedValue),
      getFormDataValue: (fd, name) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return String(nativeVal);
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.effectivelyDisabled ? null : String(mounted.clampedValue);
      },
      getInternalDisabled: (el) =>
        el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.disabled,
    });
    expect(fc.failures).toEqual([]);
    expect(fc.passed).toBe(true);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthQuantitySelector();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-quantity-selector value="2" min="1" max="10"></mth-quantity-selector>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-quantity-selector>', 'hyd-quantity-selector>')
      .replaceAll('<mth-quantity-selector', '<hyd-quantity-selector');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthQuantitySelector('hyd');
        customElements.upgrade(host);
        await (host as MthQuantitySelector).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });

  it('restores clampedValue on empty input and preserves fractional steps', async () => {
    const el = document.createElement('mth-quantity-selector') as MthQuantitySelector;
    el.min = 0.5;
    el.max = 5;
    el.step = 0.5;
    el.value = 1.5;
    document.body.append(el);
    await el.updateComplete;

    const inputEl = el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    inputEl.value = '';
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe(1.5);
    expect(inputEl.value).toBe('1.5');

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="increment"]')!.click();
    await el.updateComplete;
    expect(el.value).toBe(2);
  });
});
