import { UIElement, getRuntime, html, registerLocaleMessages } from '@methane-ui/core';
import { describe, expect, it, vi } from 'vitest';
import {
  AutoLoader,
  CalendarCore,
  ClipboardAndShare,
  ContextProtocol,
  DragSortController,
  FormattingUtils,
  HotkeyController,
  HotkeyManager,
  LiveAnnouncer,
  NotificationStore,
  NotificationStoreController,
  ObserverPoolController,
  TableCore,
  ThemeContextProviderController,
  VirtualizerController,
  consumeThemeContext,
  expandRRule,
  getFirstDayOfWeek,
  normalizeCombo,
  registerUtilityElements,
} from './index.js';

class TestHarnessElement extends UIElement {
  themeConsumer = consumeThemeContext(this);

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('mth-test-harness')) {
  customElements.define('mth-test-harness', TestHarnessElement);
}

describe('Deliverable 4: Virtualizer, Table, Calendar, DragSort, Observers, Context, Notifications, Hotkeys, Utilities', () => {
  it('VirtualizerController supports 1D variable heights with scroll anchoring and 2D grid windowing', async () => {
    const host = document.createElement('mth-test-harness') as TestHarnessElement;
    document.body.appendChild(host);
    await host.updateComplete;

    const virt = new VirtualizerController(host, {
      count: 100,
      estimateSize: (i) => (i % 2 === 0 ? 40 : 60),
      columns: 10,
      estimateColumnSize: 100,
      overscan: 1,
    });
    virt.setViewport(200, 350);
    expect(virt.totalSize).toBe(5000);
    expect(virt.totalWidth).toBe(1000);

    virt.setScrollPosition(300, 150);
    const items = virt.getVirtualItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.index).toBeLessThanOrEqual(6);

    // Measure item above viewport (index 0: 40 -> 90, delta +50): scrollTop adjusts +50 for anchoring
    virt.measureItem(0, 90);
    expect(virt.currentScrollTop).toBe(350);

    // 2D Grid cells
    const cells = virt.getVirtualGridCells();
    expect(cells.length).toBeGreaterThan(items.length);
    expect(cells[0]!.colSize).toBe(100);

    host.remove();
  });

  it('TableCore handles sorting, filtering, selection checkState, column pinning offsets, resizing, and expansion', () => {
    interface UserRow {
      id: string;
      name: string;
      score: number;
    }

    const rows: UserRow[] = [
      { id: '1', name: 'Charlie', score: 20 },
      { id: '2', name: 'Alice', score: 90 },
      { id: '3', name: 'Bob', score: 50 },
    ];

    const table = new TableCore<UserRow>({
      rows,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.name, width: 140, pin: 'left' },
        { id: 'score', header: 'Score', accessor: (r) => r.score, width: 100, minWidth: 60 },
        { id: 'actions', header: 'Actions', accessor: (r) => r.id, width: 80, pin: 'right' },
      ],
    });

    table.toggleSort('score');
    expect(table.getProcessedRows().map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    table.toggleSort('score');
    expect(table.getProcessedRows().map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);

    table.setGlobalFilter('bo');
    expect(table.getProcessedRows().map((r) => r.id)).toEqual(['3']);
    table.setGlobalFilter('');

    table.toggleRowSelected('2');
    expect(table.getSelectionCheckState()).toBe('indeterminate');
    table.toggleAllRowsSelected();
    expect(table.getSelectionCheckState()).toBe('checked');

    const cols = table.getResolvedColumns();
    expect(cols[0]!.stickyOffset).toBe(0);
    expect(cols[2]!.stickyOffset).toBe(0);
    expect(table.resizeColumn('score', 30)).toBe(60); // Clamped to minWidth 60

    table.toggleRowExpanded('1');
    expect(table.isRowExpanded('1')).toBe(true);
  });

  it('CalendarCore computes locale week starts, range selection, and RFC 5545 RRULE expansion', () => {
    expect(getFirstDayOfWeek('en-US')).toBe(0);
    expect(getFirstDayOfWeek('de-DE')).toBe(1);

    const cal = new CalendarCore({
      locale: 'en-US',
      mode: 'range',
      initialFocusDate: { year: 2026, month: 3, day: 15 },
      isDateDisabled: (d) => d.day === 10,
    });

    expect(cal.getWeekdayHeaders('short')).toHaveLength(7);
    expect(cal.isDisabled({ year: 2026, month: 3, day: 10 })).toBe(true);

    // Reverse range selection auto-orders start <= end
    cal.selectDate({ year: 2026, month: 3, day: 20 });
    cal.selectDate({ year: 2026, month: 3, day: 12 });
    expect(cal.rangeStart).toEqual({ year: 2026, month: 3, day: 12 });
    expect(cal.rangeEnd).toEqual({ year: 2026, month: 3, day: 20 });

    const grid = cal.getMonthGrid(2026, 3);
    expect(grid).toHaveLength(6);
    const inRangeCount = grid.flat().filter((c) => c.isInRange).length;
    expect(inRangeCount).toBe(9);

    const occ = expandRRule(
      'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=4',
      { year: 2026, month: 3, day: 2 },
      { year: 2026, month: 3, day: 31 },
    );
    expect(occ).toEqual([
      { year: 2026, month: 3, day: 2 },
      { year: 2026, month: 3, day: 4 },
      { year: 2026, month: 3, day: 6 },
      { year: 2026, month: 3, day: 9 },
    ]);
  });

  it('DragSortController supports pointer drag reorder and accessible keyboard Space + Arrow + Escape cancel', async () => {
    const host = document.createElement('mth-test-harness') as TestHarnessElement;
    const itemA = document.createElement('div');
    itemA.tabIndex = 0;
    const itemB = document.createElement('div');
    itemB.tabIndex = 0;
    host.append(itemA, itemB);
    document.body.appendChild(host);
    await host.updateComplete;

    const reorders: Array<{ from: number; to: number }> = [];
    new DragSortController(host, {
      getItems: () => Array.from(host.children) as HTMLElement[],
      onReorder: ({ fromIndex, toIndex }) => {
        reorders.push({ from: fromIndex, to: toIndex });
      },
    });

    // Space grabs item 0, ArrowDown reorders 0 -> 1 (keeping data-grabbed on moved item), Escape cancels back 1 -> 0
    itemA.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(itemA.getAttribute('data-grabbed')).toBe('true');
    expect(itemA.hasAttribute('aria-grabbed')).toBe(false);
    itemA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(reorders[0]).toEqual({ from: 0, to: 1 });
    expect(itemB.getAttribute('data-grabbed')).toBe('true');
    expect(LiveAnnouncer.getLastAnnouncement()?.message).toBe(
      'Moved to position \u20682\u2069 of \u20682\u2069.',
    );

    itemA.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(reorders[1]).toEqual({ from: 1, to: 0 });
    expect(LiveAnnouncer.getLastAnnouncement()?.message).toBe('Reorder cancelled.');

    // RTL horizontal keyboard reorder flips ArrowLeft/ArrowRight
    const rtlHost = document.createElement('mth-test-harness') as TestHarnessElement;
    rtlHost.setAttribute('dir', 'rtl');
    const r0 = document.createElement('div');
    const r1 = document.createElement('div');
    rtlHost.append(r0, r1);
    document.body.appendChild(rtlHost);
    await rtlHost.updateComplete;
    const rtlReorders: Array<{ from: number; to: number }> = [];
    new DragSortController(rtlHost, {
      getItems: () => Array.from(rtlHost.children) as HTMLElement[],
      orientation: 'horizontal',
      dir: 'auto',
      onReorder: ({ fromIndex, toIndex }) => {
        rtlReorders.push({ from: fromIndex, to: toIndex });
      },
    });
    r0.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    r0.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(rtlReorders[0]).toEqual({ from: 0, to: 1 });
    rtlHost.remove();

    // Pointer capture drag reorder
    vi.spyOn(itemA, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 40));
    vi.spyOn(itemB, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 40, 100, 40));
    const PointerEv = typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
    itemA.dispatchEvent(new PointerEv('pointerdown', { button: 0, clientY: 10, bubbles: true }));
    document.dispatchEvent(new PointerEv('pointermove', { clientY: 70, bubbles: true }));
    document.dispatchEvent(new PointerEv('pointerup', { clientY: 70, bubbles: true }));
    expect(reorders[2]).toEqual({ from: 0, to: 1 });

    host.remove();
  });

  it('ObserverPoolController, ContextProtocol, NotificationStoreController, and HotkeyController manage lifecycles cleanly', async () => {
    vi.useFakeTimers();

    const providerEl = document.createElement('mth-test-harness') as TestHarnessElement;
    const themeCtrl = new ThemeContextProviderController(providerEl, {
      theme: 'dark',
      density: 'compact',
      dir: 'rtl',
    });
    const childEl = document.createElement('mth-test-harness') as TestHarnessElement;
    providerEl.appendChild(childEl);
    document.body.appendChild(providerEl);
    await providerEl.updateComplete;
    await childEl.updateComplete;

    expect(providerEl.getAttribute('data-theme')).toBe('dark');
    expect(childEl.themeConsumer.value?.density).toBe('compact');
    themeCtrl.update({ density: 'comfortable' });
    await childEl.updateComplete;
    expect(childEl.themeConsumer.value?.density).toBe('comfortable');

    // ObserverPoolController idle & click-outside
    let idleState = false;
    const pool = new ObserverPoolController(childEl, {
      idleTimeoutMs: 1000,
      onIdleChange: (idle) => {
        idleState = idle;
      },
    });
    pool.hostConnected();
    vi.advanceTimersByTime(1100);
    expect(idleState).toBe(true);
    let outsideFired = false;
    pool.observeClickOutside(childEl, () => {
      outsideFired = true;
    });
    const PointerEv = typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
    document.body.dispatchEvent(new PointerEv('pointerdown', { bubbles: true }));
    expect(outsideFired).toBe(true);

    // NotificationStoreController dedupe + pause/resume auto-dismiss
    const store = new NotificationStoreController(childEl);
    store.clear();
    const n1 = store.notify({ dedupeKey: 'save', message: 'Saving...', durationMs: 1000 });
    const n2 = store.notify({ dedupeKey: 'save', message: 'Saved!', durationMs: 1000 });
    expect(store.items).toHaveLength(1);
    expect(store.items[0]!.id).not.toBe(n1.id);
    store.pause(n2.id);
    vi.advanceTimersByTime(1500);
    expect(store.items).toHaveLength(1);
    store.resume(n2.id);
    vi.advanceTimersByTime(1100);
    expect(store.items).toHaveLength(0);

    // HotkeyController IME guard + input exclusion + combo matching
    let shortcutCalls = 0;
    const hotkeys = new HotkeyController(childEl, [
      {
        id: 'search',
        combo: 'Ctrl+K',
        handler: () => {
          shortcutCalls += 1;
        },
      },
    ]);
    expect(normalizeCombo('Mod+K', true)).toBe('meta+k');
    expect(normalizeCombo('Mod+K', false)).toBe('ctrl+k');
    hotkeys.hostConnected();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, isComposing: true, bubbles: true }),
    );
    expect(shortcutCalls).toBe(0);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
    );
    expect(shortcutCalls).toBe(1);

    providerEl.remove();
    vi.useRealTimers();
  });

  it('ClipboardAndShare, FormattingUtils, LiveAnnouncer.announceI18n, AutoLoader, and utility elements work end-to-end', async () => {
    const shareRes = await ClipboardAndShare.share({
      title: 'Methane',
      url: 'https://example.com',
    });
    // In JSDOM navigator.share & clipboard are usually absent or mocked
    expect(['web-share', 'clipboard-fallback', 'none']).toContain(shareRes.method);

    expect(FormattingUtils.formatCurrency(1234.5, 'USD', 'en-US')).toBe('$1,234.50');
    expect(FormattingUtils.formatCompactNumber(1500, 'en-US')).toMatch(/1\.5K/i);
    expect(FormattingUtils.selectPluralCategory(1, 'en-US')).toBe('one');
    expect(FormattingUtils.formatList(['A', 'B', 'C'], 'en-US')).toContain('A');

    const announced = LiveAnnouncer.announceI18n('Hello {name}', {
      locale: 'ar',
      params: { name: 'UI' },
      politeness: 'assertive',
    });
    expect(announced).toBe('Hello \u2068UI\u2069');
    expect(LiveAnnouncer.getLastAnnouncement()?.politeness).toBe('assertive');

    // Catalog + namespace lookup (verifies defaults are passed rather than ignored)
    const catalogMsg = LiveAnnouncer.announceI18n('movedItem', {
      namespace: 'test-dnd',
      locale: 'es',
      params: { index: 3 },
      catalog: { movedItem: 'Movido al lugar {index}' },
      politeness: 'assertive',
    });
    expect(catalogMsg).toBe('Movido al lugar \u20683\u2069');
    // Only a single assertive live region managed via getRuntime().announcer
    expect(document.body.querySelectorAll('[aria-live="assertive"]')).toHaveLength(1);

    // Export aliases per Section 3 naming
    expect(ContextProtocol.THEME_CONTEXT).toBeDefined();
    expect(NotificationStore).toBe(NotificationStoreController);
    expect(HotkeyManager).toBe(HotkeyController);

    // AutoLoader deduplicated tag discovery
    const loadSpy = vi.fn(async () => {
      // Simulate lazy registration
    });
    const loader = new AutoLoader({
      loaders: {
        'mth-lazy-widget': loadSpy,
      },
    });
    const lazyHost = document.createElement('div');
    const lazyTag = document.createElement('mth-lazy-widget');
    lazyHost.appendChild(lazyTag);
    document.body.appendChild(lazyHost);

    const scopedLoader = new AutoLoader({
      root: lazyHost,
      loaders: { 'mth-lazy-widget': loadSpy },
    });
    await scopedLoader.start();
    expect(loadSpy).toHaveBeenCalledTimes(1);
    scopedLoader.stop();
    loader.stop();
    lazyHost.remove();

    // Utility elements: <mth-visually-hidden>, <mth-skip-link>, <mth-error-boundary> + re-prefixing
    registerUtilityElements('mth');
    const customUtilityTags = registerUtilityElements('acme');
    expect(customUtilityTags).toEqual([
      'acme-visually-hidden',
      'acme-skip-link',
      'acme-error-boundary',
    ]);
    getRuntime().registry.prefix = 'mth';
    registerLocaleMessages('fr', 'mth-skip-link', { skipToMain: 'Aller au contenu' });
    const main = document.createElement('main');
    main.id = 'main-content';
    const skip = document.createElement('mth-skip-link');
    skip.setAttribute('href', '#main-content');
    const sr = document.createElement('mth-visually-hidden');
    sr.textContent = 'Screen reader label';
    const boundary = document.createElement('mth-error-boundary') as HTMLElement & {
      hasError: boolean;
      capture: (e: unknown) => void;
      reset: () => void;
    };
    const child = document.createElement('span');
    child.textContent = 'Safe content';
    boundary.appendChild(child);

    document.body.append(skip, sr, main, boundary);
    await (skip as unknown as UIElement).updateComplete;
    await (boundary as unknown as UIElement).updateComplete;

    const anchor = skip.shadowRoot!.querySelector('a')!;
    anchor.click();
    expect(document.activeElement).toBe(main);

    boundary.capture(new Error('Boom'));
    await (boundary as unknown as UIElement).updateComplete;
    expect(boundary.hasError).toBe(true);
    expect(boundary.shadowRoot!.querySelector('[role="alert"]')?.textContent).toContain('Boom');

    const resetEvents = vi.fn();
    boundary.addEventListener('mth-reset', resetEvents);
    boundary.reset();
    await (boundary as unknown as UIElement).updateComplete;
    expect(boundary.hasError).toBe(false);
    expect(resetEvents).toHaveBeenCalledTimes(1);

    skip.remove();
    sr.remove();
    main.remove();
    boundary.remove();
  });
});
