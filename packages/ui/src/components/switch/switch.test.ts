import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/field';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { switchSpec } from './switch.spec.js';
import { MthSwitch, registerMthSwitch } from './index.js';

describe('<mth-switch>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite conformance, and same-root ARIA', async () => {
    const compiled = compileSpec(switchSpec);
    expect(compiled.tests).toContain('<mth-switch>');
    expect(compiled.docs).toContain('`<mth-switch>`');

    let mountedSwitch: MthSwitch | null = null;
    const adapter = {
      defaultValue: '',
      nextValue: 'on',
      mount: () => {
        mountedSwitch = document.createElement('mth-switch') as MthSwitch;
        mountedSwitch.label = 'Dark mode';
        return mountedSwitch;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const sw = el as MthSwitch;
        await sw.updateComplete;
        const shouldCheck = value.length > 0;
        if (sw.checked !== shouldCheck) {
          sw.shadowRoot!.querySelector<HTMLButtonElement>('#mth-switch-control')!.click();
        }
        await sw.updateComplete;
      },
      getValue: (el: HTMLElement) => {
        const sw = el as MthSwitch;
        return sw.checked ? sw.value || 'on' : '';
      },
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedSwitch) return null;
        if (mountedSwitch.effectivelyDisabled || !mountedSwitch.checked) return null;
        return mountedSwitch.value || 'on';
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthSwitch).shadowRoot!.querySelector<HTMLButtonElement>('#mth-switch-control')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthSwitch).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(switchSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneReport = await FormControlSuite.run(adapter);
    expect(standaloneReport.failures).toEqual([]);
    expect(standaloneReport.passed).toBe(true);
  });

  it('toggles role="switch" aria-checked on Space, Enter, and click', async () => {
    const sw = document.createElement('mth-switch') as MthSwitch;
    sw.textContent = 'Notifications';
    document.body.appendChild(sw);
    await sw.updateComplete;

    const btn = sw.shadowRoot!.querySelector<HTMLButtonElement>('#mth-switch-control')!;
    expect(btn.getAttribute('role')).toBe('switch');
    expect(btn.getAttribute('aria-checked')).toBe('false');
    expect(scanSameRootAria(sw).valid).toBe(true);

    const changes: boolean[] = [];
    sw.addEventListener('mth-change', (ev) => {
      changes.push((ev as CustomEvent<{ checked: boolean }>).detail.checked);
    });

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await sw.updateComplete;
    expect(sw.checked).toBe(true);
    expect(btn.getAttribute('aria-checked')).toBe('true');

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await sw.updateComplete;
    expect(sw.checked).toBe(false);
    expect(btn.getAttribute('aria-checked')).toBe('false');

    expect(changes).toEqual([true, false]);
  });

  it('consumes FieldContext from <mth-field> and supports external <label for>', async () => {
    const extLabel = document.createElement('label');
    extLabel.htmlFor = 'ext-sw';
    extLabel.textContent = 'External Switch';

    const field = document.createElement('mth-field') as HTMLElement & {
      label: string;
      required: boolean;
      updateComplete: Promise<boolean>;
    };
    field.label = 'Auto-save';
    field.required = true;

    const sw = document.createElement('mth-switch') as MthSwitch;
    sw.id = 'ext-sw';
    field.appendChild(sw);
    document.body.append(extLabel, field);

    await field.updateComplete;
    await sw.updateComplete;

    expect(sw.labels?.length).toBe(1);
    expect(sw.checkValidity()).toBe(false);
    expect(scanSameRootAria(field).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-switch label="Telemetry" checked></mth-switch>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    expect(rawSsr).toContain('shadowrootdelegatesfocus');

    const ssrHtml = rawSsr
      .replaceAll('mth-switch>', 'hyd-switch>')
      .replaceAll('<mth-switch', '<hyd-switch');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSwitch('hyd');
        customElements.upgrade(host);
        await (host as MthSwitch).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('handles readonly, disabled, thumb/control shadow parts, and FACE reset/disable callbacks', async () => {
    const sw = document.createElement('mth-switch') as MthSwitch;
    sw.label = 'Sync';
    sw.required = true;
    document.body.appendChild(sw);
    await sw.updateComplete;

    const ctrl = sw.shadowRoot!.querySelector<HTMLButtonElement>('#mth-switch-control')!;
    const thumb = sw.shadowRoot!.querySelector('[part="thumb"]');
    expect(ctrl).not.toBeNull();
    expect(thumb).not.toBeNull();
    expect(sw.checkValidity()).toBe(false);

    sw.readonly = true;
    await sw.updateComplete;
    ctrl.click();
    await sw.updateComplete;
    expect(sw.checked).toBe(false);

    sw.readonly = false;
    await sw.updateComplete;
    ctrl.click();
    await sw.updateComplete;
    expect(sw.checked).toBe(true);
    expect(sw.checkValidity()).toBe(true);
    expect(sw.hasCustomState('checked')).toBe(true);

    sw.formDisabledCallback(true);
    await sw.updateComplete;
    expect(sw.effectivelyDisabled).toBe(true);
    expect(ctrl.disabled).toBe(true);
    sw.formDisabledCallback(false);

    sw.formResetCallback();
    await sw.updateComplete;
    expect(sw.checked).toBe(false);
  });
});
