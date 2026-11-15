import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { fileUploadSpec } from './file-upload.spec.js';
import { MthFileUpload, registerMthFileUpload } from './index.js';

describe('<mth-file-upload>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, enforces advisory checks, and previews SVG only via <img>', async () => {
    const compiled = compileSpec(fileUploadSpec);
    expect(compiled.docs).toContain('`<mth-file-upload>`');

    let mounted: MthFileUpload | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-file-upload') as MthFileUpload;
        mounted.label = 'Attachment';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const upload = el as MthFileUpload;
        await upload.updateComplete;
        if (!value) {
          upload.clear();
        } else {
          const file = new File(['data'], value, { type: 'text/plain' });
          upload.addFiles([file]);
        }
        await upload.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthFileUpload).value,
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
        Boolean(el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthFileUpload).checkValidity(),
      defaultValue: '',
      nextValue: 'report.pdf',
    };

    const specReport = await runBehaviorSpecAssertions(fileUploadSpec, {
      formControl: formControlAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);

    const upload = document.createElement('mth-file-upload') as MthFileUpload;
    upload.label = 'Assets';
    upload.accept = 'image/*';
    upload.maxFileSize = 100;
    upload.multiple = true;
    document.body.appendChild(upload);
    await upload.updateComplete;

    let rejectedReasons: string[] = [];
    upload.addEventListener('mth-reject', (e) => {
      rejectedReasons = (e as CustomEvent<{ rejected: Array<{ reason: string }> }>).detail.rejected.map(
        (r) => r.reason,
      );
    });

    const badType = new File(['abc'], 'script.js', { type: 'text/javascript' });
    const tooLarge = new File(['x'.repeat(200)], 'big.png', { type: 'image/png' });
    const svgFile = new File(['<svg><script>alert(1)</script></svg>'], 'icon.svg', {
      type: 'image/svg+xml',
    });

    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = () => 'blob:http://localhost/mock-svg';
    try {
      upload.addFiles([badType, tooLarge, svgFile]);
      await upload.updateComplete;
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
    }

    expect(rejectedReasons).toEqual(['type', 'size']);
    expect(upload.files.map((f) => f.name)).toEqual(['icon.svg']);

    const imgPreview = upload.shadowRoot!.querySelector<HTMLImageElement>('img[part="preview"]');
    expect(imgPreview).not.toBeNull();
    expect(imgPreview!.getAttribute('src')).toBe('blob:http://localhost/mock-svg');
    // Must NEVER inject raw SVG DOM into shadowRoot (ADR-012)
    expect(upload.shadowRoot!.querySelector('svg')).toBeNull();

    expect(scanSameRootAria(upload).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-file-upload label="Files"></mth-file-upload>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-file-upload>', 'hyd-file-upload>')
      .replaceAll('<mth-file-upload', '<hyd-file-upload');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFileUpload('hyd');
        customElements.upgrade(host);
        await (host as MthFileUpload).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
