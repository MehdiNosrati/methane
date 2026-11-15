import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/avatar';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthAvatarGroup, avatarGroupSpec, registerMthAvatarGroup } from './index.js';

describe('<mth-avatar-group>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, limits visible avatars via max, and renders localized +N overflow badge', async () => {
    const compiled = compileSpec(avatarGroupSpec);
    expect(compiled.docs).toContain('`<mth-avatar-group>`');

    const report = await runBehaviorSpecAssertions(avatarGroupSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const group = document.createElement('mth-avatar-group') as MthAvatarGroup;
    group.max = 2;
    group.size = 'sm';

    const a1 = document.createElement('mth-avatar');
    a1.setAttribute('name', 'Ada Lovelace');
    const a2 = document.createElement('mth-avatar');
    a2.setAttribute('name', 'Grace Hopper');
    const a3 = document.createElement('mth-avatar');
    a3.setAttribute('name', 'Alan Turing');
    const a4 = document.createElement('mth-avatar');
    a4.setAttribute('name', 'Margaret Hamilton');

    group.append(a1, a2, a3, a4);
    document.body.appendChild(group);
    await group.updateComplete;
    await Promise.resolve();
    await group.updateComplete;

    expect(a1.hidden).toBe(false);
    expect(a2.hidden).toBe(false);
    expect(a3.hidden).toBe(true);
    expect(a4.hidden).toBe(true);
    expect(group.hasCustomState('overflowing')).toBe(true);

    const overflow = group.shadowRoot!.querySelector('[part="overflow"]')!;
    expect(overflow.hasAttribute('hidden')).toBe(false);
    const cleanText = (overflow.textContent ?? '').replace(/[\u2068\u2069]/g, '').trim();
    expect(cleanText).toBe('+2');
    expect(overflow.getAttribute('aria-label')?.replace(/[\u2068\u2069]/g, '')).toBe('2 more avatars');
    expect(scanSameRootAria(group).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-avatar-group max="3" label="Team"></mth-avatar-group>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-avatar-group>', 'hyd-avatar-group>')
      .replaceAll('<mth-avatar-group', '<hyd-avatar-group');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAvatarGroup('hyd');
        customElements.upgrade(host);
        await (host as MthAvatarGroup).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
