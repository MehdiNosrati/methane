import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { LiveAnnouncer } from '@methane/primitives';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import '@methane/ui/input';
import { errorSummarySpec } from './error-summary.spec.js';
import { MthErrorSummary, registerMthErrorSummary } from './index.js';

function stripBidiIsolates(text: string): string {
  return text.replace(/[\u2068\u2069]/g, '');
}

describe('<mth-error-summary>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    LiveAnnouncer.clear();
  });

  it('passes BehaviorSpec assertions, renders pluralized title, and announces via LiveAnnouncer', async () => {
    const compiled = compileSpec(errorSummarySpec);
    expect(compiled.docs).toContain('`<mth-error-summary>`');

    const report = await runBehaviorSpecAssertions(errorSummarySpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const summary = document.createElement('mth-error-summary') as MthErrorSummary;
    summary.errors = [{ id: 'email-input', message: 'Enter an email address' }];
    document.body.appendChild(summary);
    await summary.updateComplete;

    const alertRegion = summary.shadowRoot!.querySelector<HTMLElement>('[part="summary"]')!;
    expect(alertRegion.getAttribute('role')).toBe('alert');
    expect(alertRegion.getAttribute('tabindex')).toBe('-1');
    expect(stripBidiIsolates(summary.shadowRoot!.querySelector('[part="title"]')!.textContent!.trim())).toBe(
      'There is 1 problem',
    );
    expect(LiveAnnouncer.getLastAnnouncement()?.politeness).toBe('assertive');

    summary.errors = [
      { id: 'email-input', message: 'Enter an email address' },
      { name: 'password', message: 'Enter a password' },
    ];
    await summary.updateComplete;
    expect(stripBidiIsolates(summary.shadowRoot!.querySelector('[part="title"]')!.textContent!.trim())).toBe(
      'There are 2 problems',
    );

    summary.focus();
    expect(summary.shadowRoot!.activeElement).toBe(alertRegion);

    const aria = scanSameRootAria(summary.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('focuses target control and emits mth-focus-field when an error link is clicked', async () => {
    const input = document.createElement('mth-input');
    input.id = 'full-name';
    input.setAttribute('name', 'fullName');
    input.setAttribute('label', 'Full name');

    const summary = document.createElement('mth-error-summary') as MthErrorSummary;
    summary.errors = [{ id: 'full-name', name: 'fullName', message: 'Enter your full name' }];

    document.body.append(summary, input);
    await summary.updateComplete;
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    const onFocusField = vi.fn();
    summary.addEventListener('mth-focus-field', onFocusField);

    const link = summary.shadowRoot!.querySelector<HTMLAnchorElement>('[part="link"]')!;
    link.click();

    expect(onFocusField).toHaveBeenCalledTimes(1);
    expect(onFocusField.mock.calls[0]?.[0]?.detail).toEqual({
      id: 'full-name',
      name: 'fullName',
      message: 'Enter your full name',
      href: '#full-name',
    });
    expect(document.activeElement).toBe(input);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-error-summary heading="Fix the following"></mth-error-summary>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-error-summary>', 'hyd-error-summary>')
      .replaceAll('<mth-error-summary', '<hyd-error-summary');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthErrorSummary('hyd');
        customElements.upgrade(host);
        await (host as MthErrorSummary).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
