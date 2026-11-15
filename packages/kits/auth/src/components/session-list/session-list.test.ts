import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthSessionList, registerMthSessionList, sessionListSpec } from './index.js';

describe('<mth-session-list>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, renders current badge, and emits revoke events', async () => {
    const compiled = compileSpec(sessionListSpec);
    expect(compiled.docs).toContain('`<mth-session-list>`');

    const report = await runBehaviorSpecAssertions(sessionListSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const list = document.createElement('mth-session-list') as MthSessionList;
    list.sessions = [
      {
        id: 'sess-1',
        device: 'MacBook Pro',
        browser: 'Chrome 131',
        location: 'San Francisco, US',
        ip: '198.51.100.4',
        lastActive: 'Active now',
        current: true,
      },
      {
        id: 'sess-2',
        device: 'iPhone 16',
        browser: 'Safari',
        location: 'New York, US',
        ip: '203.0.113.19',
        lastActive: '2 hours ago',
        current: false,
      },
    ];
    document.body.appendChild(list);
    await list.updateComplete;

    let revokedId = '';
    let revokeOthersCount = 0;
    list.addEventListener('mth-revoke', ((ev: CustomEvent<{ id: string }>) => {
      revokedId = ev.detail.id;
    }) as EventListener);
    list.addEventListener('mth-revoke-others', ((ev: CustomEvent<{ count: number }>) => {
      revokeOthersCount = ev.detail.count;
    }) as EventListener);

    const revokeBtns = list.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="revoke"]');
    expect(revokeBtns).toHaveLength(1);
    revokeBtns[0]!.click();
    expect(revokedId).toBe('sess-2');

    const revokeOthersBtn = list.shadowRoot!.querySelector<HTMLButtonElement>('[part="revoke-others"]')!;
    revokeOthersBtn.click();
    expect(revokeOthersCount).toBe(1);

    const aria = scanSameRootAria(list.shadowRoot!);
    expect(aria.valid).toBe(true);

    const rawSsr = await renderLitDsdHtml(litHtml`<mth-session-list></mth-session-list>`);
    const ssrHtml = rawSsr
      .replaceAll('<mth-session-list', '<hyd-session-list')
      .replaceAll('</mth-session-list>', '</hyd-session-list>');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSessionList('hyd');
        customElements.upgrade(host);
        await (host as MthSessionList).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
