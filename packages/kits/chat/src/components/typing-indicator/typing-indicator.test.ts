import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { typingIndicatorSpec } from './typing-indicator.spec.js';
import { MthTypingIndicator, registerMthTypingIndicator } from './index.js';

describe('<mth-typing-indicator>', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, pluralized typing copy, reduced motion, and same-root ARIA', async () => {
    const compiled = compileSpec(typingIndicatorSpec);
    expect(compiled.tests).toContain('<mth-typing-indicator>');
    const report = await runBehaviorSpecAssertions(typingIndicatorSpec, {});
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-typing-indicator') as MthTypingIndicator;
    el.users = ['Ada'];
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasCustomState('active')).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="text"]')?.textContent).toContain('Ada');
    expect(el.shadowRoot!.querySelector('[part="text"]')?.textContent).toContain('is typing');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    el.users = ['Ada', 'Grace'];
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="text"]')?.textContent).toContain('Ada');
    expect(el.shadowRoot!.querySelector('[part="text"]')?.textContent).toContain('Grace');

    el.users = ['Ada', 'Grace', 'Alan'];
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="text"]')?.textContent).toContain('others are typing');

    el.users = [];
    await el.updateComplete;
    expect(el.hasCustomState('active')).toBe(false);
    expect(el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')?.hidden).toBe(true);
  });

  it('tracks reduced-motion state from MotionController', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    );

    const el = document.createElement('mth-typing-indicator') as MthTypingIndicator;
    el.users = ['Linus'];
    document.body.append(el);
    await el.updateComplete;
    expect(el.hasCustomState('reduced-motion')).toBe(true);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthTypingIndicator();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-typing-indicator label="Someone is typing"></mth-typing-indicator>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-typing-indicator>', 'hyd-typing-indicator>')
      .replaceAll('<mth-typing-indicator', '<hyd-typing-indicator');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTypingIndicator('hyd');
        customElements.upgrade(host);
        await (host as MthTypingIndicator).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
