import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthAddressInput, addressInputSpec, registerMthAddressInput } from './index.js';

describe('<mth-address-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(addressInputSpec);
    expect(compiled.tests).toContain('<mth-address-input>');

    let mounted: MthAddressInput | null = null;
    const sample = JSON.stringify({
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      region: 'OR',
      postalCode: '97477',
      country: 'US',
    });

    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-address-input') as MthAddressInput;
        mounted.label = 'Shipping address';
        return mounted;
      },
      nextValue: sample,
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthAddressInput;
        await host.updateComplete;
        const parsed =
          value.trim().length > 0
            ? (JSON.parse(value) as {
                street: string;
                city: string;
                region: string;
                postalCode: string;
                country: string;
              })
            : { street: '', city: '', region: '', postalCode: '', country: '' };
        const setField = (id: string, val: string) => {
          const inp = host.shadowRoot!.querySelector<HTMLInputElement>(id)!;
          inp.value = val;
          inp.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        };
        setField('#mth-addr-street', parsed.street);
        setField('#mth-addr-city', parsed.city);
        setField('#mth-addr-region', parsed.region);
        setField('#mth-addr-postal', parsed.postalCode);
        setField('#mth-addr-country', parsed.country);
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthAddressInput).value,
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
        Boolean((el as MthAddressInput).shadowRoot!.querySelector<HTMLInputElement>('#mth-addr-street')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthAddressInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(addressInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('tracks structured address subfields, line2 toggle, and required completeness', async () => {
    const el = document.createElement('mth-address-input') as MthAddressInput;
    el.label = 'Billing address';
    el.required = true;
    el.includeLine2 = true;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.shadowRoot!.querySelector('#mth-addr-street2')).not.toBeNull();
    expect(el.checkValidity()).toBe(false);

    const street = el.shadowRoot!.querySelector<HTMLInputElement>('#mth-addr-street')!;
    street.value = '100 Market St';
    street.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);

    el.address = {
      street: '100 Market St',
      street2: 'Suite 400',
      city: 'San Francisco',
      region: 'CA',
      postalCode: '94105',
      country: 'US',
    };
    await el.updateComplete;
    expect(el.checkValidity()).toBe(true);
    expect(el.address.city).toBe('San Francisco');
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-address-input label="Postal Address"></mth-address-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-address-input>', 'hyd-address-input>')
      .replaceAll('<mth-address-input', '<hyd-address-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAddressInput('hyd');
        customElements.upgrade(host);
        await (host as MthAddressInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
