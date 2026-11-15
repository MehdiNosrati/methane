import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { screenRecorderSpec } from './screen-recorder.spec.js';
import { MthScreenRecorder, registerMthScreenRecorder } from './index.js';

describe('<mth-screen-recorder>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + same-root ARIA', async () => {
    const compiled = compileSpec(screenRecorderSpec);
    expect(compiled.docs).toContain('`<mth-screen-recorder>`');

    const satelliteAdapter = {
      createElement: () => document.createElement('mth-screen-recorder') as MthScreenRecorder,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthScreenRecorder).engine?.getThemeToken(tokenName) ?? '',
    };

    const report = await runBehaviorSpecAssertions(screenRecorderSpec, {
      satellite: satelliteAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.passed).toBe(true);
  });

  it('toggles systemAudio, starts/pauses/resumes/stops recording, and emits payload', async () => {
    const rec = document.createElement('mth-screen-recorder') as MthScreenRecorder;
    document.body.appendChild(rec);
    await rec.updateComplete;

    const checkbox = rec.shadowRoot!.querySelector<HTMLInputElement>('.audio-check')!;
    expect(checkbox.checked).toBe(true);
    checkbox.click();
    await rec.updateComplete;
    expect(rec.systemAudio).toBe(false);
    expect(rec.engine?.systemAudio).toBe(false);

    await rec.startRecording();
    expect(rec.engine?.state).toBe('recording');
    rec.pauseRecording();
    expect(rec.engine?.state).toBe('paused');
    rec.resumeRecording();
    expect(rec.engine?.state).toBe('recording');

    const res = rec.stopRecording();
    await rec.updateComplete;
    expect(res).toBeTruthy();
    expect(res!.systemAudio).toBe(false);
    expect(rec.engine?.state).toBe('stopped');
    expect(scanSameRootAria(rec.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM with fallback slot', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-screen-recorder label="Demo capture"><p slot="fallback">Screen share unavailable</p></mth-screen-recorder>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-screen-recorder>', 'hyd-screen-recorder>')
      .replaceAll('<mth-screen-recorder', '<hyd-screen-recorder');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthScreenRecorder('hyd');
        customElements.upgrade(host);
        await (host as MthScreenRecorder).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
