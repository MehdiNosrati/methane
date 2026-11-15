import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

export interface CaretSnapshot {
  readonly start: number | null;
  readonly end: number | null;
  readonly direction: 'forward' | 'backward' | 'none' | null;
}

export interface InputControllerOptions {
  acceptInput?: (event: InputEvent, nextValue: string) => boolean;
  onCompositionChange?: (composing: boolean, data: string) => void;
  onCommitValue?: (value: string) => void;
  onViewportChange?: (insetBottom: number, keyboardOpen: boolean) => void;
}

/**
 * Coordinates IME composition, `beforeinput` interception, caret preservation,
 * pointer/touch state, and `visualViewport` virtual-keyboard offsets.
 */
export class InputController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private options: InputControllerOptions;
  private inputEl: TextInputElement | null = null;

  private _isComposing = false;
  private _compositionData = '';
  private _lastPointerType: 'mouse' | 'pen' | 'touch' | null = null;
  private _pointerDown = false;
  private _viewportInsetBottom = 0;
  private _caret: CaretSnapshot = { start: null, end: null, direction: null };
  private baselineInnerHeight = 0;

  constructor(host: ReactiveControllerHost, options: InputControllerOptions = {}) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get element(): TextInputElement | null {
    return this.inputEl;
  }

  get isComposing(): boolean {
    return this._isComposing;
  }

  get compositionData(): string {
    return this._compositionData;
  }

  get lastPointerType(): 'mouse' | 'pen' | 'touch' | null {
    return this._lastPointerType;
  }

  get isPointerDown(): boolean {
    return this._pointerDown;
  }

  get viewportInsetBottom(): number {
    return this._viewportInsetBottom;
  }

  get isVirtualKeyboardOpen(): boolean {
    return this._viewportInsetBottom > 80;
  }

  get caret(): CaretSnapshot {
    return this._caret;
  }

  updateOptions(options: InputControllerOptions): void {
    this.options = { ...this.options, ...options };
  }

  bind(el: TextInputElement | null): void {
    if (this.inputEl === el) return;
    this.detachElementListeners();
    this.inputEl = el;
    if (!el) return;

    el.addEventListener('beforeinput', this.handleBeforeInput as EventListener);
    el.addEventListener('compositionstart', this.handleCompositionStart);
    el.addEventListener('compositionupdate', this.handleCompositionUpdate as EventListener);
    el.addEventListener('compositionend', this.handleCompositionEnd as EventListener);
    el.addEventListener('input', this.handleInput);
    el.addEventListener('select', this.handleSelectionSync);
    el.addEventListener('keyup', this.handleSelectionSync);
    el.addEventListener('pointerdown', this.handlePointerDown as EventListener);
    el.addEventListener('pointerup', this.handlePointerUp);
    el.addEventListener('pointercancel', this.handlePointerUp);
    this.syncCaretFromElement();
  }

  hostConnected(): void {
    if (typeof window !== 'undefined') {
      this.baselineInnerHeight = window.innerHeight;
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', this.handleVisualViewport);
        window.visualViewport.addEventListener('scroll', this.handleVisualViewport);
        this.handleVisualViewport();
      }
    }
  }

  hostDisconnected(): void {
    this.detachElementListeners();
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleVisualViewport);
      window.visualViewport.removeEventListener('scroll', this.handleVisualViewport);
    }
  }

  setCaret(
    start: number,
    end: number = start,
    direction: 'forward' | 'backward' | 'none' = 'none',
  ): void {
    if (this.inputEl && typeof this.inputEl.setSelectionRange === 'function') {
      try {
        this.inputEl.setSelectionRange(start, end, direction);
      } catch {
        // Input types such as email/number throw on setSelectionRange in browsers.
      }
    }
    this._caret = { start, end, direction };
  }

  preserveCaret(mutate: (el: TextInputElement) => void): void {
    const el = this.inputEl;
    if (!el) return;
    const prevLen = el.value.length;
    const prevStart = el.selectionStart ?? prevLen;
    const prevEnd = el.selectionEnd ?? prevLen;
    const dir = el.selectionDirection ?? 'none';

    mutate(el);

    const delta = el.value.length - prevLen;
    const nextStart = Math.max(0, Math.min(el.value.length, prevStart + delta));
    const nextEnd = Math.max(nextStart, Math.min(el.value.length, prevEnd + delta));
    this.setCaret(nextStart, nextEnd, dir);
  }

  private detachElementListeners(): void {
    const el = this.inputEl;
    if (!el) return;
    el.removeEventListener('beforeinput', this.handleBeforeInput as EventListener);
    el.removeEventListener('compositionstart', this.handleCompositionStart);
    el.removeEventListener('compositionupdate', this.handleCompositionUpdate as EventListener);
    el.removeEventListener('compositionend', this.handleCompositionEnd as EventListener);
    el.removeEventListener('input', this.handleInput);
    el.removeEventListener('select', this.handleSelectionSync);
    el.removeEventListener('keyup', this.handleSelectionSync);
    el.removeEventListener('pointerdown', this.handlePointerDown as EventListener);
    el.removeEventListener('pointerup', this.handlePointerUp);
    el.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private readonly handleBeforeInput = (event: InputEvent): void => {
    if (!this.inputEl || !this.options.acceptInput) return;
    if (this._isComposing || event.isComposing) return;
    const projected = projectNextValue(this.inputEl, event);
    if (!this.options.acceptInput(event, projected)) {
      event.preventDefault();
    }
  };

  private readonly handleCompositionStart = (): void => {
    this._isComposing = true;
    this._compositionData = '';
    this.options.onCompositionChange?.(true, '');
    this.host.requestUpdate();
  };

  private readonly handleCompositionUpdate = (event: CompositionEvent): void => {
    this._isComposing = true;
    this._compositionData = event.data ?? '';
    this.options.onCompositionChange?.(true, this._compositionData);
    this.host.requestUpdate();
  };

  private readonly handleCompositionEnd = (event: CompositionEvent): void => {
    this._isComposing = false;
    this._compositionData = event.data ?? '';
    this.options.onCompositionChange?.(false, this._compositionData);
    if (this.inputEl) {
      this.syncCaretFromElement();
      this.options.onCommitValue?.(this.inputEl.value);
    }
    this.host.requestUpdate();
  };

  private readonly handleInput = (): void => {
    if (!this.inputEl) return;
    this.syncCaretFromElement();
    if (!this._isComposing) {
      this.options.onCommitValue?.(this.inputEl.value);
    }
  };

  private readonly handleSelectionSync = (): void => {
    this.syncCaretFromElement();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const type = event.pointerType;
    this._lastPointerType =
      type === 'mouse' || type === 'pen' || type === 'touch' ? type : 'mouse';
    this._pointerDown = true;
    this.syncCaretFromElement();
    this.host.requestUpdate();
  };

  private readonly handlePointerUp = (): void => {
    this._pointerDown = false;
    this.syncCaretFromElement();
    this.host.requestUpdate();
  };

  private readonly handleVisualViewport = (): void => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const refHeight = Math.max(this.baselineInnerHeight, window.innerHeight);
    const nextInset = Math.max(0, Math.round(refHeight - (vv.height + vv.offsetTop)));
    if (nextInset !== this._viewportInsetBottom) {
      this._viewportInsetBottom = nextInset;
      this.options.onViewportChange?.(nextInset, this.isVirtualKeyboardOpen);
      this.host.requestUpdate();
    }
  };

  private syncCaretFromElement(): void {
    if (!this.inputEl) return;
    try {
      this._caret = {
        start: this.inputEl.selectionStart,
        end: this.inputEl.selectionEnd,
        direction: this.inputEl.selectionDirection,
      };
    } catch {
      this._caret = { start: null, end: null, direction: null };
    }
  }
}

function projectNextValue(el: TextInputElement, event: InputEvent): string {
  const value = el.value;
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  if (event.inputType.startsWith('deleteContentBackward')) {
    if (start !== end) {
      return value.slice(0, start) + value.slice(end);
    }
    return value.slice(0, Math.max(0, start - 1)) + value.slice(end);
  }
  if (event.inputType.startsWith('deleteContentForward')) {
    if (start !== end) {
      return value.slice(0, start) + value.slice(end);
    }
    return value.slice(0, start) + value.slice(Math.min(value.length, end + 1));
  }
  const inserted = event.data ?? '';
  return value.slice(0, start) + inserted + value.slice(end);
}
