import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthToggleGroup, registerMthToggleGroup, toggleGroupSpec } from './index.js';

describe('<mth-toggle-group>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(toggleGroupSpec);
    expect(compiled.tests).toContain('<mth-toggle-group>');

    let mounted: MthToggleGroup | null = null;
    const specReport = await runBehaviorSpecAssertions(toggleGroupSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-toggle-group') as MthToggleGroup;
          mounted.label = 'Alignment';
          mounted.options = [
            { value: 'start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'end', label: 'End' },
          ];
          return mounted;
        },
        setValue: async (el, value) => {
          const tg = el as MthToggleGroup;
          await tg.updateComplete;
          const btn = Array.from(tg.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="item"]')).find(
            (b) => b.textContent?.trim().toLowerCase() === value.toLowerCase(),
          );
          if (btn) {
            btn.click();
          } else {
            tg.value = value;
          }
          await tg.updateComplete;
        },
        getValue: (el) => (el as MthToggleGroup).value,
        nextValue: 'center',
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
          Array.from((el as MthToggleGroup).shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="item"]')).every(
            (b) => b.disabled,
          ),
        isRequiredInvalid: (el) => !(el as MthToggleGroup).checkValidity(),
      },
      rovingFocus: {
        mount: async (dir) => {
          const tg = document.createElement('mth-toggle-group') as MthToggleGroup;
          if (dir) tg.setAttribute('dir', dir);
          tg.options = [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
            { value: 'c', label: 'C' },
          ];
          document.body.appendChild(tg);
          await tg.updateComplete;
          return tg;
        },
        getItems: (el) =>
          Array.from((el as MthToggleGroup).shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')),
        orientation: 'horizontal',
        loop: true,
      },
    });
    expect(specReport.passed).toBe(true);

    const standaloneFc = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-toggle-group') as MthToggleGroup;
        mounted.options = [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ];
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthToggleGroup).value = val;
        await (el as MthToggleGroup).updateComplete;
      },
      getValue: (el) => (el as MthToggleGroup).value,
      nextValue: 'b',
      getFormDataValue: (fd, name) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.isEffectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el) =>
        (el as MthToggleGroup).shadowRoot!.querySelector<HTMLButtonElement>('[part="item"]')?.disabled ?? false,
    });
    expect(standaloneFc.passed).toBe(true);

    const rovingRtl = await RovingFocusSuite.run({
      mount: async (dir) => {
        const tg = document.createElement('mth-toggle-group') as MthToggleGroup;
        if (dir) tg.setAttribute('dir', dir);
        tg.options = [
          { value: '1', label: 'One' },
          { value: '2', label: 'Two' },
        ];
        document.body.appendChild(tg);
        await tg.updateComplete;
        return tg;
      },
      getItems: (el) =>
        Array.from((el as MthToggleGroup).shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rovingRtl.passed).toBe(true);
  });

  it('supports multiple mode, Light-DOM options, and DSD HydrationPuritySuite', async () => {
    registerMthToggleGroup();
    const tg = document.createElement('mth-toggle-group') as MthToggleGroup;
    tg.multiple = true;
    const opt1 = document.createElement('button');
    opt1.setAttribute('value', 'bold');
    opt1.textContent = 'Bold';
    const opt2 = document.createElement('button');
    opt2.setAttribute('value', 'italic');
    opt2.textContent = 'Italic';
    tg.append(opt1, opt2);
    document.body.appendChild(tg);
    await tg.updateComplete;

    const buttons = tg.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="item"]');
    buttons[0]!.click();
    buttons[1]!.click();
    await tg.updateComplete;
    expect(tg.value).toBe('bold,italic');
    expect(scanSameRootAria(tg).valid).toBe(true);

    const rawSsr = await renderLitDsdHtml(litHtml`
      <mth-toggle-group label="Styles" value="bold"></mth-toggle-group>
    `);
    const ssrHtml = rawSsr
      .replaceAll('mth-toggle-group>', 'hyd-toggle-group>')
      .replaceAll('<mth-toggle-group', '<hyd-toggle-group');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthToggleGroup('hyd');
        customElements.upgrade(host);
        await (host as MthToggleGroup).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
