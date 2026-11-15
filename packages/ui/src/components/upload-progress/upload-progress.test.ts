import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthUploadProgress, registerMthUploadProgress, uploadProgressSpec } from './index.js';

describe('<mth-upload-progress>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and handles pause/resume/cancel/retry', async () => {
    const compiled = compileSpec(uploadProgressSpec);
    expect(compiled.docs).toContain('`<mth-upload-progress>`');

    const report = await runBehaviorSpecAssertions(uploadProgressSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const up = document.createElement('mth-upload-progress') as MthUploadProgress;
    up.filename = 'report.pdf';
    up.value = 45;
    up.size = 2048;
    up.status = 'uploading';
    document.body.appendChild(up);
    await up.updateComplete;

    let paused = false;
    up.addEventListener('mth-pause', () => {
      paused = true;
    });
    up.shadowRoot?.querySelector<HTMLButtonElement>('[part="pause-button"]')?.click();
    await up.updateComplete;
    expect(paused).toBe(true);
    expect(up.status).toBe('paused');

    let resumed = false;
    up.addEventListener('mth-resume', () => {
      resumed = true;
    });
    up.shadowRoot?.querySelector<HTMLButtonElement>('[part="pause-button"]')?.click();
    await up.updateComplete;
    expect(resumed).toBe(true);
    expect(up.status).toBe('uploading');

    let cancelled = false;
    up.addEventListener('mth-cancel', () => {
      cancelled = true;
    });
    up.shadowRoot?.querySelector<HTMLButtonElement>('[part="cancel-button"]')?.click();
    expect(cancelled).toBe(true);
    expect(scanSameRootAria(up).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-upload-progress filename="photo.png" value="50" status="uploading"></mth-upload-progress>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-upload-progress', '<hyd-upload-progress')
      .replaceAll('</mth-upload-progress>', '</hyd-upload-progress>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthUploadProgress('hyd');
        customElements.upgrade(host);
        await (host as MthUploadProgress).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
