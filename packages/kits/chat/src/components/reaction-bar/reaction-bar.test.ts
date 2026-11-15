import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthReactionBar, reactionBarSpec, registerMthReactionBar } from './index.js';

describe('<mth-reaction-bar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, RovingFocusSuite (LTR & RTL), and same-root ARIA', async () => {
    const compiled = compileSpec(reactionBarSpec);
    expect(compiled.tests).toContain('<mth-reaction-bar>');

    const report = await runBehaviorSpecAssertions(reactionBarSpec, {
      rovingFocus: {
        mount: async (dir) => {
          const el = document.createElement('mth-reaction-bar') as MthReactionBar;
          if (dir === 'rtl') el.setAttribute('dir', 'rtl');
          el.reactions = [
            { emoji: '👍', count: 3 },
            { emoji: '🚀', count: 1 },
          ];
          document.body.append(el);
          await el.updateComplete;
          return el;
        },
        getItems: (el) =>
          Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[data-roving-item]')),
        orientation: 'horizontal',
        loop: true,
      },
    });
    expect(report.passed).toBe(true);

    const rtlSuite = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-reaction-bar') as MthReactionBar;
        if (dir) el.setAttribute('dir', dir);
        el.reactions = [
          { emoji: '👍', count: 2 },
          { emoji: '❤️', count: 1 },
        ];
        document.body.append(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[data-roving-item]')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rtlSuite.passed).toBe(true);
  });

  it('toggles reaction pills and emits mth-change and mth-add-reaction', async () => {
    const el = document.createElement('mth-reaction-bar') as MthReactionBar;
    el.reactions = [
      { emoji: '👍', count: 2 },
      { emoji: '🎉', count: 1 },
    ];
    document.body.append(el);
    await el.updateComplete;

    const events: Array<{ value: string; emoji: string; selected: boolean }> = [];
    el.addEventListener('mth-change', (e) => {
      events.push((e as CustomEvent<{ value: string; emoji: string; selected: boolean }>).detail);
    });
    let addClicked = 0;
    el.addEventListener('mth-add-reaction', () => {
      addClicked++;
    });

    const pills = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="pill"]');
    pills[0]!.click();
    await el.updateComplete;

    expect(pills[0]!.getAttribute('aria-pressed')).toBe('true');
    expect(pills[0]!.querySelector('[part="count"]')?.textContent).toBe('3');
    expect(events).toEqual([{ value: '👍', values: ['👍'], emoji: '👍', selected: true }]);

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="add-button"]')!.click();
    expect(addClicked).toBe(1);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthReactionBar();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-reaction-bar label="Reactions"></mth-reaction-bar>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-reaction-bar>', 'hyd-reaction-bar>')
      .replaceAll('<mth-reaction-bar', '<hyd-reaction-bar');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthReactionBar('hyd');
        customElements.upgrade(host);
        await (host as MthReactionBar).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
