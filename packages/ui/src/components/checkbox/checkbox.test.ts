import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane/ui/field';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthCheckbox, checkboxSpec, registerMthCheckbox } from './index.js';

describe('<mth-checkbox>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite conformance, and same-root ARIA', async () => {
    const compiled = compileSpec(checkboxSpec);
    expect(compiled.tests).toContain('<mth-checkbox>');
    expect(compiled.docs).toContain('`<mth-checkbox>`');

    let mountedCheckbox: MthCheckbox | null = null;
    const adapter = {
      defaultValue: '',
      nextValue: 'on',
      mount: () => {
        mountedCheckbox = document.createElement('mth-checkbox') as MthCheckbox;
        mountedCheckbox.label = 'Accept terms';
        return mountedCheckbox;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const cb = el as MthCheckbox;
        await cb.updateComplete;
        const shouldCheck = value.length > 0;
        if (cb.checked !== shouldCheck) {
          cb.shadowRoot!.querySelector<HTMLButtonElement>('#mth-checkbox-control')!.click();
        }
        await cb.updateComplete;
      },
      getValue: (el: HTMLElement) => {
        const cb = el as MthCheckbox;
        return cb.checked ? cb.value || 'on' : '';
      },
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedCheckbox) return null;
        if (mountedCheckbox.effectivelyDisabled || !mountedCheckbox.checked) return null;
        return mountedCheckbox.value || 'on';
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthCheckbox).shadowRoot!.querySelector<HTMLButtonElement>('#mth-checkbox-control')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthCheckbox).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(checkboxSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneReport = await FormControlSuite.run(adapter);
    expect(standaloneReport.failures).toEqual([]);
    expect(standaloneReport.passed).toBe(true);
  });

  it('supports tri-state indeterminate, Space toggle, :state(checked), :state(indeterminate), and readonly', async () => {
    const cb = document.createElement('mth-checkbox') as MthCheckbox;
    cb.textContent = 'Select all';
    cb.indeterminate = true;
    document.body.appendChild(cb);
    await cb.updateComplete;

    const btn = cb.shadowRoot!.querySelector<HTMLButtonElement>('#mth-checkbox-control')!;
    expect(cb.hasCustomState('indeterminate')).toBe(true);
    expect(cb.hasCustomState('checked')).toBe(false);
    expect(btn.getAttribute('aria-checked')).toBe('mixed');
    expect(scanSameRootAria(cb).valid).toBe(true);

    const events: Array<{ checked: boolean; indeterminate: boolean }> = [];
    cb.addEventListener('mth-change', (ev) => {
      events.push((ev as CustomEvent<{ checked: boolean; indeterminate: boolean }>).detail);
    });

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await cb.updateComplete;

    expect(cb.checked).toBe(true);
    expect(cb.indeterminate).toBe(false);
    expect(cb.hasCustomState('checked')).toBe(true);
    expect(cb.hasCustomState('indeterminate')).toBe(false);
    expect(btn.getAttribute('aria-checked')).toBe('true');
    expect(events).toEqual([{ checked: true, indeterminate: false, value: 'on' }]);

    cb.readonly = true;
    await cb.updateComplete;
    btn.click();
    await cb.updateComplete;
    expect(cb.checked).toBe(true);
  });

  it('consumes FieldContext from <mth-field> and supports external <label for>', async () => {
    const extLabel = document.createElement('label');
    extLabel.htmlFor = 'ext-cb';
    extLabel.textContent = 'External Checkbox Label';

    const field = document.createElement('mth-field') as HTMLElement & {
      label: string;
      required: boolean;
      updateComplete: Promise<boolean>;
    };
    field.label = 'Agreement';
    field.required = true;

    const cb = document.createElement('mth-checkbox') as MthCheckbox;
    cb.id = 'ext-cb';
    field.appendChild(cb);
    document.body.append(extLabel, field);

    await field.updateComplete;
    await cb.updateComplete;

    expect(cb.labels?.length).toBe(1);
    expect(cb.checkValidity()).toBe(false);
    expect(scanSameRootAria(field).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-checkbox label="Subscribe" checked></mth-checkbox>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    expect(rawSsr).toContain('shadowrootdelegatesfocus');

    const ssrHtml = rawSsr
      .replaceAll('mth-checkbox>', 'hyd-checkbox>')
      .replaceAll('<mth-checkbox', '<hyd-checkbox');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCheckbox('hyd');
        customElements.upgrade(host);
        await (host as MthCheckbox).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
