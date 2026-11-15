import { UIElement, html } from '@methane/core';
import {
  ListboxSuite,
  OverlaySuite,
  RovingFocusSuite,
} from '@methane/test-conformance';
import { describe, expect, it, vi } from 'vitest';
import {
  FocusTrapController,
  ListboxController,
  MotionController,
  OverlayController,
  PositioningController,
  RovingFocusController,
  collectTabbableElements,
} from './index.js';

class TestOverlayElement extends UIElement {
  triggerRef: HTMLElement | null = null;
  forceFallback = false;
  mode: 'dialog' | 'popover' | 'non-modal' = 'popover';

  readonly overlay = new OverlayController(this, {
    mode: 'popover',
    trigger: () => this.triggerRef,
    lightDismiss: true,
  });

  override willUpdate(): void {
    this.overlay.updateOptions({
      mode: this.mode,
      forceFallback: this.forceFallback,
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('mth-test-overlay')) {
  customElements.define('mth-test-overlay', TestOverlayElement);
}

class TestRovingElement extends UIElement {
  readonly roving = new RovingFocusController(this, {
    getItems: () => Array.from(this.querySelectorAll<HTMLElement>('[data-roving-item]')),
    orientation: 'horizontal',
    loop: true,
    dir: 'auto',
  });

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('mth-test-roving')) {
  customElements.define('mth-test-roving', TestRovingElement);
}

class TestListboxElement extends UIElement {
  readonly listbox = new ListboxController(this, {
    focusMode: 'activedescendant',
    getListboxElement: () => this.shadowRoot?.querySelector('[role="listbox"]') ?? null,
    getOptionElements: () =>
      Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
  });

  override render() {
    return html`
      <div role="listbox" tabindex="0" aria-label="Fruits">
        <div role="option" data-value="apple">Apple</div>
        <div role="option" data-value="banana">Banana</div>
        <div role="option" data-value="cherry" aria-disabled="true">Cherry</div>
        <div role="option" data-value="date">Date</div>
      </div>
    `;
  }
}

if (!customElements.get('mth-test-listbox')) {
  customElements.define('mth-test-listbox', TestListboxElement);
}

describe('Deliverable 3: Overlay, Positioning, FocusTrap, RovingFocus, Listbox, Motion controllers', () => {
  it('OverlayController passes OverlaySuite conformance, nested Escape stack, native dialog + fallback, and Invoker Commands', async () => {
    const report = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Trigger';
        const overlay = document.createElement('mth-test-overlay') as TestOverlayElement;
        overlay.triggerRef = trigger;
        overlay.hidden = true;
        return { overlay, trigger };
      },
      open: async (el) => {
        await (el as TestOverlayElement).overlay.show();
      },
      close: async (el) => {
        await (el as TestOverlayElement).overlay.hide('programmatic');
      },
      isOpen: (el) => (el as TestOverlayElement).overlay.open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(report.passed).toBe(true);

    // Nested Escape stack closes topmost overlay first
    const outer = document.createElement('mth-test-overlay') as TestOverlayElement;
    const inner = document.createElement('mth-test-overlay') as TestOverlayElement;
    document.body.append(outer, inner);
    await outer.updateComplete;
    await inner.updateComplete;

    await outer.overlay.show();
    await inner.overlay.show();
    expect(outer.overlay.open).toBe(true);
    expect(inner.overlay.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();
    expect(inner.overlay.open).toBe(false);
    expect(outer.overlay.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();
    expect(outer.overlay.open).toBe(false);

    // Dual-path native dialog vs fallback & Invoker command event
    const dialogEl = document.createElement('dialog') as HTMLDialogElement & {
      showModal?: () => void;
      close?: () => void;
    };
    const showModalSpy = vi.fn(() => {
      dialogEl.setAttribute('open', '');
    });
    const closeSpy = vi.fn(() => {
      dialogEl.removeAttribute('open');
    });
    dialogEl.showModal = showModalSpy;
    dialogEl.close = closeSpy;
    outer.appendChild(dialogEl);
    outer.mode = 'dialog';
    outer.overlay.updateOptions({ mode: 'dialog', surface: () => dialogEl, forceFallback: false });
    await outer.overlay.show();
    expect(showModalSpy).toHaveBeenCalledTimes(1);
    expect(outer.overlay.isUsingNativeTopLayer).toBe(true);
    await outer.overlay.hide();
    expect(closeSpy).toHaveBeenCalledTimes(1);

    // Forced fallback skips showModal()
    outer.forceFallback = true;
    outer.overlay.updateOptions({ forceFallback: true });
    await outer.overlay.show();
    expect(showModalSpy).toHaveBeenCalledTimes(1);
    expect(dialogEl.hasAttribute('data-mth-top-layer-fallback')).toBe(true);

    // Invoker command event toggles overlay
    const cmdEv = new Event('command') as Event & { command?: string };
    cmdEv.command = 'close';
    outer.dispatchEvent(cmdEv);
    await Promise.resolve();
    expect(outer.overlay.open).toBe(false);

    outer.remove();
    inner.remove();
  });

  it('PositioningController handles CSS Anchor native path AND JS fallback flip, shift, arrow, and virtual DOMRect anchors', async () => {
    const el = document.createElement('mth-test-overlay') as TestOverlayElement;
    document.body.appendChild(el);
    await el.updateComplete;

    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    const arrow = document.createElement('div');
    document.body.append(anchor, floating, arrow);

    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(950, 740, 80, 40),
    );
    vi.spyOn(floating, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 200, 120),
    );
    vi.spyOn(arrow, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 10, 10));

    const origInnerW = window.innerWidth;
    const origInnerH = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });

    // 1. JS Fallback path: placement="bottom" near bottom edge flips to "top" and shifts inside right edge
    const pos = new PositioningController(el, {
      anchor,
      floating: () => floating,
      arrow: () => arrow,
      placement: 'bottom',
      offset: 8,
      viewportPadding: 8,
      forceFallback: true,
    });
    const res = pos.start();
    expect(res).not.toBeNull();
    expect(res!.strategy).toBe('js-fallback');
    expect(res!.placement).toBe('top');
    // y = 740 - 120 - 8 = 612
    expect(res!.y).toBe(612);
    // x clamped to <= 1024 - 8 - 200 = 816
    expect(res!.x).toBe(816);
    expect(res!.arrowSide).toBe('bottom');
    expect(typeof res!.arrowX).toBe('number');
    pos.stop();

    // 2. Virtual DOMRect anchor
    pos.updateOptions({
      anchor: { getBoundingClientRect: () => new DOMRect(100, 100, 40, 20) },
      placement: 'bottom',
      forceFallback: true,
    });
    const virtualRes = pos.reposition();
    expect(virtualRes?.placement).toBe('bottom');
    expect(virtualRes?.y).toBe(128);

    // 3. Native CSS Anchor Positioning path when CSS.supports('position-area', ...) is true
    const origCss = globalThis.CSS;
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: {
        supports: (prop: string) => prop === 'position-area',
      },
    });
    pos.updateOptions({
      anchor,
      placement: 'bottom-start',
      forceFallback: false,
    });
    const nativeRes = pos.reposition();
    expect(nativeRes?.strategy).toBe('css-anchor');
    expect(floating.style.getPropertyValue('position-area')).toBe('block-end span-inline-end');

