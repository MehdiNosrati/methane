import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { drawingPadSpec } from './drawing-pad.spec.js';
import { MthDrawingPad, registerMthDrawingPad } from './index.js';

describe('<mth-drawing-pad>', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      save: () => {},
      restore: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,mockdraw',
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('supports pointer strokes, keyboard drawing, tool switching, undo, and clear', async () => {
    const compiled = compileSpec(drawingPadSpec);
    expect(compiled.docs).toContain('`<mth-drawing-pad>`');

    const pad = document.createElement('mth-drawing-pad') as MthDrawingPad;
    pad.label = 'Sketchpad';
    document.body.appendChild(pad);
    await pad.updateComplete;

    const canvas = pad.shadowRoot!.querySelector<HTMLCanvasElement>('[part="canvas"]')!;
    const PointerEvt = globalThis.PointerEvent ?? MouseEvent;

    canvas.dispatchEvent(new PointerEvt('pointerdown', { clientX: 20, clientY: 20, bubbles: true }));
    canvas.dispatchEvent(new PointerEvt('pointermove', { clientX: 60, clientY: 45, bubbles: true }));
    canvas.dispatchEvent(new PointerEvt('pointerup', { clientX: 80, clientY: 60, bubbles: true }));
    await pad.updateComplete;
    expect(pad.strokeCount).toBe(1);

    // Keyboard stroke toggle + move + finish
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await pad.updateComplete;
    expect(pad.strokeCount).toBe(2);

    const buttons = Array.from(
      pad.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="tool-button"]'),
    );
    buttons[1]!.click();
    await pad.updateComplete;
    expect(pad.tool).toBe('eraser');

    pad.undo();
    await pad.updateComplete;
    expect(pad.strokeCount).toBe(1);

    pad.clear();
    await pad.updateComplete;
    expect(pad.strokeCount).toBe(0);

    expect(scanSameRootAria(pad).issues).toEqual([]);
    const specReport = await runBehaviorSpecAssertions(drawingPadSpec, {});
    expect(specReport.failures).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-drawing-pad label="Canvas"></mth-drawing-pad>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-drawing-pad>', 'hyd-drawing-pad>')
      .replaceAll('<mth-drawing-pad', '<hyd-drawing-pad');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDrawingPad('hyd');
        customElements.upgrade(host);
        await (host as MthDrawingPad).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
