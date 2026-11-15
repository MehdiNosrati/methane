import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface FocusTrapControllerOptions {
  container?: () => HTMLElement | null;
  restoreFocus?: boolean;
  initialFocus?: () => HTMLElement | null;
}

/**
 * Traps keyboard Tab navigation inside a container (piercing Shadow DOM roots),
 * tracks keyboard vs pointer focus-visible modality, and restores prior focus on release.
 */
export class FocusTrapController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private options: FocusTrapControllerOptions;
  private _active = false;
  private _focusVisible = false;
  private previousActiveElement: HTMLElement | null = null;
  private containerEl: HTMLElement | null = null;

  constructor(host: ReactiveControllerHost & HTMLElement, options: FocusTrapControllerOptions = {}) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get active(): boolean {
    return this._active;
  }

  get focusVisible(): boolean {
    return this._focusVisible;
  }

  hostConnected(): void {
    if (this._active) {
      this.attachListeners();
    }
  }

  hostDisconnected(): void {
    this.detachListeners();
  }

  activate(container?: HTMLElement | null): void {
    this.containerEl = container ?? this.options.container?.() ?? this.host;
    if (!this._active) {
      this.previousActiveElement = getDeepActiveElement();
      this._active = true;
      this.attachListeners();
      const target =
        this.options.initialFocus?.() ?? getFirstTabbable(this.containerEl) ?? this.containerEl;
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
      this.host.requestUpdate();
    }
  }

  deactivate(): void {
    if (!this._active) return;
    this._active = false;
    this.detachListeners();
    if (this.options.restoreFocus !== false && this.previousActiveElement) {
      if (this.previousActiveElement.isConnected && typeof this.previousActiveElement.focus === 'function') {
        this.previousActiveElement.focus();
      }
    }
    this.previousActiveElement = null;
    this.host.requestUpdate();
  }

  getTabbableElements(): HTMLElement[] {
    const root = this.containerEl ?? this.options.container?.() ?? this.host;
    return collectTabbableElements(root);
  }

  private attachListeners(): void {
    const doc = this.host.ownerDocument ?? document;
    doc.addEventListener('keydown', this.handleKeyDown, true);
    doc.addEventListener('pointerdown', this.handlePointerDown, true);
    doc.addEventListener('focusin', this.handleFocusIn, true);
  }

  private detachListeners(): void {
    const doc = this.host.ownerDocument ?? document;
    doc.removeEventListener('keydown', this.handleKeyDown, true);
    doc.removeEventListener('pointerdown', this.handlePointerDown, true);
    doc.removeEventListener('focusin', this.handleFocusIn, true);
  }

  private readonly handlePointerDown = (): void => {
    if (this._focusVisible) {
      this._focusVisible = false;
      this.host.requestUpdate();
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this._focusVisible = true;
    if (!this._active || event.key !== 'Tab') return;

    const root = this.containerEl ?? this.options.container?.() ?? this.host;
    const tabbables = collectTabbableElements(root);
    if (tabbables.length === 0) {
      event.preventDefault();
      return;
    }

    const active = getDeepActiveElement();
    const first = tabbables[0]!;
    const last = tabbables[tabbables.length - 1]!;
    const idx = active ? tabbables.indexOf(active) : -1;

    if (event.shiftKey) {
      if (idx <= 0) {
        event.preventDefault();
        last.focus();
      }
    } else if (idx === -1 || idx >= tabbables.length - 1) {
      event.preventDefault();
      first.focus();
    }
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (!this._active) return;
    const root = this.containerEl ?? this.options.container?.() ?? this.host;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const inside = path.includes(root) || (event.target instanceof Node && root.contains(event.target));
    if (!inside) {
      const target = getFirstTabbable(root) ?? root;
      target.focus();
    }
  };
}

export function getDeepActiveElement(doc: Document = document): HTMLElement | null {
  let active = doc.activeElement as HTMLElement | null;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement as HTMLElement | null;
  }
  return active;
}

export function getFirstTabbable(root: HTMLElement): HTMLElement | null {
  return collectTabbableElements(root)[0] ?? null;
}

export function collectTabbableElements(root: ParentNode): HTMLElement[] {
  const result: HTMLElement[] = [];

  const collectInto = (node: ParentNode, out: HTMLElement[]): void => {
    const rawChildren: Element[] =
      typeof HTMLSlotElement !== 'undefined' && node instanceof HTMLSlotElement
        ? node.assignedElements({ flatten: true })
        : Array.from((node as Element).children ?? []);

    for (const child of rawChildren) {
      if (!(child instanceof HTMLElement)) continue;
      if (isHidden(child) || child.hasAttribute('disabled') || child.hasAttribute('inert')) {
        continue;
      }

      if (typeof HTMLSlotElement !== 'undefined' && child instanceof HTMLSlotElement) {
        collectInto(child, out);
        continue;
      }

      if (child.shadowRoot) {
        const innerTabbables: HTMLElement[] = [];
        collectInto(child.shadowRoot, innerTabbables);
        const delegatesFocus = hasDelegatesFocus(child, child.shadowRoot);
        if (isNaturallyOrExplicitlyTabbable(child) && !(delegatesFocus && innerTabbables.length > 0)) {
          out.push(child);
        }
        out.push(...innerTabbables);
      } else {
        if (isNaturallyOrExplicitlyTabbable(child)) {
          out.push(child);
        }
        collectInto(child, out);
      }
    }
  };

  if (root instanceof HTMLElement && root.shadowRoot) {
    collectInto(root.shadowRoot, result);
  } else {
    collectInto(root, result);
  }
  return result;
}

function hasDelegatesFocus(host: HTMLElement, shadowRoot: ShadowRoot): boolean {
  const srFlag = (shadowRoot as ShadowRoot & { delegatesFocus?: boolean }).delegatesFocus;
  if (srFlag !== undefined) return Boolean(srFlag);
  const ctor = host.constructor as { shadowRootOptions?: { delegatesFocus?: boolean } };
  return Boolean(ctor.shadowRootOptions?.delegatesFocus);
}

function isHidden(el: HTMLElement): boolean {
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return true;
  return false;
}

function isNaturallyOrExplicitlyTabbable(el: HTMLElement): boolean {
  const explicitTab = el.getAttribute('tabindex');
  if (explicitTab !== null) {
    const parsed = Number.parseInt(explicitTab, 10);
    return !Number.isNaN(parsed) && parsed >= 0;
  }
  const tag = el.tagName;
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    return !(el as HTMLButtonElement).disabled && (el as HTMLInputElement).type !== 'hidden';
  }
  if (tag === 'A' || tag === 'AREA') {
    return el.hasAttribute('href');
  }
  return el.isContentEditable;
}
