import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { alertSpec } from './alert.spec.js';
import { MthAlert, registerMthAlert } from './index.js';

describe('<mth-alert>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, semantic live-region roles, and same-root ARIA', async () => {
    const compiled = compileSpec(alertSpec);
    expect(compiled.docs).toContain('`<mth-alert>`');

    const report = await runBehaviorSpecAssertions(alertSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const alertEl = document.createElement('mth-alert') as MthAlert;
    alertEl.variant = 'info';
    alertEl.title = 'Update available';
    alertEl.textContent = 'Version 2.0 is ready.';
    document.body.appendChild(alertEl);
    await alertEl.updateComplete;

    expect(alertEl.shadowRoot!.querySelector('[part="base"]')?.getAttribute('role')).toBe('status');
    expect(alertEl.hasCustomState('open')).toBe(true);
    expect(scanSameRootAria(alertEl).valid).toBe(true);

    alertEl.variant = 'danger';
    await alertEl.updateComplete;
    expect(alertEl.shadowRoot!.querySelector('[part="base"]')?.getAttribute('role')).toBe('alert');
  });

  it('supports closable dismiss with cancelable mth-close and slots', async () => {
    const alertEl = document.createElement('mth-alert') as MthAlert;
    alertEl.variant = 'warning';
    alertEl.closable = true;

    const slottedTitle = document.createElement('span');
    slottedTitle.slot = 'title';
    slottedTitle.textContent = 'Custom Title';

    const actionBtn = document.createElement('button');
    actionBtn.slot = 'actions';
    actionBtn.textContent = 'Retry';

    alertEl.append(slottedTitle, actionBtn);
    document.body.appendChild(alertEl);
    await alertEl.updateComplete;
    await Promise.resolve();
    await alertEl.updateComplete;

    expect(alertEl.shadowRoot!.querySelector('[part="title"]')?.hasAttribute('hidden')).toBe(false);
    expect(alertEl.shadowRoot!.querySelector('[part="actions"]')?.hasAttribute('hidden')).toBe(false);

    // Cancelable mth-close prevents closing when defaultPrevented
    alertEl.addEventListener(
      'mth-close',
      (e) => {
        e.preventDefault();
      },
      { once: true },
    );
    const closeBtn = alertEl.shadowRoot!.querySelector<HTMLButtonElement>('[part="close-button"]')!;
    closeBtn.click();
    await alertEl.updateComplete;
    expect(alertEl.open).toBe(true);

    let closeReason = '';
    alertEl.addEventListener('mth-close', (e) => {
      closeReason = (e as CustomEvent<{ reason: string }>).detail.reason;
    });
    closeBtn.click();
    await alertEl.updateComplete;
    expect(closeReason).toBe('close-button');
    expect(alertEl.open).toBe(false);
    expect(alertEl.hasCustomState('open')).toBe(false);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-alert variant="success" title="Saved" closable>Changes saved.</mth-alert>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-alert>', 'hyd-alert>').replaceAll('<mth-alert', '<hyd-alert');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAlert('hyd');
        customElements.upgrade(host);
        await (host as MthAlert).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
