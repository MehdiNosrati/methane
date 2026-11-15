import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { passkeyPromptSpec } from './passkey-prompt.spec.js';
import { MthPasskeyPrompt, registerMthPasskeyPrompt } from './index.js';

describe('<mth-passkey-prompt>', () => {
  const originalPkc = (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential;

  afterEach(() => {
    document.body.replaceChildren();
    if (originalPkc === undefined) {
      delete (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential;
    } else {
      (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential = originalPkc;
    }
  });

  it('passes BehaviorSpec assertions and emits passkey/fallback events when WebAuthn is available', async () => {
    const compiled = compileSpec(passkeyPromptSpec);
    expect(compiled.docs).toContain('`<mth-passkey-prompt>`');

    const report = await runBehaviorSpecAssertions(passkeyPromptSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    class MockPublicKeyCredential {
      static async isConditionalMediationAvailable() {
        return true;
      }
    }
    (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential = MockPublicKeyCredential;

    const el = document.createElement('mth-passkey-prompt') as MthPasskeyPrompt;
    el.username = 'ada@methane.dev';
    document.body.appendChild(el);
    await el.detectWebAuthnCapabilities();
    await el.updateComplete;

    let authDetail: unknown = null;
    let fallbackDetail: unknown = null;
    el.addEventListener('mth-passkey-auth', ((ev: CustomEvent) => {
      authDetail = ev.detail;
    }) as EventListener);
    el.addEventListener('mth-fallback', ((ev: CustomEvent) => {
      fallbackDetail = ev.detail;
    }) as EventListener);

    const actionBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="action"]')!;
    expect(actionBtn.disabled).toBe(false);
    actionBtn.click();
    expect(authDetail).toEqual({
      mode: 'signin',
      username: 'ada@methane.dev',
      conditionalSupported: true,
    });

    const fallbackBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="fallback"]')!;
    fallbackBtn.click();
    expect(fallbackDetail).toEqual({ mode: 'signin', reason: 'user-choice' });

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
  });

  it('gracefully enters unsupported state when PublicKeyCredential is missing and passes HydrationPuritySuite', async () => {
    delete (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential;

    const el = document.createElement('mth-passkey-prompt') as MthPasskeyPrompt;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.isWebAuthnSupported).toBe(false);
    const actionBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="action"]')!;
    expect(actionBtn.disabled).toBe(true);
    expect(el.shadowRoot!.textContent).toContain('not supported');

    const rawSsr = await renderLitDsdHtml(litHtml`<mth-passkey-prompt></mth-passkey-prompt>`);
    const ssrHtml = rawSsr
      .replaceAll('<mth-passkey-prompt', '<hyd-passkey-prompt')
      .replaceAll('</mth-passkey-prompt>', '</hyd-passkey-prompt>');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPasskeyPrompt('hyd');
        customElements.upgrade(host);
        await (host as MthPasskeyPrompt).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
