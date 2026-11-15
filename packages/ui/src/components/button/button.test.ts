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

  it('supports all variants (solid, soft, outline, outlined alias, ghost, danger), sizes, loading, and slots', async () => {
    const variants = ['solid', 'soft', 'outline', 'ghost', 'danger'] as const;
    for (const variant of variants) {
      const btn = document.createElement('mth-button') as MthButton;
      btn.variant = variant;
      btn.textContent = variant;
      document.body.appendChild(btn);
      await btn.updateComplete;
      expect(btn.variant).toBe(variant);
      expect(btn.getAttribute('variant')).toBe(variant);
      btn.remove();
    }

    const aliased = document.createElement('mth-button') as MthButton;
    aliased.setAttribute('variant', 'outlined');
    aliased.textContent = 'Aliased';
    document.body.appendChild(aliased);
    await aliased.updateComplete;
    expect(aliased.variant).toBe('outline');

    const propAliased = document.createElement('mth-button') as MthButton;
    propAliased.variant = 'outlined';
    document.body.appendChild(propAliased);
    await propAliased.updateComplete;
    expect(propAliased.variant).toBe('outline');
    expect(propAliased.getAttribute('variant')).toBe('outline');
    propAliased.remove();

    for (const size of ['sm', 'md', 'lg'] as const) {
      aliased.size = size;
      await aliased.updateComplete;
      expect(aliased.getAttribute('size')).toBe(size);
    }

    let presses = 0;
    aliased.addEventListener('mth-press', () => {
      presses += 1;
    });

    aliased.loading = true;
    await aliased.updateComplete;
    const ctrl = aliased.shadowRoot!.querySelector<HTMLButtonElement>('[part="control"]')!;
    expect(aliased.shadowRoot!.querySelector('[part="spinner"]')).not.toBeNull();
    expect(ctrl.getAttribute('aria-busy')).toBe('true');
    ctrl.click();
    expect(presses).toBe(0);

    aliased.loading = false;
    aliased.disabled = true;
    await aliased.updateComplete;
    expect(ctrl.disabled).toBe(true);
    ctrl.click();
    expect(presses).toBe(0);

    aliased.disabled = false;
    await aliased.updateComplete;
    ctrl.click();
    expect(presses).toBe(1);
    expect(scanSameRootAria(aliased).valid).toBe(true);
  });

  it('supports relative href links and FACE form reset/submit', async () => {
    const relLink = document.createElement('mth-button') as MthButton;
    relLink.href = '/docs/getting-started';
    relLink.textContent = 'Start';
    document.body.appendChild(relLink);
    await relLink.updateComplete;
    const anchor = relLink.shadowRoot!.querySelector<HTMLAnchorElement>('a[part="control"]');
    expect(anchor?.getAttribute('href')).toBe('/docs/getting-started');
    expect(anchor?.hasAttribute('rel')).toBe(false);

    const form = document.createElement('form');
    const submitBtn = document.createElement('mth-button') as MthButton;
    submitBtn.type = 'submit';
    submitBtn.name = 'action';
    submitBtn.value = 'publish';
    submitBtn.textContent = 'Publish';
    form.appendChild(submitBtn);
    document.body.appendChild(form);
    await submitBtn.updateComplete;

    let submitted = false;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      submitted = true;
    });
    submitBtn.shadowRoot!.querySelector<HTMLButtonElement>('[part="control"]')!.click();
    expect(submitted).toBe(true);
    expect(submitBtn.type).toBe('submit');
  });
});
