import { getRuntime } from '@methane-ui/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { getDeepActiveElement } from './focus-trap-controller.js';
import { MotionController, type MotionControllerOptions } from './motion-controller.js';

export type OverlayMode = 'dialog' | 'popover' | 'non-modal';
export type OverlayCloseReason = 'escape' | 'outside' | 'programmatic' | 'invoker';

export interface OverlayControllerOptions {
  mode?: OverlayMode;
  surface?: () => HTMLElement | null;
  trigger?: () => HTMLElement | null;
  closeOnEscape?: boolean;
  lightDismiss?: boolean;
  restoreFocus?: boolean;
  forceFallback?: boolean;
  motion?: MotionControllerOptions;
  onOpenChange?: (open: boolean, reason?: OverlayCloseReason) => void;
  onSetCustomState?: (name: string, active: boolean) => void;
}

let overlayCounter = 0;

/**
 * Coordinates `<dialog>` & `[popover]` top-layer lifecycles (with non-top-layer fallback),
 * nested Escape stack via `getRuntime().overlays`, light-dismiss, focus return, and Invoker Commands.
 */
export class OverlayController implements ReactiveController {
  readonly id: string;
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly motion: MotionController;
  private options: OverlayControllerOptions;
  private _open = false;
  private _usingNativeTopLayer = false;
  private previousFocusedElement: HTMLElement | null = null;
  private closing = false;
  private opening = false;

  constructor(host: ReactiveControllerHost & HTMLElement, options: OverlayControllerOptions = {}) {
    this.id = `mth-overlay-${++overlayCounter}`;
    this.host = host;
    this.options = options;
    this.motion = new MotionController(host, {
      target: () => this.resolveSurface(),
      ...(options.onSetCustomState ? { onSetCustomState: options.onSetCustomState } : {}),
      ...options.motion,
    });
    this.host.addController(this);
  }

  get open(): boolean {
    return this._open;
  }

  get mode(): OverlayMode {
    return this.options.mode ?? 'dialog';
  }

  get isUsingNativeTopLayer(): boolean {
    return this._usingNativeTopLayer;
  }

  get supportsInvokerCommands(): boolean {
    return (
      typeof HTMLButtonElement !== 'undefined' &&
      'commandForElement' in HTMLButtonElement.prototype
    );
  }

