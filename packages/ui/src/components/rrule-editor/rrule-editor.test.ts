import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rruleEditorSpec } from './rrule-editor.spec.js';
import { MthRruleEditor, registerMthRruleEditor } from './index.js';

describe('<mth-rrule-editor>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('passes BehaviorSpec assertions and FormControlSuite conformance', async () => {
    const compiled = compileSpec(rruleEditorSpec);
    expect(compiled.docs).toContain('`<mth-rrule-editor>`');

    let mounted: MthRruleEditor | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-rrule-editor') as MthRruleEditor;
        return mounted;
      },
      defaultValue: '',
      nextValue: 'FREQ=DAILY;INTERVAL=1',
      setValue: async (el: HTMLElement, value: string) => {
        const editor = el as MthRruleEditor;
        await editor.updateComplete;
        const select = editor.shadowRoot!.querySelector<HTMLSelectElement>('[part="frequency"]')!;
        select.value = value ? 'DAILY' : '';
        select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await editor.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthRruleEditor).value,
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
        Boolean((el as MthRruleEditor).shadowRoot!.querySelector<HTMLSelectElement>('[part="frequency"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthRruleEditor).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(rruleEditorSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const fcReport = await FormControlSuite.run(adapter);
    expect(fcReport.passed).toBe(true);
  });

  it('builds weekly BYDAY + COUNT rules, expands occurrences via expandRRule, and passes HydrationPuritySuite', async () => {
    const el = document.createElement('mth-rrule-editor') as MthRruleEditor;
    el.dtstart = '2026-08-03';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).valid).toBe(true);

    const freqSelect = el.shadowRoot!.querySelector<HTMLSelectElement>('[part="frequency"]')!;
    freqSelect.value = 'WEEKLY';
    freqSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;

    const weekdayBtns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="weekday"]');
    weekdayBtns[0]!.click(); // MO
    await el.updateComplete;
    weekdayBtns[2]!.click(); // WE
    await el.updateComplete;

    const endSelect = el.shadowRoot!.querySelector<HTMLSelectElement>('[part="end-mode"]')!;
    endSelect.value = 'count';
    endSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;

    expect(el.value).toBe('FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE;COUNT=5');
    expect(el.shadowRoot!.querySelectorAll('[part="preview"] li').length).toBeGreaterThan(0);

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-rrule-editor value="FREQ=DAILY;INTERVAL=2"></mth-rrule-editor>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    const ssrHtml = rawSsr
      .replaceAll('mth-rrule-editor>', 'hyd-rrule-editor>')
      .replaceAll('<mth-rrule-editor', '<hyd-rrule-editor');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthRruleEditor('hyd');
        customElements.upgrade(host);
        await (host as MthRruleEditor).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
