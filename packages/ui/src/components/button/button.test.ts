import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { buttonSpec } from './button.spec.js';
import { MthButton, registerMthButton } from './index.js';

describe('<mth-button>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, emits mth-press, suppresses when disabled/loading, and honors FACE submit/reset', async () => {
    const compiled = compileSpec(buttonSpec);
    expect(compiled.docs).toContain('`<mth-button>`');

    const report = await runBehaviorSpecAssertions(buttonSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const form = document.createElement('form');
    const submitHandler = vi.fn((e: Event) => e.preventDefault());
    const resetHandler = vi.fn();
    form.addEventListener('submit', submitHandler);
    form.addEventListener('reset', resetHandler);

    const submitBtn = document.createElement('mth-button') as MthButton;
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Save';

    const resetBtn = document.createElement('mth-button') as MthButton;
    resetBtn.type = 'reset';
    resetBtn.textContent = 'Reset';

    form.append(submitBtn, resetBtn);
    document.body.appendChild(form);
    await submitBtn.updateComplete;
    await resetBtn.updateComplete;

    let pressed = 0;
    submitBtn.addEventListener('mth-press', () => {
      pressed += 1;
    });

    (submitBtn.shadowRoot?.querySelector('[part="control"]') as HTMLButtonElement).click();
    expect(pressed).toBe(1);
    expect(submitHandler).toHaveBeenCalledTimes(1);

    (resetBtn.shadowRoot?.querySelector('[part="control"]') as HTMLButtonElement).click();
    expect(resetHandler).toHaveBeenCalledTimes(1);

    submitBtn.loading = true;
    await submitBtn.updateComplete;
    expect(submitBtn.shadowRoot?.querySelector('[part="spinner"]')).not.toBeNull();
    (submitBtn.shadowRoot?.querySelector('[part="control"]') as HTMLButtonElement).click();
    expect(pressed).toBe(1);

    submitBtn.loading = false;
    submitBtn.disabled = true;
    await submitBtn.updateComplete;
    (submitBtn.shadowRoot?.querySelector('[part="control"]') as HTMLButtonElement).click();
    expect(pressed).toBe(1);

    expect(scanSameRootAria(form).issues).toEqual([]);
  });

  it('renders safe anchor links with noopener noreferrer for _blank and rejects javascript: URLs', async () => {
    const linkBtn = document.createElement('mth-button') as MthButton;
    linkBtn.href = 'https://methane.dev/docs';
    linkBtn.target = '_blank';
    linkBtn.textContent = 'Docs';
    document.body.appendChild(linkBtn);
    await linkBtn.updateComplete;

    const anchor = linkBtn.shadowRoot?.querySelector('a[part="control"]') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('https://methane.dev/docs');
    expect(anchor?.getAttribute('rel')).toContain('noopener');
    expect(anchor?.getAttribute('rel')).toContain('noreferrer');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    linkBtn.href = 'javascript:alert(1)';
    await linkBtn.updateComplete;
    expect(linkBtn.shadowRoot?.querySelector('a[part="control"]')).toBeNull();
    expect(linkBtn.shadowRoot?.querySelector('button[part="control"]')).not.toBeNull();
    warnSpy.mockRestore();
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-button variant="outline">Save</mth-button>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-button>', 'hyd-button>').replaceAll('<mth-button', '<hyd-button');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthButton('hyd');
        customElements.upgrade(host);
        await (host as MthButton).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
