import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthAvatar, avatarSpec, registerMthAvatar } from './index.js';

describe('<mth-avatar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, computes initials, and falls back on image error', async () => {
    const compiled = compileSpec(avatarSpec);
    expect(compiled.docs).toContain('`<mth-avatar>`');

    const report = await runBehaviorSpecAssertions(avatarSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const avatar = document.createElement('mth-avatar') as MthAvatar;
    avatar.name = 'Ada Lovelace';
    avatar.src = 'https://example.com/broken.png';
    avatar.status = 'online';
    avatar.shape = 'square';
    document.body.appendChild(avatar);
    await avatar.updateComplete;

    const img = avatar.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')!;
    expect(img).not.toBeNull();
    img.dispatchEvent(new Event('error'));
    await avatar.updateComplete;

    expect(avatar.hasCustomState('error')).toBe(true);
    expect(avatar.shadowRoot!.querySelector('[part="image"]')).toBeNull();
    const initials = avatar.shadowRoot!.querySelector('[part="initials"]')!;
    expect(initials.textContent?.trim()).toBe('AL');
    expect(initials.getAttribute('aria-label')).toBe('Ada Lovelace');

    const status = avatar.shadowRoot!.querySelector('[part="status"]')!;
    expect(status.getAttribute('aria-label')).toBe('Online');
    expect(scanSameRootAria(avatar).valid).toBe(true);
  });

  it('renders silhouette fallback when neither src nor name is provided', async () => {
    const avatar = document.createElement('mth-avatar') as MthAvatar;
    document.body.appendChild(avatar);
    await avatar.updateComplete;

    expect(avatar.shadowRoot!.querySelector('[part="fallback"]')).not.toBeNull();
    expect(scanSameRootAria(avatar).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-avatar name="Grace Hopper" size="lg" status="away"></mth-avatar>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-avatar>', 'hyd-avatar>')
      .replaceAll('<mth-avatar', '<hyd-avatar');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAvatar('hyd');
        customElements.upgrade(host);
        await (host as MthAvatar).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
