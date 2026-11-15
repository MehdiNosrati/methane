import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { audioPlayerSpec, MthAudioPlayer, registerMthAudioPlayer } from './index.js';

describe('<mth-audio-player>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and same-root ARIA', async () => {
    const compiled = compileSpec(audioPlayerSpec);
    expect(compiled.tests).toContain('<mth-audio-player>');

    const specReport = await runBehaviorSpecAssertions(audioPlayerSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-audio-player') as MthAudioPlayer;
    el.src = 'https://example.com/podcast.mp3';
    el.title = 'Episode 1';
    el.artist = 'Methane';
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('audio')).toBeTruthy();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('rejects unsafe URLs and supports play/pause/mute/rate controls', async () => {
    const el = document.createElement('mth-audio-player') as MthAudioPlayer;
    el.src = 'javascript:alert(1)';
    document.body.append(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('audio')).toBeNull();

    el.src = 'https://example.com/track.mp3';
    await el.updateComplete;

    const events: string[] = [];
    el.addEventListener('mth-play', () => events.push('play'));
    el.addEventListener('mth-pause', () => events.push('pause'));

    const playBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="play-button"]')!;
    playBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    expect(events).toContain('play');

    playBtn.click();
    await el.updateComplete;
    expect(events).toContain('pause');

    const rateBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="rate-button"]')!;
    rateBtn.click();
    await el.updateComplete;
    expect(el.playbackRate).toBe(1.25);

    const muteBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="mute-button"]')!;
    muteBtn.click();
    await el.updateComplete;
    expect(el.muted).toBe(true);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthAudioPlayer();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-audio-player src="https://example.com/track.mp3" title="Episode 1"></mth-audio-player>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-audio-player>', 'hyd-audio-player>')
      .replaceAll('<mth-audio-player', '<hyd-audio-player');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAudioPlayer('hyd');
        customElements.upgrade(host);
        await (host as MthAudioPlayer).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
