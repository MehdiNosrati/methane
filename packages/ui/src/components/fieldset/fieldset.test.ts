import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import '@methane/ui/input';
import { fieldsetSpec } from './fieldset.spec.js';
import { MthFieldset, registerMthFieldset } from './index.js';

describe('<mth-fieldset>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, shadow fieldset/legend structure, and same-root ARIA', async () => {
    const compiled = compileSpec(fieldsetSpec);
    expect(compiled.docs).toContain('`<mth-fieldset>`');

    const report = await runBehaviorSpecAssertions(fieldsetSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const fs = document.createElement('mth-fieldset') as MthFieldset;
    fs.legend = 'Billing Address';
    fs.hint = 'Enter your primary street address';
    fs.error = 'Address verification required';
    document.body.appendChild(fs);
    await fs.updateComplete;

    const nativeFs = fs.shadowRoot!.querySelector('fieldset');
    const legend = fs.shadowRoot!.querySelector('legend');
    expect(nativeFs).not.toBeNull();
    expect(legend?.textContent?.trim()).toBe('Billing Address');
    expect(nativeFs?.getAttribute('aria-describedby')).toBe('mth-fieldset-hint');
    expect(nativeFs?.getAttribute('aria-errormessage')).toBe('mth-fieldset-error');
    expect(nativeFs?.getAttribute('aria-invalid')).toBe('true');

    const aria = scanSameRootAria(fs.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('supports legend/hint/error slots and propagates disabled via FormContext without mutating host attribute', async () => {
    const fs = document.createElement('mth-fieldset') as MthFieldset;
    const customLegend = document.createElement('span');
    customLegend.slot = 'legend';
    customLegend.textContent = 'Account Security';

    const input = document.createElement('mth-input');
    input.setAttribute('label', 'Passphrase');

    fs.append(customLegend, input);
    document.body.appendChild(fs);
    await fs.updateComplete;
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    await Promise.resolve();

    const legendSlot = fs.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="legend"]')!;
    legendSlot.dispatchEvent(new Event('slotchange'));
    await fs.updateComplete;
    expect(fs.shadowRoot!.querySelector('legend')?.hasAttribute('hidden')).toBe(false);

    fs.disabled = true;
    await fs.updateComplete;
    await Promise.resolve();
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    expect(fs.shadowRoot!.querySelector('fieldset')?.disabled).toBe(true);
    expect(input.hasAttribute('disabled')).toBe(false);
    expect(input.shadowRoot!.querySelector('input')?.disabled).toBe(true);
  });

  it('re-subscribes to ancestor FormContext after disconnect/reconnect', async () => {
    const parent = document.createElement('div');
    const hostForm = document.createElement('mth-fieldset') as MthFieldset;
    hostForm.disabled = true;
    const childFs = document.createElement('mth-fieldset') as MthFieldset;
    hostForm.appendChild(childFs);
    parent.appendChild(hostForm);
    document.body.appendChild(parent);

    await hostForm.updateComplete;
    await childFs.updateComplete;
    expect(childFs.isEffectivelyDisabled).toBe(true);

    childFs.remove();
    await childFs.updateComplete;
    expect(childFs.isEffectivelyDisabled).toBe(false);

    hostForm.appendChild(childFs);
    await childFs.updateComplete;
    await Promise.resolve();
    await childFs.updateComplete;
    expect(childFs.isEffectivelyDisabled).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-fieldset legend="Profile" hint="Public info"></mth-fieldset>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-fieldset>', 'hyd-fieldset>')
      .replaceAll('<mth-fieldset', '<hyd-fieldset');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFieldset('hyd');
        customElements.upgrade(host);
        await (host as MthFieldset).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
