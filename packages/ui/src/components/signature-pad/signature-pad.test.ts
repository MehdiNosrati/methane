import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { signaturePadSpec } from './signature-pad.spec.js';
import { MthSignaturePad, registerMthSignaturePad } from './index.js';

describe('<mth-signature-pad>', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,mocksig',
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, draws pointer strokes, and supports undo/clear', async () => {
    const compiled = compileSpec(signaturePadSpec);
    expect(compiled.docs).toContain('`<mth-signature-pad>`');

    let mounted: MthSignaturePad | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-signature-pad') as MthSignaturePad;
        mounted.label = 'Sign here';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const pad = el as MthSignaturePad;
        await pad.updateComplete;
        const input = pad.shadowRoot!.querySelector<HTMLInputElement>('[part="typed-input"]')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await pad.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthSignaturePad).value,
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
        Boolean(el.shadowRoot!.querySelector<HTMLInputElement>('[part="typed-input"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthSignaturePad).checkValidity(),
      defaultValue: '',
      nextValue: 'Jane Doe',
    };

    const specReport = await runBehaviorSpecAssertions(signaturePadSpec, {
      formControl: formControlAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);

    const pad = document.createElement('mth-signature-pad') as MthSignaturePad;
    pad.label = 'Approval';
    document.body.appendChild(pad);
    await pad.updateComplete;

    const canvas = pad.shadowRoot!.querySelector<HTMLCanvasElement>('[part="canvas"]')!;
    const PointerEvt = globalThis.PointerEvent ?? MouseEvent;
    canvas.dispatchEvent(new PointerEvt('pointerdown', { clientX: 10, clientY: 10, bubbles: true }));
    canvas.dispatchEvent(new PointerEvt('pointermove', { clientX: 20, clientY: 15, bubbles: true }));
    canvas.dispatchEvent(new PointerEvt('pointermove', { clientX: 30, clientY: 20, bubbles: true }));
    canvas.dispatchEvent(new PointerEvt('pointermove', { clientX: 35, clientY: 22, bubbles: true }));
    const strokesDuringMove = (pad as unknown as { strokes: Array<Array<unknown>> }).strokes;
    expect(strokesDuringMove.length).toBe(1);
    expect(strokesDuringMove[0]?.length).toBe(4);
    canvas.dispatchEvent(new PointerEvt('pointerup', { clientX: 40, clientY: 25, bubbles: true }));
    await pad.updateComplete;
    expect((pad as unknown as { strokes: unknown[] }).strokes.length).toBe(1);

    expect(pad.isEmpty).toBe(false);
    expect(pad.value).not.toBe('');

    pad.undo();
    await pad.updateComplete;
    expect(pad.isEmpty).toBe(true);

    expect(scanSameRootAria(pad).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-signature-pad label="Signature"></mth-signature-pad>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-signature-pad>', 'hyd-signature-pad>')
      .replaceAll('<mth-signature-pad', '<hyd-signature-pad');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSignaturePad('hyd');
        customElements.upgrade(host);
        await (host as MthSignaturePad).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
