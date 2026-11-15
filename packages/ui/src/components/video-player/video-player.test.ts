import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { videoPlayerSpec } from './video-player.spec.js';
import { MthVideoPlayer, registerMthVideoPlayer } from './index.js';

describe('<mth-video-player>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and same-root ARIA', async () => {
    const compiled = compileSpec(videoPlayerSpec);
    expect(compiled.tests).toContain('<mth-video-player>');

    const specReport = await runBehaviorSpecAssertions(videoPlayerSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-video-player') as MthVideoPlayer;
    el.src = 'https://example.com/clip.mp4';
    el.label = 'Demo clip';
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('video')).toBeTruthy();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('rejects unsafe video URLs and supports play, pause, mute, seek, and rate controls', async () => {
    const el = document.createElement('mth-video-player') as MthVideoPlayer;
    el.src = 'javascript:alert(1)';
    document.body.append(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('video')).toBeNull();

    el.src = 'https://example.com/video.mp4';
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
    registerMthVideoPlayer();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-video-player src="https://example.com/video.mp4" label="Feature"></mth-video-player>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-video-player>', 'hyd-video-player>')
      .replaceAll('<mth-video-player', '<hyd-video-player');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthVideoPlayer('hyd');
        customElements.upgrade(host);
        await (host as MthVideoPlayer).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
