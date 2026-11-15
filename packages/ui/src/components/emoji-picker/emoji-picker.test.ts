import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  OverlaySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  emojiPickerSpec,
  MthEmojiPicker,
  registerMthEmojiPicker,
  type EmojiSelectDetail,
} from './index.js';

describe('<mth-emoji-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, RovingFocusSuite, OverlaySuite, and same-root ARIA', async () => {
    const compiled = compileSpec(emojiPickerSpec);
    expect(compiled.tests).toContain('<mth-emoji-picker>');

    const specReport = await runBehaviorSpecAssertions(emojiPickerSpec, {
      rovingFocus: {
        mount: async (dir) => {
          const el = document.createElement('mth-emoji-picker') as MthEmojiPicker;
          el.inline = true;
          el.columns = 6;
          if (dir) el.setAttribute('dir', dir);
          document.body.appendChild(el);
          await el.updateComplete;
          return el;
        },
        getItems: (el) =>
          Array.from((el as MthEmojiPicker).shadowRoot!.querySelectorAll<HTMLElement>('[part="emoji-button"]')),
        orientation: 'horizontal',
        loop: true,
      },
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open Emoji Picker';
          const el = document.createElement('mth-emoji-picker') as MthEmojiPicker;
          el.label = 'Reactions';
          return { overlay: el, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthEmojiPicker).show();
        },
        close: async (overlay) => {
          await (overlay as MthEmojiPicker).hide();
        },
        isOpen: (overlay) => (overlay as MthEmojiPicker).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-emoji-picker') as MthEmojiPicker;
        el.inline = true;
        el.columns = 6;
        if (dir) el.setAttribute('dir', dir);
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) =>
        Array.from((el as MthEmojiPicker).shadowRoot!.querySelectorAll<HTMLElement>('[part="emoji-button"]')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rovingReport.passed).toBe(true);

    const overlayReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Pick Emoji';
        const el = document.createElement('mth-emoji-picker') as MthEmojiPicker;
        el.label = 'Reactions';
        return { overlay: el, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthEmojiPicker).show();
      },
      close: async (overlay) => {
        await (overlay as MthEmojiPicker).hide();
      },
      isOpen: (overlay) => (overlay as MthEmojiPicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(overlayReport.passed).toBe(true);

    const ariaEl = document.createElement('mth-emoji-picker') as MthEmojiPicker;
    ariaEl.inline = true;
    ariaEl.label = 'Emoji selector';
    document.body.append(ariaEl);
    await ariaEl.updateComplete;
    expect(ariaEl.shadowRoot!.querySelectorAll('[part="emoji-button"]').length).toBeGreaterThan(0);
    expect(scanSameRootAria(ariaEl.shadowRoot!).issues).toEqual([]);
  });

  it('supports 2D ArrowDown/ArrowUp column navigation across emoji grid rows', async () => {
    const el = document.createElement('mth-emoji-picker') as MthEmojiPicker;
    el.inline = true;
    el.columns = 6;
    document.body.append(el);
    await el.updateComplete;

    const buttons = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="emoji-button"]'));
    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    expect(buttons.findIndex((b) => b.tabIndex === 0)).toBe(6);

    buttons[6]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
    expect(buttons.findIndex((b) => b.tabIndex === 0)).toBe(0);
  });

  it('filters by search, switches categories, applies skin tones, and tracks recent emojis', async () => {
    const el = document.createElement('mth-emoji-picker') as MthEmojiPicker;
    el.inline = true;
    document.body.append(el);
    await el.updateComplete;

    const selected: EmojiSelectDetail[] = [];
    el.addEventListener('mth-select', (e) => {
      selected.push((e as CustomEvent<EmojiSelectDetail>).detail);
    });

    const toneBtn = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.tone-btn')[3]!;
    toneBtn.click();
    await el.updateComplete;
    expect(el.skinTone).toBe(3);

    const search = el.shadowRoot!.querySelector<HTMLInputElement>('[part="search"]')!;
    search.value = 'thumbs';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    const filteredButtons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="emoji-button"]');
    expect(filteredButtons.length).toBe(1);
    filteredButtons[0]!.click();
    await el.updateComplete;

    expect(selected).toHaveLength(1);
    expect(selected[0]!.name).toBe('Thumbs up');
    expect(selected[0]!.emoji).toBe('👍\u{1F3FD}');
    expect(el.value).toBe('👍\u{1F3FD}');

    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    const recentCategoryBtn = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="category"]'),
    ).find((b) => b.textContent?.trim() === 'Recent');
    expect(recentCategoryBtn).toBeTruthy();
    recentCategoryBtn!.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('[part="emoji-button"]').length).toBe(1);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthEmojiPicker();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-emoji-picker inline label="Picker"></mth-emoji-picker>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-emoji-picker>', 'hyd-emoji-picker>')
      .replaceAll('<mth-emoji-picker', '<hyd-emoji-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthEmojiPicker('hyd');
        customElements.upgrade(host);
        await (host as MthEmojiPicker).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
