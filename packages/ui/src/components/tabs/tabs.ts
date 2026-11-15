import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
} from '@methane-ui/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { tabsMessages } from './tabs.messages.js';
import { tabsStyles } from './tabs.styles.js';

export type MthTabsActivation = 'automatic' | 'manual';
export type MthTabsOrientation = 'horizontal' | 'vertical';

type TabLikeElement = HTMLElement & {
  value?: string;
  selected?: boolean;
  disabled?: boolean;
};

type TabPanelLikeElement = HTMLElement & {
  value?: string;
  active?: boolean;
};

let tabsInstanceCounter = 0;

function isTabElement(el: Element): el is TabLikeElement {
  return (
    el instanceof HTMLElement &&
    (el.tagName.toLowerCase() === 'mth-tab' || el.getAttribute('role') === 'tab')
  );
}

function isTabPanelElement(el: Element): el is TabPanelLikeElement {
  return (
    el instanceof HTMLElement &&
    (el.tagName.toLowerCase() === 'mth-tab-panel' || el.getAttribute('role') === 'tabpanel')
  );
}

function getElementValue(el: HTMLElement): string {
  const propVal = (el as TabLikeElement).value;
  if (typeof propVal === 'string' && propVal.length > 0) return propVal;
  return el.getAttribute('value') ?? '';
}

function isTabDisabled(el: HTMLElement): boolean {
  return (
    el.hasAttribute('disabled') ||
    el.getAttribute('aria-disabled') === 'true' ||
    (el as TabLikeElement).disabled === true
  );
}

/**
 * `<mth-tabs>`: APG tabbed navigation container composing `RovingFocusController`,
 * `SelectionController`, and `SlotCollectionController` with zero cross-root ARIA refs.
 */
