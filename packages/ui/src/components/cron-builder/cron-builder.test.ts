import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { cronBuilderSpec } from './cron-builder.spec.js';
import { MthCronBuilder, registerMthCronBuilder } from './index.js';

describe('<mth-cron-builder>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, updates via presets and segment inputs, and validates cron syntax', async () => {
    const compiled = compileSpec(cronBuilderSpec);
    expect(compiled.docs).toContain('`<mth-cron-builder>`');

    let mounted: MthCronBuilder | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-cron-builder') as MthCronBuilder;
        mounted.label = 'Cron schedule';
        mounted.value = '0 * * * *';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const cron = el as MthCronBuilder;
        await cron.updateComplete;
        const inputs = Array.from(
          cron.shadowRoot!.querySelectorAll<HTMLInputElement>('[part="field-input"]'),
        );
        if (!value.trim()) {
          for (const input of inputs) {
            input.value = '';
          }
          inputs[0]?.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        } else {
          const parts = value.split(/\s+/);
          parts.forEach((part, idx) => {
            const input = inputs[idx];
            if (input) {
              input.value = part;
              input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            }
          });
        }
        await cron.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthCronBuilder).value,
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
        Boolean(el.shadowRoot!.querySelector<HTMLInputElement>('[part="field-input"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthCronBuilder).checkValidity(),
      defaultValue: '0 * * * *',
      nextValue: '0 9 * * 1-5',
    };

    const specReport = await runBehaviorSpecAssertions(cronBuilderSpec, {
      formControl: formControlAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);

    const cron = document.createElement('mth-cron-builder') as MthCronBuilder;
    cron.label = 'Backup cadence';
    document.body.appendChild(cron);
    await cron.updateComplete;

    let lastChange = '';
    cron.addEventListener('mth-change', (e) => {
      lastChange = (e as CustomEvent<{ value: string }>).detail.value;
    });

    const weekdayPreset = Array.from(
      cron.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="preset"]'),
    ).find((b) => b.textContent?.includes('Weekdays'))!;
    weekdayPreset.click();
    await cron.updateComplete;

    expect(cron.value).toBe('0 9 * * 1-5');
    expect(lastChange).toBe('0 9 * * 1-5');
    expect(cron.shadowRoot!.querySelector('[part="summary"]')?.textContent).toContain('Weekdays');

    const minuteInput = cron.shadowRoot!.querySelector<HTMLInputElement>('#cron-seg-0')!;
    minuteInput.value = 'invalid-token';
    minuteInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await cron.updateComplete;
    expect(cron.checkValidity()).toBe(false);

    expect(scanSameRootAria(cron).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-cron-builder label="Cron" value="0 * * * *"></mth-cron-builder>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-cron-builder>', 'hyd-cron-builder>')
      .replaceAll('<mth-cron-builder', '<hyd-cron-builder');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCronBuilder('hyd');
        customElements.upgrade(host);
        await (host as MthCronBuilder).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