    Object.defineProperty(globalThis, 'CSS', { configurable: true, value: origCss });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: origInnerW });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: origInnerH });
    anchor.remove();
    floating.remove();
    arrow.remove();
    el.remove();
  });

  it('FocusTrapController traps Tab/Shift+Tab, pulls stray focus back, and restores prior focus', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open';
    const outside = document.createElement('button');
    outside.textContent = 'Outside';

    const container = document.createElement('mth-test-overlay') as TestOverlayElement;
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Last';
    container.append(btn1, btn2);
    document.body.append(trigger, outside, container);
    await container.updateComplete;

    trigger.focus();
    const trap = new FocusTrapController(container);
    trap.activate(container);
    expect(document.activeElement).toBe(btn1);

    // Tab from last wraps to first
    btn2.focus();
    const tabEv = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tabEv);
    expect(tabEv.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(btn1);

    // Shift+Tab from first wraps to last
    const shiftTabEv = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(shiftTabEv);
    expect(document.activeElement).toBe(btn2);

    // Stray focus outside pulls back inside
    outside.focus();
    expect(document.activeElement).toBe(btn1);

    // Deactivate restores trigger focus
    trap.deactivate();
    expect(document.activeElement).toBe(trigger);

    // delegatesFocus: true custom element does NOT create duplicate host + inner tab stops
    class DelegatesFocusHost extends UIElement {
      static override shadowRootOptions = {
        ...UIElement.shadowRootOptions,
        delegatesFocus: true,
      };
      override render() {
        return html`<button id="inner-btn">Inner Action</button>`;
      }
    }
    if (!customElements.get('mth-test-df')) {
      customElements.define('mth-test-df', DelegatesFocusHost);
    }
    const dfHost = document.createElement('mth-test-df') as DelegatesFocusHost;
    dfHost.setAttribute('tabindex', '0');
    const trapRoot = document.createElement('div');
    const tailBtn = document.createElement('button');
    tailBtn.textContent = 'Tail';
    trapRoot.append(dfHost, tailBtn);
    document.body.appendChild(trapRoot);
    await dfHost.updateComplete;

    const dfTabbables = collectTabbableElements(trapRoot);
    expect(dfTabbables).toHaveLength(2);
    expect(dfTabbables[0]?.id).toBe('inner-btn');
    expect(dfTabbables[1]).toBe(tailBtn);

    // Shift+Tab from inner-btn wraps cleanly to tailBtn (not stuck on dfHost)
    const dfTrap = new FocusTrapController(container, { container: () => trapRoot });
    dfTrap.activate(trapRoot);
    const innerBtn = dfHost.shadowRoot!.getElementById('inner-btn') as HTMLElement;
    innerBtn.focus();
    const wrapBack = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(wrapBack);
    expect(document.activeElement).toBe(tailBtn);
    dfTrap.deactivate();
    trapRoot.remove();

    trigger.remove();
    outside.remove();
    container.remove();
  });

  it('RovingFocusController passes RovingFocusSuite (LTR + RTL + loop + Home/End)', async () => {
    const report = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir = 'ltr') => {
        const el = document.createElement('mth-test-roving') as TestRovingElement;
        el.setAttribute('dir', dir);
        for (let i = 0; i < 3; i += 1) {
          const btn = document.createElement('button');
          btn.setAttribute('data-roving-item', '');
          btn.textContent = `Tab ${i + 1}`;
          el.appendChild(btn);
        }
        return el;
      },
      getItems: (el) => Array.from(el.querySelectorAll<HTMLElement>('[data-roving-item]')),
    });
    expect(report.passed).toBe(true);
  });

  it('ListboxController passes ListboxSuite conformance and supports roving & multi-select modes', async () => {
    const report = await ListboxSuite.run({
      mount: async () => {
        const el = document.createElement('mth-test-listbox') as TestListboxElement;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getListboxRoot: (el) => el.shadowRoot!,
      getOptions: (el) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
      getActiveOption: (el) => {
        const lb = el.shadowRoot!.querySelector('[role="listbox"]');
        const activeId = lb?.getAttribute('aria-activedescendant');
        return activeId ? el.shadowRoot!.getElementById(activeId) : null;
      },
      getSelectedOptions: (el) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[aria-selected="true"]')),
    });
    expect(report.passed).toBe(true);

    // Multi-char typeahead & disabled option skipping
    const lbEl = document.createElement('mth-test-listbox') as TestListboxElement;
    document.body.appendChild(lbEl);
    await lbEl.updateComplete;
    const listbox = lbEl.shadowRoot!.querySelector<HTMLElement>('[role="listbox"]')!;
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    // Cherry is aria-disabled="true", so activeIndex should NOT land on Cherry
    expect(lbEl.listbox.activeOption?.value).not.toBe('cherry');
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
    expect(lbEl.listbox.activeOption?.value).toBe('date');
    lbEl.remove();
  });

  it('MotionController handles cancelable mth-open/close and prefers-reduced-motion zero-duration settle', async () => {
    const el = document.createElement('mth-test-overlay') as TestOverlayElement;
    document.body.appendChild(el);
    await el.updateComplete;

    const origMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });

    const motion = new MotionController(el, {
      durationMs: 250,
      enterKeyframes: [{ opacity: 0 }, { opacity: 1 }],
      exitKeyframes: [{ opacity: 1 }, { opacity: 0 }],
    });
    expect(motion.isReducedMotion).toBe(true);

    const events: string[] = [];
    el.addEventListener('mth-open', () => events.push('mth-open'));
    el.addEventListener('mth-after-open', () => events.push('mth-after-open'));
    await motion.open();
    expect(motion.phase).toBe('open');
    expect(events).toEqual(['mth-open', 'mth-after-open']);
    // SSR Hydration Purity: MotionController never mutates Light-DOM attributes on host
    expect(el.hasAttribute('data-mth-motion')).toBe(false);

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: origMatchMedia,
    });
    el.remove();
  });
});
