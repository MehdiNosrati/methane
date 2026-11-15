import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthTagInput, registerMthTagInput, tagInputSpec } from './index.js';

describe('<mth-tag-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(tagInputSpec);
    expect(compiled.tests).toContain('<mth-tag-input>');

    let mounted: MthTagInput | null = null;
    const specReport = await runBehaviorSpecAssertions(tagInputSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-tag-input') as MthTagInput;
          mounted.label = 'Keywords';
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthTagInput).value = val;
          await (el as MthTagInput).updateComplete;
        },
        getValue: (el) => (el as MthTagInput).value,
        nextValue: 'alpha,beta',
        getFormDataValue: (formData, name) => {
          const nativeVal = formData.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mounted) return null;
          return mounted.isEffectivelyDisabled ? null : mounted.value;
        },
        getInternalDisabled: (el) =>
          Boolean((el as MthTagInput).shadowRoot!.querySelector('input')?.disabled),
        isRequiredInvalid: (el) => !(el as MthTagInput).checkValidity(),
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-tag-input') as MthTagInput;
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthTagInput).value = val;
        await (el as MthTagInput).updateComplete;
      },
      getValue: (el) => (el as MthTagInput).value,
      nextValue: 'one,two',
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.isEffectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el) =>
        Boolean((el as MthTagInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el) => !(el as MthTagInput).checkValidity(),
    });
    expect(standalone.passed).toBe(true);

    expect(scanSameRootAria(mounted!.shadowRoot!).issues).toEqual([]);
  });

  it('adds tags on Enter and delimiter, guards duplicates/maxTags, and removes via Backspace/button', async () => {
    const ti = document.createElement('mth-tag-input') as MthTagInput;
    ti.maxTags = 3;
    document.body.appendChild(ti);
    await ti.updateComplete;

    const input = ti.shadowRoot!.querySelector<HTMLInputElement>('#mth-ti-input')!;
    input.value = 'css';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await ti.updateComplete;
    expect(ti.values).toEqual(['css']);

    input.value = 'css';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await ti.updateComplete;
    expect(ti.values).toEqual(['css']);

    input.value = 'html,aria,';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await ti.updateComplete;
    expect(ti.values).toEqual(['css', 'html', 'aria']);

    expect(ti.addTag('extra')).toBe(false);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await ti.updateComplete;
    expect(ti.values).toEqual(['css', 'html']);

    ti.shadowRoot!.querySelector<HTMLButtonElement>('[part="tag-remove"]')!.click();
    await ti.updateComplete;
    expect(ti.values).toEqual(['html']);
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthTagInput();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tag-input name="tags" label="Tags" value="a,b"></mth-tag-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-tag-input>', 'hyd-tag-input>')
      .replaceAll('<mth-tag-input', '<hyd-tag-input');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTagInput('hyd');
        customElements.upgrade(host);
        await (host as MthTagInput).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
