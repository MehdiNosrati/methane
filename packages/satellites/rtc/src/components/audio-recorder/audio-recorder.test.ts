import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { audioRecorderSpec, MthAudioRecorder, registerMthAudioRecorder } from './index.js';

describe('<mth-audio-recorder>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + same-root ARIA', async () => {
    const compiled = compileSpec(audioRecorderSpec);
    expect(compiled.docs).toContain('`<mth-audio-recorder>`');

    const satelliteAdapter = {
      createElement: () => document.createElement('mth-audio-recorder') as MthAudioRecorder,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthAudioRecorder).engine?.getThemeToken(tokenName) ?? '',
    };

    const report = await runBehaviorSpecAssertions(audioRecorderSpec, {
      satellite: satelliteAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.passed).toBe(true);
  });

  it('transitions start, pause, resume, level meter, and stop cleanly', async () => {
    const rec = document.createElement('mth-audio-recorder') as MthAudioRecorder;
    document.body.appendChild(rec);
    await rec.updateComplete;

    const states: string[] = [];
    rec.addEventListener('mth-state-change', (ev: Event) => {
      states.push((ev as CustomEvent<{ state: string }>).detail.state);
    });

    await rec.startRecording();
    rec.updateInputLevel(0.64);
    await rec.updateComplete;
    expect(rec.engine?.state).toBe('recording');
    expect(rec.shadowRoot!.querySelector('[part="meter"]')?.getAttribute('aria-valuenow')).toBe('64');

    rec.pauseRecording();
    await rec.updateComplete;
    expect(rec.engine?.state).toBe('paused');

    rec.resumeRecording();
    await rec.updateComplete;
    expect(rec.engine?.state).toBe('recording');

    const result = rec.stopRecording();
    await rec.updateComplete;
    expect(result).toBeTruthy();
    expect(rec.engine?.state).toBe('stopped');
    expect(states).toEqual(['recording', 'paused', 'recording', 'stopped']);
    expect(scanSameRootAria(rec.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM with fallback slot', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-audio-recorder label="Voice memo"><p slot="fallback">Microphone unavailable</p></mth-audio-recorder>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-audio-recorder>', 'hyd-audio-recorder>')
      .replaceAll('<mth-audio-recorder', '<hyd-audio-recorder');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAudioRecorder('hyd');
        customElements.upgrade(host);
        await (host as MthAudioRecorder).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
