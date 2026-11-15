import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { inlineEditSpec } from './inline-edit.spec.js';
import { MthInlineEdit, registerMthInlineEdit } from './index.js';

describe('<mth-inline-edit>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite and supports Enter commit + Escape cancel with focus restore', async () => {
    const compiled = compileSpec(inlineEditSpec);
    expect(compiled.docs).toContain('`<mth-inline-edit>`');

    let mounted: MthInlineEdit | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-inline-edit') as MthInlineEdit;
        mounted.label = 'Project title';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const inline = el as MthInlineEdit;
        await inline.startEditing();
        await inline.updateComplete;
        const input = inline.shadowRoot!.querySelector('input')!;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await inline.commit();
        await inline.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthInlineEdit).value,
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
        Boolean(
          (
            el.shadowRoot!.querySelector('input') ??
            el.shadowRoot!.querySelector('button')
          )?.disabled,
        ),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthInlineEdit).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(inlineEditSpec, {
      formControl: adapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const formReport = await FormControlSuite.run(adapter);
    expect(formReport.failures).toEqual([]);

    const el = document.createElement('mth-inline-edit') as MthInlineEdit;
    el.value = 'Initial';
    el.label = 'Title';
    document.body.appendChild(el);
    await el.updateComplete;

    await el.startEditing();
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'Edited';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(el.editing).toBe(false);
    expect(el.value).toBe('Initial');

    await el.startEditing();
    await el.updateComplete;
    const input2 = el.shadowRoot!.querySelector('input')!;
    input2.value = 'Committed';
    input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(el.editing).toBe(false);
    expect(el.value).toBe('Committed');
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-inline-edit value="Alpha" label="Name"></mth-inline-edit>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-inline-edit>', 'hyd-inline-edit>')
      .replaceAll('<mth-inline-edit', '<hyd-inline-edit');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthInlineEdit('hyd');
        customElements.upgrade(host);
        await (host as MthInlineEdit).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