  updateOptions(options: Partial<OverlayControllerOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.motion) {
      this.motion.updateOptions(options.motion);
    }
  }

  hostConnected(): void {
    this.host.addEventListener('command', this.handleInvokerCommand);
    if (this._open) {
      this.attachGlobalListeners();
    }
  }

  hostDisconnected(): void {
    this.host.removeEventListener('command', this.handleInvokerCommand);
    this.detachGlobalListeners();
    getRuntime().overlays.unregister(this.id);
  }

  async show(): Promise<boolean> {
    if (this._open || this.opening) return true;
    this.opening = true;
    try {
      this.previousFocusedElement =
        this.options.trigger?.() ?? getDeepActiveElement(this.host.ownerDocument ?? document);

      const surface = this.resolveSurface();
      this.motion.updateOptions({ target: () => surface });

      // Dispatch cancelable `mth-open` via MotionController before showing top-layer.
      const allowed = await this.motion.open();
      if (!allowed) {
        return false;
      }

      this._open = true;
      this.applySurfaceOpen(surface);

      getRuntime().overlays.register({
        id: this.id,
        element: surface,
        modal: this.mode === 'dialog',
        requestClose: (reason) => {
          void this.hide(reason);
        },
      });

      this.attachGlobalListeners();
      this.options.onOpenChange?.(true);
      this.host.requestUpdate();
      return true;
    } finally {
      this.opening = false;
    }
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    if (!this._open || this.closing) return true;
    this.closing = true;
    try {
      const surface = this.resolveSurface();
      const allowed = await this.motion.close();
      if (!allowed) {
        return false;
      }

      this._open = false;
      this.applySurfaceClose(surface);
      this.detachGlobalListeners();
      getRuntime().overlays.unregister(this.id);

      if (this.options.restoreFocus !== false) {
        const restoreTarget = this.options.trigger?.() ?? this.previousFocusedElement;
        if (
          restoreTarget &&
          restoreTarget.isConnected &&
          typeof restoreTarget.focus === 'function'
        ) {
          restoreTarget.focus();
        }
      }
      this.previousFocusedElement = null;
      this.options.onOpenChange?.(false, reason);
      this.host.requestUpdate();
      return true;
    } finally {
      this.closing = false;
    }
  }

  toggle(): Promise<boolean> {
    return this._open ? this.hide('programmatic') : this.show();
  }

  private resolveSurface(): HTMLElement {
    return this.options.surface?.() ?? this.host;
  }

  private applySurfaceOpen(surface: HTMLElement): void {
    const forceFallback = this.options.forceFallback === true;
    this._usingNativeTopLayer = false;

    if (!forceFallback && this.mode === 'dialog' && this.isNativeDialog(surface)) {
      if (!surface.open) {
        try {
          surface.showModal();
          this._usingNativeTopLayer = true;
        } catch {
          surface.setAttribute('open', '');
        }
      }
    } else if (!forceFallback && this.mode === 'popover' && this.isNativePopover(surface)) {
      try {
        (surface as HTMLElement & { showPopover(): void }).showPopover();
        this._usingNativeTopLayer = true;
      } catch {
        surface.setAttribute('data-open', '');
      }
    } else if (this.mode === 'non-modal' && !forceFallback && this.isNativeDialog(surface)) {
      if (!surface.open) {
        try {
          surface.show();
          this._usingNativeTopLayer = true;
        } catch {
          surface.setAttribute('open', '');
        }
      }
    }

    if (surface !== this.host) {
      surface.setAttribute('data-mth-open', 'true');
      surface.hidden = false;
      if (!this._usingNativeTopLayer) {
        surface.setAttribute('data-mth-top-layer-fallback', '');
      } else {
        surface.removeAttribute('data-mth-top-layer-fallback');
      }
    } else {
      this.options.onSetCustomState?.('open', true);
      this.options.onSetCustomState?.('top-layer-fallback', !this._usingNativeTopLayer);
    }
  }

  private applySurfaceClose(surface: HTMLElement): void {
    if (this._usingNativeTopLayer && this.isNativeDialog(surface)) {
      if (surface.open) {
        try {
          surface.close();
        } catch {
          surface.removeAttribute('open');
        }
      }
    } else if (this._usingNativeTopLayer && this.isNativePopover(surface)) {
      try {
        (surface as HTMLElement & { hidePopover(): void }).hidePopover();
      } catch {
        surface.removeAttribute('data-open');
      }
    }
    this._usingNativeTopLayer = false;
    if (surface !== this.host) {
      surface.removeAttribute('data-mth-open');
      surface.removeAttribute('data-mth-top-layer-fallback');
      surface.hidden = true;
    } else {
      this.options.onSetCustomState?.('open', false);
      this.options.onSetCustomState?.('top-layer-fallback', false);
    }
  }

  private isNativeDialog(el: HTMLElement): el is HTMLDialogElement {
    return (
      typeof HTMLDialogElement !== 'undefined' &&
      el instanceof HTMLDialogElement &&
      typeof el.showModal === 'function'
    );
  }

  private isNativePopover(el: HTMLElement): boolean {
    return (
      el.hasAttribute('popover') &&
      typeof (el as HTMLElement & { showPopover?: unknown }).showPopover === 'function'
    );
  }

  private attachGlobalListeners(): void {
    const doc = this.host.ownerDocument ?? document;
    const surface = this.resolveSurface();
    doc.addEventListener('keydown', this.handleDocumentKeyDown);
    surface.addEventListener('keydown', this.handleSurfaceKeyDown);
    doc.addEventListener('pointerdown', this.handleOutsidePointerDown, true);
    if (this.isNativeDialog(surface)) {
      surface.addEventListener('cancel', this.handleNativeDialogCancel);
    }
  }

  private detachGlobalListeners(): void {
    const doc = this.host.ownerDocument ?? document;
    const surface = this.resolveSurface();
    doc.removeEventListener('keydown', this.handleDocumentKeyDown);
    surface.removeEventListener('keydown', this.handleSurfaceKeyDown);
    doc.removeEventListener('pointerdown', this.handleOutsidePointerDown, true);
    if (this.isNativeDialog(surface)) {
      surface.removeEventListener('cancel', this.handleNativeDialogCancel);
    }
  }

  private readonly handleSurfaceKeyDown = (event: KeyboardEvent): void => {
    if (!this._open || this.options.closeOnEscape === false) return;
    if (event.key === 'Escape' && getRuntime().overlays.isTop(this.id)) {
      event.preventDefault();
      event.stopPropagation();
      void this.hide('escape');
    }
  };

  private readonly handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!this._open || this.options.closeOnEscape === false) return;
    if (event.key === 'Escape' && getRuntime().overlays.isTop(this.id)) {
      event.preventDefault();
      void this.hide('escape');
    }
  };

  private readonly handleOutsidePointerDown = (event: Event): void => {
    if (!this._open) return;
    const lightDismiss =
      this.options.lightDismiss ?? (this.mode === 'popover' || this.mode === 'non-modal');
    if (!lightDismiss) return;
    if (!getRuntime().overlays.isTop(this.id)) return;

    const surface = this.resolveSurface();
    const trigger = this.options.trigger?.() ?? null;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const target = event.target as Node | null;

    const insideSurface =
      path.includes(surface) || (target !== null && surface.contains(target));
    const insideTrigger =
      trigger !== null && (path.includes(trigger) || (target !== null && trigger.contains(target)));

    if (!insideSurface && !insideTrigger) {
      void this.hide('outside');
    }
  };

  private readonly handleNativeDialogCancel = (event: Event): void => {
    event.preventDefault();
    if (this.options.closeOnEscape !== false && getRuntime().overlays.isTop(this.id)) {
      void this.hide('escape');
    }
  };

  private readonly handleInvokerCommand = (event: Event): void => {
    const cmd = (event as Event & { command?: string }).command;
    if (!cmd) return;
    if (cmd === 'show-modal' || cmd === 'show-popover') {
      void this.show();
    } else if (cmd === 'hide-popover' || cmd === 'close') {
      void this.hide('invoker');
    } else if (cmd === 'toggle-popover') {
      void this.toggle();
    }
  };
}
