import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/field';
import '@methane-ui/ui/radio';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthRadioGroup, radioGroupSpec, registerMthRadioGroup } from './index.js';

function createRadio(value: string, label: string, disabled = false): HTMLElement {
  const r = document.createElement('mth-radio');
  r.setAttribute('value', value);
  if (disabled) r.setAttribute('disabled', '');
  r.textContent = label;
  return r;
}

describe('<mth-radio-group>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(radioGroupSpec);
    expect(compiled.tests).toContain('<mth-radio-group>');
    expect(compiled.docs).toContain('`<mth-radio-group>`');

    let mountedGroup: MthRadioGroup | null = null;
    const formAdapter = {
      defaultValue: '',
      nextValue: 'pro',
      mount: () => {
        mountedGroup = document.createElement('mth-radio-group') as MthRadioGroup;
        mountedGroup.label = 'Plan';
        mountedGroup.append(createRadio('free', 'Free'), createRadio('pro', 'Pro'));
        return mountedGroup;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const rg = el as MthRadioGroup;
        await rg.updateComplete;
        if (value.length === 0) {
          rg.value = '';
        } else {
          const target = Array.from(rg.children).find(
            (c) => c.getAttribute('value') === value,
          ) as HTMLElement | undefined;
          target?.click();
        }
        await rg.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthRadioGroup).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedGroup) return null;
        return mountedGroup.effectivelyDisabled ? null : mountedGroup.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        (el as MthRadioGroup).shadowRoot!.querySelector('[role="radiogroup"]')?.getAttribute('aria-disabled') ===
        'true',
      isRequiredInvalid: (el: HTMLElement) => !(el as MthRadioGroup).checkValidity(),
    };

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir?: 'ltr' | 'rtl') => {
        const rg = document.createElement('mth-radio-group') as MthRadioGroup;
        rg.label = 'Choices';
        rg.orientation = 'horizontal';
        if (dir) rg.setAttribute('dir', dir);
        rg.append(
          createRadio('a', 'Alpha'),
          createRadio('b', 'Beta'),
          createRadio('c', 'Gamma'),
        );
        document.body.appendChild(rg);
        await rg.updateComplete;
        return rg;
      },
      getItems: (container: HTMLElement) => Array.from(container.children) as HTMLElement[],
    };

    const specReport = await runBehaviorSpecAssertions(radioGroupSpec, {
      formControl: formAdapter,
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneForm = await FormControlSuite.run(formAdapter);
    expect(standaloneForm.failures).toEqual([]);
    expect(standaloneForm.passed).toBe(true);

    const standaloneRoving = await RovingFocusSuite.run(rovingAdapter);
    expect(standaloneRoving.failures).toEqual([]);
    expect(standaloneRoving.passed).toBe(true);
  });

  it('roves focus and updates selection on Arrow keys while skipping disabled radios', async () => {
    const rg = document.createElement('mth-radio-group') as MthRadioGroup;
    rg.label = 'Size';
    rg.orientation = 'vertical';
    const r1 = createRadio('sm', 'Small');
    const r2 = createRadio('md', 'Medium', true);
    const r3 = createRadio('lg', 'Large');
    rg.append(r1, r2, r3);
    document.body.appendChild(rg);
    await rg.updateComplete;

    const changes: string[] = [];
    rg.addEventListener('mth-change', (ev) => {
      changes.push((ev as CustomEvent<{ value: string }>).detail.value);
    });

    r1.focus();
    r1.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await rg.updateComplete;

    expect(rg.value).toBe('lg');
    expect(changes).toEqual(['lg']);
    expect((r3 as HTMLElement & { checked: boolean }).checked).toBe(true);
    expect(scanSameRootAria(rg).valid).toBe(true);
  });

  it('consumes FieldContext from <mth-field>', async () => {
    const field = document.createElement('mth-field') as HTMLElement & {
      label: string;
      hint: string;
      required: boolean;
      updateComplete: Promise<boolean>;
    };
    field.label = 'Billing cycle';
    field.hint = 'Choose annual to save 20%';
    field.required = true;

    const rg = document.createElement('mth-radio-group') as MthRadioGroup;
    rg.append(createRadio('monthly', 'Monthly'), createRadio('annual', 'Annual'));
    field.appendChild(rg);
    document.body.appendChild(field);

    await field.updateComplete;
    await rg.updateComplete;

    expect(rg.shadowRoot!.querySelector('#mth-rg-label')?.textContent?.trim()).toContain(
      'Billing cycle',
    );
    expect(rg.checkValidity()).toBe(false);
    expect(scanSameRootAria(field).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-radio-group label="Theme" value="dark"></mth-radio-group>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-radio-group>', 'hyd-radio-group>')
      .replaceAll('<mth-radio-group', '<hyd-radio-group');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthRadioGroup('hyd');
        customElements.upgrade(host);
        await (host as MthRadioGroup).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