export class MthTabs extends UIElement {
  static override messages = tabsMessages;
  static override styles = tabsStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String, reflect: true })
  activation: MthTabsActivation = 'automatic';

  @property({ type: String, reflect: true })
  orientation: MthTabsOrientation = 'horizontal';

  @property({ type: String })
  label = '';

  private readonly instanceId = `mth-tabs-${++tabsInstanceCounter}`;
  private readonly tabSlotCtrl: SlotCollectionController<TabLikeElement>;
  private readonly panelSlotCtrl: SlotCollectionController<TabPanelLikeElement>;
  private readonly rovingCtrl: RovingFocusController;
  private readonly selectionCtrl: SelectionController<string>;
  private suppressingChange = false;

  constructor() {
    super();
    this.tabSlotCtrl = new SlotCollectionController<TabLikeElement>(this, {
      slotName: 'tab',
      filter: isTabElement,
      attributeFilter: ['value', 'disabled', 'selected'],
      onItemsChange: () => {
        this.syncCollectionsAndAria();
      },
    });
    this.panelSlotCtrl = new SlotCollectionController<TabPanelLikeElement>(this, {
      filter: isTabPanelElement,
      attributeFilter: ['value', 'active'],
      onItemsChange: () => {
        this.syncCollectionsAndAria();
      },
    });
    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: false,
      onChange: (selected) => {
        const nextVal = selected[0] ?? '';
        const changed = this.value !== nextVal;
        this.value = nextVal;
        this.syncTabAndPanelStates();
        if (!this.suppressingChange && changed) {
          this.emitEvent('mth-change', { detail: { value: nextVal } });
        }
      },
    });
    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.tabSlotCtrl.slottedElements,
      orientation: 'horizontal',
      loop: true,
      onActiveChange: (item) => {
        if (this.activation === 'automatic' && item && !isTabDisabled(item)) {
          const val = getElementValue(item);
          if (val && val !== this.value) {
            this.selectionCtrl.select(val);
          }
        }
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
    this.syncCollectionsAndAria();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncCustomStates();

    if (changed.has('orientation')) {
      this.rovingCtrl.updateOptions({
        orientation: this.orientation,
        loop: true,
      });
    }

    if (changed.has('value') && this.value) {
      this.suppressingChange = true;
      this.selectionCtrl.setSelection([this.value]);
      this.suppressingChange = false;
      const idx = this.tabSlotCtrl.slottedElements.findIndex(
        (t) => getElementValue(t) === this.value && !isTabDisabled(t),
      );
      if (idx !== -1 && idx !== this.rovingCtrl.currentIndex) {
        this.rovingCtrl.setActiveIndex(idx, false);
      }
      this.syncTabAndPanelStates();
    }
  }

  /** Returns the currently slotted tab elements in DOM order. */
  getTabs(): ReadonlyArray<HTMLElement> {
    return this.tabSlotCtrl.slottedElements;
  }

  /** Selects a tab by value if present and enabled. */
  select(value: string): void {
    const tab = this.tabSlotCtrl.slottedElements.find((t) => getElementValue(t) === value);
    if (!tab || isTabDisabled(tab)) return;
    const idx = this.tabSlotCtrl.slottedElements.indexOf(tab);
    if (idx !== -1) {
      this.rovingCtrl.setActiveIndex(idx, false);
    }
    this.selectionCtrl.select(value);
  }

  private syncCustomStates(): void {
    this.setCustomState('vertical', this.orientation === 'vertical');
  }

  private syncCollectionsAndAria(): void {
    const tabs = this.tabSlotCtrl.slottedElements;
    const panels = this.panelSlotCtrl.slottedElements;

    this.selectionCtrl.setItems(
      tabs
        .map((t) => ({ value: getElementValue(t), disabled: isTabDisabled(t) }))
        .filter((item) => item.value.length > 0),
    );

    if (!this.value && tabs.length > 0) {
      const firstEnabled = tabs.find((t) => !isTabDisabled(t));
      const initialVal = firstEnabled ? getElementValue(firstEnabled) : '';
      if (initialVal) {
        this.suppressingChange = true;
        this.value = initialVal;
        this.selectionCtrl.setSelection([initialVal]);
        this.suppressingChange = false;
      }
    }

    const panelByValue = new Map<string, TabPanelLikeElement>();
    for (let i = 0; i < panels.length; i += 1) {
      const panel = panels[i]!;
      const pVal = getElementValue(panel);
      if (pVal) {
        panelByValue.set(pVal, panel);
      }
    }

    for (let i = 0; i < tabs.length; i += 1) {
      const tab = tabs[i]!;
      const val = getElementValue(tab);
      const panel = val ? panelByValue.get(val) : undefined;
      if (panel && tab.getRootNode() === panel.getRootNode()) {
        if (!tab.id) tab.id = `${this.instanceId}-tab-${i}`;
        if (!panel.id) panel.id = `${this.instanceId}-panel-${i}`;
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', tab.id);
      } else {
        tab.removeAttribute('aria-controls');
      }
    }

    this.rovingCtrl.syncTabIndices();
    this.syncTabAndPanelStates();
  }

  private syncTabAndPanelStates(): void {
    const tabs = this.tabSlotCtrl.slottedElements;
    const panels = this.panelSlotCtrl.slottedElements;

    for (const tab of tabs) {
      const isSelected = getElementValue(tab) === this.value && this.value.length > 0;
      tab.selected = isSelected;
    }

    for (const panel of panels) {
      const isActive = getElementValue(panel) === this.value && this.value.length > 0;
      panel.active = isActive;
    }
  }

  private readonly handleTabClick = (event: MouseEvent): void => {
    const tabs = this.tabSlotCtrl.slottedElements;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const idx = tabs.findIndex(
      (tab) => tab === event.target || path.includes(tab) || tab.contains(event.target as Node),
    );
    if (idx === -1) return;
    const tab = tabs[idx]!;
    if (isTabDisabled(tab)) return;
    this.rovingCtrl.setActiveIndex(idx, true);
    const val = getElementValue(tab);
    if (val && val !== this.value) {
      this.selectionCtrl.select(val);
    }
  };

  private readonly handleTabKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const tabs = this.tabSlotCtrl.slottedElements;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const idx = tabs.findIndex(
      (tab) => tab === event.target || path.includes(tab) || tab.contains(event.target as Node),
    );
    if (idx === -1) return;
    const tab = tabs[idx]!;
    if (isTabDisabled(tab)) return;
    event.preventDefault();
    const val = getElementValue(tab);
    if (val && val !== this.value) {
      this.selectionCtrl.select(val);
    }
  };

  private readonly handlePanelKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.stopPropagation();
    }
  };

  override render() {
    const ariaLabel = this.label.trim() || this.t('tablistLabel');
    return html`
      <div part="base">
        <div
          part="tablist"
          role="tablist"
          aria-orientation=${this.orientation}
          aria-label=${ariaLabel}
          @click=${this.handleTabClick}
          @keydown=${this.handleTabKeyDown}
        >
          <slot name="tab"></slot>
        </div>
        <div part="panels" @keydown=${this.handlePanelKeyDown}>
          <slot></slot>
        </div>
      </div>
    `;
  }
}
