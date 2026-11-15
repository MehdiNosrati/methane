import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { formRepeaterSpec } from './form-repeater.spec.js';
import { MthFormRepeater, registerMthFormRepeater } from './index.js';

describe('<mth-form-repeater>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(formRepeaterSpec);
    expect(compiled.tests).toContain('<mth-form-repeater>');

    let mounted: MthFormRepeater | null = null;
    const sample = JSON.stringify([{ value: 'row-one' }]);

    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-form-repeater') as MthFormRepeater;
        mounted.label = 'Contacts';
        return mounted;
      },
      nextValue: sample,
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthFormRepeater;
        await host.updateComplete;
        if (value.trim().length === 0) {
          host.items = [];
        } else {
          const parsed = JSON.parse(value) as Array<{ value: string }>;
          host.items = [];
          await host.updateComplete;
          host.addRow(parsed[0]);
        }
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthFormRepeater).value,
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
        Boolean((el as MthFormRepeater).shadowRoot!.querySelector<HTMLButtonElement>('[part="add"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthFormRepeater).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(formRepeaterSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('adds, edits, removes, and reorders rows via DragSortController with min/max bounds', async () => {
    const el = document.createElement('mth-form-repeater') as MthFormRepeater;
    el.label = 'Team members';
    el.min = 1;
    el.max = 3;
    el.fields = [{ name: 'email', label: 'Email', type: 'email' }];
    el.items = [{ email: 'alice@example.com' }];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);

    const removeBtn0 = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="remove"]')!;
    expect(removeBtn0.disabled).toBe(true);

    el.addRow({ email: 'bob@example.com' });
    await el.updateComplete;
    expect(el.items.length).toBe(2);

    const reorders: Array<{ fromIndex: number; toIndex: number }> = [];
    el.addEventListener('mth-reorder', (ev) => {
      const detail = (ev as CustomEvent<{ fromIndex: number; toIndex: number }>).detail;
      reorders.push({ fromIndex: detail.fromIndex, toIndex: detail.toIndex });
    });

    el.moveRow(1, 0);
    await el.updateComplete;
    expect(reorders).toEqual([{ fromIndex: 1, toIndex: 0 }]);
    expect(el.items.map((r) => r.email)).toEqual(['bob@example.com', 'alice@example.com']);

    el.addRow({ email: 'carol@example.com' });
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector<HTMLButtonElement>('[part="add"]')?.disabled).toBe(true);

    el.removeRow(0);
    await el.updateComplete;
    expect(el.items.map((r) => r.email)).toEqual(['alice@example.com', 'carol@example.com']);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-form-repeater label="Links" min="0" max="5"></mth-form-repeater>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-form-repeater>', 'hyd-form-repeater>')
      .replaceAll('<mth-form-repeater', '<hyd-form-repeater');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFormRepeater('hyd');
        customElements.upgrade(host);
        await (host as MthFormRepeater).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
