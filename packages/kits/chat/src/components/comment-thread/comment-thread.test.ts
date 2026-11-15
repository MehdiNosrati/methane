import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { commentThreadSpec, MthCommentThread, registerMthCommentThread } from './index.js';

describe('<mth-comment-thread>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, supports collapse/resolve/reply, and sanitizes XSS', async () => {
    const compiled = compileSpec(commentThreadSpec);
    expect(compiled.tests).toContain('<mth-comment-thread>');
    const report = await runBehaviorSpecAssertions(commentThreadSpec, {});
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-comment-thread') as MthCommentThread;
    el.comments = [
      {
        id: 'c1',
        author: 'Ada',
        body: '<img src=x onerror=alert(1)> Check *spacing*',
        replies: [{ id: 'r1', author: 'Bob', body: 'Done!' }],
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('[part="body"] img')).toBeNull();
    expect(el.shadowRoot!.querySelector('[part="body"] em')?.textContent).toBe('spacing');
    expect(el.shadowRoot!.querySelector('[part="replies"]')).not.toBeNull();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="reply-toggle"]')!.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="replies"]')).toBeNull();

    const resolvedEvents: Array<{ id: string; resolved: boolean }> = [];
    el.addEventListener('mth-resolve-toggle', (e) => {
      resolvedEvents.push((e as CustomEvent<{ id: string; resolved: boolean }>).detail);
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="resolve-button"]')!.click();
    expect(resolvedEvents).toEqual([{ id: 'c1', resolved: true }]);

    const replyEvents: Array<{ parentId: string; body: string }> = [];
    el.addEventListener('mth-reply', (e) => {
      replyEvents.push((e as CustomEvent<{ parentId: string; body: string }>).detail);
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="reply-button"]')!.click();
    await el.updateComplete;
    const replyInput = el.shadowRoot!.querySelector<HTMLInputElement>('.reply-input')!;
    replyInput.value = 'Looks good';
    replyInput.dispatchEvent(new Event('input', { bubbles: true }));
    replyInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(replyEvents).toEqual([{ parentId: 'c1', body: 'Looks good' }]);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthCommentThread();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-comment-thread label="Discussion"></mth-comment-thread>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-comment-thread>', 'hyd-comment-thread>')
      .replaceAll('<mth-comment-thread', '<hyd-comment-thread');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCommentThread('hyd');
        customElements.upgrade(host);
        await (host as MthCommentThread).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
