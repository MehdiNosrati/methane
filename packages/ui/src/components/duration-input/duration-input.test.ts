import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { durationInputSpec } from './duration-input.spec.js';
import { MthDurationInput, registerMthDurationInput } from './index.js';

describe('<mth-duration-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite and syncs hours/minutes/seconds into ISO PT durations', async () => {
    const compiled = compileSpec(durationInputSpec);
    expect(compiled.docs).toContain('`<mth-duration-input>`');

    let mounted: MthDurationInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-duration-input') as MthDurationInput;
        mounted.label = 'Timeout';
        mounted.value = 'PT0H15M0S';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const dur = el as MthDurationInput;
        await dur.updateComplete;
        if (value === 'PT2H30M0S') {
          const hours = dur.shadowRoot!.querySelector('[part="hours"]') as HTMLInputElement;
          const mins = dur.shadowRoot!.querySelector('[part="minutes"]') as HTMLInputElement;
          hours.value = '2';
          hours.dispatchEvent(new Event('change', { bubbles: true }));
          mins.value = '30';
          mins.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          dur.value = value;
        }
        await dur.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthDurationInput).value,
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
        Boolean((el.shadowRoot!.querySelector('[part="hours"]') as HTMLInputElement)?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthDurationInput).checkValidity(),
      defaultValue: 'PT0H15M0S',
      nextValue: 'PT2H30M0S',
    };

    const specReport = await runBehaviorSpecAssertions(durationInputSpec, {
      formControl: adapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(adapter);
    expect(formReport.failures).toEqual([]);

    const dur = document.createElement('mth-duration-input') as MthDurationInput;
    dur.value = 'PT1H30M15S';
    document.body.appendChild(dur);
    await dur.updateComplete;
    expect(dur.totalSeconds).toBe(5415);
    expect(scanSameRootAria(dur).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-duration-input value="PT1H0M0S" label="TTL"></mth-duration-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-duration-input>', 'hyd-duration-input>')
      .replaceAll('<mth-duration-input', '<hyd-duration-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDurationInput('hyd');
        customElements.upgrade(host);
        await (host as MthDurationInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
