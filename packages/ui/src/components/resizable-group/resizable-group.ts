import { UIElement, type PropertyValues, html, property, query } from '@methane/core';
import { SlotCollectionController } from '@methane/primitives';
import { resizableGroupMessages } from './resizable-group.messages.js';
import { resizableGroupStyles } from './resizable-group.styles.js';

export type MthResizableGroupOrientation = 'horizontal' | 'vertical';

interface ResizablePanelLike extends HTMLElement {
  defaultSize: number;
  size: number;
  minSize: number;
  maxSize: number;
  collapsible: boolean;
  collapsed: boolean;
}

interface ResizableHandleLike extends HTMLElement {
  orientation: MthResizableGroupOrientation;
  disabled: boolean;
  valueNow: number;
  valueMin: number;
  valueMax: number;
}

interface HandleResizeDelta {
  readonly deltaPercent?: number;
  readonly deltaPx?: number;
  readonly edge?: 'min' | 'max';
}

function isPanelElement(el: Element): el is ResizablePanelLike {
  return el.tagName.toLowerCase().endsWith('-resizable-panel');
}

function isHandleElement(el: Element): el is ResizableHandleLike {
  return el.tagName.toLowerCase().endsWith('-resizable-handle');
}

/**
 * Coordinates multi-panel resizable layouts across `<mth-resizable-panel>` and `<mth-resizable-handle>`.
 */
export class MthResizableGroup extends UIElement {
  static override styles = resizableGroupStyles;
  static override messages = resizableGroupMessages;

  @property({ type: String, reflect: true })
  orientation: MthResizableGroupOrientation = 'horizontal';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @query('[part="base"]')
  private baseEl!: HTMLElement | null;

  private readonly slotCtrl: SlotCollectionController<HTMLElement>;
  private readonly groupDisabledHandles = new WeakSet<HTMLElement>();

  constructor() {
    super();
    this.slotCtrl = new SlotCollectionController<HTMLElement>(this, {
      selector: '*',
      onItemsChange: () => {
        if (Boolean(this.shadowRoot) && !this.hasUpdated) return;
        this.syncChildrenLayout(false);
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mth-resize-delta', this.handleResizeDelta);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('mth-resize-delta', this.handleResizeDelta);
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (changed.has('orientation') || changed.has('disabled')) {
      this.syncChildrenLayout(false);
    }
  }

  private getPanelsAndHandles(): {
    children: HTMLElement[];
    panels: ResizablePanelLike[];
    handles: ResizableHandleLike[];
  } {
    const children =
      this.slotCtrl.slottedElements.length > 0
        ? [...this.slotCtrl.slottedElements]
        : (Array.from(this.children ?? []) as HTMLElement[]);
    const panels = children.filter(isPanelElement);
    const handles = children.filter(isHandleElement);
    return { children, panels, handles };
  }

  private syncChildrenLayout(emit: boolean): void {
    const { children, panels, handles } = this.getPanelsAndHandles();
    if (panels.length > 0) {
      const hasCustomDefaults = panels.some((p) => p.hasAttribute('default-size'));
      const totalDefault = panels.reduce(
        (acc, p) => acc + (Number.isFinite(p.defaultSize) ? p.defaultSize : 0),
        0,
      );
      const equalShare = 100 / panels.length;
      for (const panel of panels) {
        if (!panel.hasAttribute('size')) {
          panel.size =
            hasCustomDefaults && totalDefault > 0
              ? Math.round(((panel.defaultSize / totalDefault) * 100) * 100) / 100
              : Math.round(equalShare * 100) / 100;
        }
      }
    }

    for (const handle of handles) {
      handle.orientation = this.orientation;
      if (this.disabled) {
        if (!handle.disabled) {
          this.groupDisabledHandles.add(handle);
          handle.disabled = true;
        }
      } else if (this.groupDisabledHandles.has(handle)) {
        this.groupDisabledHandles.delete(handle);
        handle.disabled = false;
      }
      const idx = children.indexOf(handle);
      const prevPanel = [...children.slice(0, idx)].reverse().find(isPanelElement);
      if (prevPanel) {
        handle.valueNow = prevPanel.collapsed ? 0 : prevPanel.size;
        handle.valueMin = prevPanel.collapsible ? 0 : prevPanel.minSize;
        handle.valueMax = prevPanel.maxSize;
      }
    }

    if (emit && panels.length > 0) {
      this.emitEvent('mth-layout', {
        detail: { sizes: panels.map((p) => (p.collapsed ? 0 : p.size)) },
      });
    }
  }

  private readonly handleResizeDelta = (event: Event): void => {
    const detail = (event as CustomEvent<HandleResizeDelta>).detail;
    const handle = event.target;
    if (!(handle instanceof HTMLElement) || !isHandleElement(handle) || this.disabled) return;

    event.stopPropagation();
    const { children, panels } = this.getPanelsAndHandles();
    const handleIdx = children.indexOf(handle);
    if (handleIdx === -1) return;

    const prevPanel = [...children.slice(0, handleIdx)].reverse().find(isPanelElement);
    const nextPanel = children.slice(handleIdx + 1).find(isPanelElement);
    if (!prevPanel || !nextPanel) return;

    let delta = detail.deltaPercent ?? 0;
    if (delta === 0 && typeof detail.deltaPx === 'number') {
      const rect = this.baseEl?.getBoundingClientRect();
      const totalPx = this.orientation === 'vertical' ? rect?.height ?? 0 : rect?.width ?? 0;
      if (totalPx > 0) {
        delta = (detail.deltaPx / totalPx) * 100;
      }
    }

    const combined =
      (prevPanel.collapsed ? 0 : prevPanel.size) + (nextPanel.collapsed ? 0 : nextPanel.size);

    let nextPrevSize = prevPanel.collapsed ? 0 : prevPanel.size;
    if (detail.edge === 'min') {
      nextPrevSize = prevPanel.collapsible ? 0 : prevPanel.minSize;
    } else if (detail.edge === 'max') {
      nextPrevSize = Math.min(prevPanel.maxSize, combined - (nextPanel.collapsible ? 0 : nextPanel.minSize));
    } else {
      nextPrevSize += delta;
    }

    const minAllowedPrev = prevPanel.collapsible ? 0 : prevPanel.minSize;
    const maxAllowedPrev = Math.min(
      prevPanel.maxSize,
      combined - (nextPanel.collapsible ? 0 : nextPanel.minSize),
    );
    nextPrevSize = Math.min(maxAllowedPrev, Math.max(minAllowedPrev, nextPrevSize));
    const nextAfterSize = Math.max(0, combined - nextPrevSize);

    prevPanel.collapsed = prevPanel.collapsible && nextPrevSize <= 0.01;
    nextPanel.collapsed = nextPanel.collapsible && nextAfterSize <= 0.01;
    prevPanel.size = Math.round(nextPrevSize * 100) / 100;
    nextPanel.size = Math.round(nextAfterSize * 100) / 100;
    handle.valueNow = prevPanel.collapsed ? 0 : prevPanel.size;

    this.emitEvent('mth-layout', {
      detail: { sizes: panels.map((p) => (p.collapsed ? 0 : p.size)) },
    });
  };

  override render() {
    return html`<div part="base"><slot></slot></div>`;
  }
}
