import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthVideoGrid, registerMthVideoGrid, videoGridSpec, type VideoParticipant } from './index.js';

const SAMPLE_PARTICIPANTS: VideoParticipant[] = [
  { id: 'p1', name: 'Ada', muted: false, videoOff: true, speaking: true },
  { id: 'p2', name: 'Linus', muted: true, videoOff: true },
  { id: 'p3', name: 'Grace', muted: false, videoOff: true },
];

describe('<mth-video-grid>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + RovingFocusSuite', async () => {
    const compiled = compileSpec(videoGridSpec);
    expect(compiled.docs).toContain('`<mth-video-grid>`');

    const satelliteAdapter = {
      createElement: () => {
        const el = document.createElement('mth-video-grid') as MthVideoGrid;
        el.participants = SAMPLE_PARTICIPANTS;
        return el;
      },
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthVideoGrid).engine?.getThemeToken(tokenName) ?? '',
    };

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-video-grid') as MthVideoGrid;
        el.setAttribute('dir', dir);
        el.participants = SAMPLE_PARTICIPANTS;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) => (container as MthVideoGrid).getFocusableControls(),
    };

    const report = await runBehaviorSpecAssertions(videoGridSpec, {
      satellite: satelliteAdapter,
      rovingFocus: rovingAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.passed).toBe(true);

    const rovReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovReport.passed).toBe(true);
  });

  it('switches between gallery and speaker layouts and toggles participant pin', async () => {
    const grid = document.createElement('mth-video-grid') as MthVideoGrid;
    grid.participants = SAMPLE_PARTICIPANTS;
    document.body.appendChild(grid);
    await grid.updateComplete;

    let pinnedEvent = '';
    grid.addEventListener('mth-pin-change', (ev: Event) => {
      pinnedEvent = (ev as CustomEvent<{ pinnedId: string }>).detail.pinnedId;
    });

    const pinBtns = grid.shadowRoot!.querySelectorAll<HTMLButtonElement>('.pin-btn');
    expect(pinBtns.length).toBe(3);
    pinBtns[1]!.click();
    await grid.updateComplete;
    expect(grid.pinnedId).toBe('p2');
    expect(pinnedEvent).toBe('p2');

    const speakerBtn = grid.shadowRoot!.querySelectorAll<HTMLButtonElement>('.layout-btn')[1]!;
    speakerBtn.click();
    await grid.updateComplete;
    expect(grid.layout).toBe('speaker');
    expect(grid.shadowRoot!.querySelector('[part="stage"]')).toBeTruthy();
    expect(grid.engine?.getSpotlightParticipant()?.id).toBe('p2');
    expect(scanSameRootAria(grid.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM with fallback slot', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-video-grid label="Team call"><div slot="fallback">Video unavailable</div></mth-video-grid>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-video-grid>', 'hyd-video-grid>')
      .replaceAll('<mth-video-grid', '<hyd-video-grid');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthVideoGrid('hyd');
        customElements.upgrade(host);
        await (host as MthVideoGrid).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
