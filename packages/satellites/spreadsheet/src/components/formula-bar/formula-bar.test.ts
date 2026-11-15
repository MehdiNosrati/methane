import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { formulaBarSpec } from './formula-bar.spec.js';
import { MthFormulaBar, registerMthFormulaBar } from './index.js';

describe('<mth-formula-bar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, SatelliteEngineSuite, and AST dependency parsing', async () => {
    const compiled = compileSpec(formulaBarSpec);
    expect(compiled.tests).toContain('<mth-formula-bar>');

    let mountedBar: MthFormulaBar | null = null;
    const formControlAdapter = {
      mount: async () => {
        mountedBar = document.createElement('mth-formula-bar') as MthFormulaBar;
        mountedBar.name = 'formula';
        mountedBar.value = '=1+1';
        mountedBar.required = true;
        return mountedBar;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const ctrl = el as MthFormulaBar;
        await ctrl.updateComplete;
        const input = ctrl.shadowRoot!.querySelector<HTMLInputElement>('.formula-input')!;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await ctrl.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthFormulaBar).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedBar) return null;
        return mountedBar.isEffectiveDisabled ? null : mountedBar.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthFormulaBar).shadowRoot!.querySelector<HTMLInputElement>('.formula-input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthFormulaBar).checkValidity(),
      name: 'formula',
      defaultValue: '=1+1',
      nextValue: '=SUM(A1:A2)',
    };

    const specReport = await runBehaviorSpecAssertions(formulaBarSpec, {
      formControl: formControlAdapter,
      satellite: {
        createElement: () => document.createElement('mth-formula-bar') as MthFormulaBar,
        readAppliedToken: (el, tokenName) =>
          (el as MthFormulaBar).engine?.getAppliedToken(tokenName) ?? '',
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);
    expect(formReport.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-formula-bar') as MthFormulaBar,
      readAppliedToken: (el, tokenName) =>
        (el as MthFormulaBar).engine?.getAppliedToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const el = document.createElement('mth-formula-bar') as MthFormulaBar;
    el.cellAddress = 'C4';
    el.value = '=SUM(A1:A3)';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.engine!.getDependencies()).toEqual(['A1', 'A2', 'A3']);
    expect(el.engine!.isFormulaSyntaxValid()).toBe(true);

    const commits: unknown[] = [];
    el.addEventListener('mth-formula-commit', (ev) => commits.push((ev as CustomEvent).detail));
    el.shadowRoot!.querySelector<HTMLButtonElement>('.commit-btn')!.click();
    expect(commits).toEqual([{ cellAddress: 'C4', value: '=SUM(A1:A3)', valid: true }]);

    el.value = '=SUM(';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.formula-input')!;
    const errEl = el.shadowRoot!.querySelector<HTMLElement>('#mth-fb-error')!;
    expect(errEl).not.toBeNull();
    expect(errEl.getAttribute('part')).toBe('error');
    expect(errEl.getAttribute('role')).toBe('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-errormessage')).toBe('mth-fb-error');
    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.hasCustomState('invalid')).toBe(true);

    el.readonly = true;
    el.disabled = true;
    await el.updateComplete;
    expect(el.hasCustomState('readonly')).toBe(true);
    expect(el.hasCustomState('disabled')).toBe(true);
  });

  it('emits mth-formula-input with AST dependencies on typing and commits on Enter', async () => {
    registerMthFormulaBar();
    const el = document.createElement('mth-formula-bar') as MthFormulaBar;
    el.cellAddress = 'D5';
    document.body.appendChild(el);
    await el.updateComplete;

    const inputs: unknown[] = [];
    const commits: unknown[] = [];
    el.addEventListener('mth-formula-input', (ev) => inputs.push((ev as CustomEvent).detail));
    el.addEventListener('mth-formula-commit', (ev) => commits.push((ev as CustomEvent).detail));

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.formula-input')!;
    input.value = '=A1+B2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(inputs).toEqual([{ cellAddress: 'D5', value: '=A1+B2', dependencies: ['A1', 'B2'] }]);
    expect(el.hasCustomState('formula')).toBe(true);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(commits).toEqual([{ cellAddress: 'D5', value: '=A1+B2', valid: true }]);
  });

  it('reverts draft value to last committed value on Escape', async () => {
    registerMthFormulaBar();
    const el = document.createElement('mth-formula-bar') as MthFormulaBar;
    el.value = '=10+20';
    document.body.appendChild(el);
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.formula-input')!;
    input.value = '=999';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.value).toBe('=999');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(el.value).toBe('=10+20');
  });

  it('blocks input edits and disables commit button when readonly or disabled', async () => {
    registerMthFormulaBar();
    const el = document.createElement('mth-formula-bar') as MthFormulaBar;
    el.value = 'initial';
    el.readonly = true;
    document.body.appendChild(el);
    await el.updateComplete;

    const commitBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('.commit-btn')!;
    expect(commitBtn.disabled).toBe(true);

    const commits: unknown[] = [];
    el.addEventListener('mth-formula-commit', (ev) => commits.push((ev as CustomEvent).detail));
    commitBtn.click();
    expect(commits).toEqual([]);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-formula-bar cell-address="B2" value="=SUM(A1:A2)"><span slot="fallback">Formula fallback</span></mth-formula-bar>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-formula-bar>', 'hyd-formula-bar>')
      .replaceAll('<mth-formula-bar', '<hyd-formula-bar');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFormulaBar('hyd');
        customElements.upgrade(host);
        await (host as MthFormulaBar).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
