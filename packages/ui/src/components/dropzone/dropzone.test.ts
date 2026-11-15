import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { dropzoneSpec } from './dropzone.spec.js';
import { MthDropzone, registerMthDropzone } from './index.js';

describe('<mth-dropzone>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('accepts valid files, rejects invalid MIME/size, and toggles dragover state', async () => {
    const compiled = compileSpec(dropzoneSpec);
    expect(compiled.docs).toContain('`<mth-dropzone>`');

    const dz = document.createElement('mth-dropzone') as MthDropzone;
    dz.label = 'Drop images';
    dz.accept = '.png,image/jpeg';
    dz.maxFileSize = 50;
    document.body.appendChild(dz);
    await dz.updateComplete;

    let dropped: string[] = [];
    let rejected: string[] = [];
    dz.addEventListener('mth-drop', (e) => {
      dropped = (e as CustomEvent<{ files: File[] }>).detail.files.map((f) => f.name);
    });
    dz.addEventListener('mth-reject', (e) => {
      rejected = (e as CustomEvent<{ rejected: Array<{ reason: string }> }>).detail.rejected.map(
        (r) => r.reason,
      );
    });

    const base = dz.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
    base.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    expect(dz.hasCustomState('dragover')).toBe(true);
    base.dispatchEvent(new Event('dragleave', { bubbles: true }));
    expect(dz.hasCustomState('dragover')).toBe(false);

    const ok = new File(['ok'], 'photo.png', { type: 'image/png' });
    const badMime = new File(['no'], 'doc.pdf', { type: 'application/pdf' });
    const tooBig = new File(['x'.repeat(100)], 'huge.png', { type: 'image/png' });

    dz.receiveFiles([ok, badMime, tooBig]);
    expect(dropped).toEqual(['photo.png']);
    expect(rejected).toEqual(['type', 'size']);

    expect(scanSameRootAria(dz).issues).toEqual([]);
    const specReport = await runBehaviorSpecAssertions(dropzoneSpec, {});
    expect(specReport.failures).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-dropzone label="Uploads"></mth-dropzone>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-dropzone>', 'hyd-dropzone>')
      .replaceAll('<mth-dropzone', '<hyd-dropzone');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDropzone('hyd');
        customElements.upgrade(host);
        await (host as MthDropzone).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
