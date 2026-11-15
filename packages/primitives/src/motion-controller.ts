import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type MotionPhase = 'closed' | 'entering' | 'open' | 'exiting';

export interface MotionControllerOptions {
  target?: () => HTMLElement | null;
  enterKeyframes?: Keyframe[];
  exitKeyframes?: Keyframe[];
  durationMs?: number;
  easing?: string;
  respectReducedMotion?: boolean;
  onPhaseChange?: (phase: MotionPhase) => void;
  onSetCustomState?: (name: string, active: boolean) => void;
}

/**
 * Coordinates `@starting-style` / Web Animations lifecycle, `prefers-reduced-motion` respect,
 * and cancelable `mth-open` -> `mth-after-open` / `mth-close` -> `mth-after-close` events.
 */
export class MotionController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private options: MotionControllerOptions;
  private _phase: MotionPhase = 'closed';
  private activeAnimation: Animation | null = null;
  private transitionId = 0;

  constructor(host: ReactiveControllerHost & HTMLElement, options: MotionControllerOptions = {}) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get phase(): MotionPhase {
    return this._phase;
  }

  get isReducedMotion(): boolean {
    if (this.options.respectReducedMotion === false) return false;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  hostConnected(): void {
    this.syncAttribute();
  }

  hostDisconnected(): void {
    this.cancelRunningAnimation();
  }

  updateOptions(options: Partial<MotionControllerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  async open(): Promise<boolean> {
    if (this._phase === 'open' || this._phase === 'entering') {
      return true;
    }

    const beforeEvent = new CustomEvent('mth-open', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    if (!this.host.dispatchEvent(beforeEvent)) {
      return false;
    }

    this.cancelRunningAnimation();
    const mySeq = ++this.transitionId;
    const target = this.resolveTarget();
    const duration = this.isReducedMotion ? 0 : (this.options.durationMs ?? 0);

    if (duration > 0 && target && typeof target.animate === 'function' && this.options.enterKeyframes) {
      this.setPhase('entering');
      this.activeAnimation = target.animate(this.options.enterKeyframes, {
        duration,
        easing: this.options.easing ?? 'cubic-bezier(0.2, 0, 0, 1)',
        fill: 'both',
      });
      try {
        await this.activeAnimation.finished;
      } catch {
        // Cancelled by competing close.
      }
      if (mySeq !== this.transitionId) return false;
      this.activeAnimation = null;
    }

    this.setPhase('open');
    this.host.dispatchEvent(
      new CustomEvent('mth-after-open', {
        bubbles: true,
        composed: true,
      }),
    );
    return true;
  }

  async close(): Promise<boolean> {
    if (this._phase === 'closed' || this._phase === 'exiting') {
      return true;
    }

    const beforeEvent = new CustomEvent('mth-close', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    if (!this.host.dispatchEvent(beforeEvent)) {
      return false;
    }

    this.cancelRunningAnimation();
    const mySeq = ++this.transitionId;
    const target = this.resolveTarget();
    const duration = this.isReducedMotion ? 0 : (this.options.durationMs ?? 0);

    if (duration > 0 && target && typeof target.animate === 'function' && this.options.exitKeyframes) {
      this.setPhase('exiting');
      this.activeAnimation = target.animate(this.options.exitKeyframes, {
        duration,
        easing: this.options.easing ?? 'cubic-bezier(0.2, 0, 0, 1)',
        fill: 'both',
      });
      try {
        await this.activeAnimation.finished;
      } catch {
        // Cancelled by competing open.
      }
      if (mySeq !== this.transitionId) return false;
      this.activeAnimation = null;
    }

    this.setPhase('closed');
    this.host.dispatchEvent(
      new CustomEvent('mth-after-close', {
        bubbles: true,
        composed: true,
      }),
    );
    return true;
  }

  setImmediatePhase(phase: MotionPhase): void {
    this.cancelRunningAnimation();
    this.transitionId += 1;
    this.setPhase(phase);
  }

  private resolveTarget(): HTMLElement | null {
    return this.options.target ? this.options.target() : this.host;
  }

  private setPhase(phase: MotionPhase): void {
    this._phase = phase;
    this.syncAttribute();
    this.options.onPhaseChange?.(phase);
    this.host.requestUpdate();
  }

  private syncAttribute(): void {
    const target = this.resolveTarget();
    if (!target) return;
    if (target !== this.host) {
      target.setAttribute('data-mth-motion', this._phase);
    } else if (this.options.onSetCustomState) {
      this.options.onSetCustomState('entering', this._phase === 'entering');
      this.options.onSetCustomState('open', this._phase === 'open');
      this.options.onSetCustomState('exiting', this._phase === 'exiting');
    }
  }

  private cancelRunningAnimation(): void {
    if (this.activeAnimation) {
      try {
        this.activeAnimation.cancel();
      } catch {
        // Ignore already-finished animations.
      }
      this.activeAnimation = null;
    }
  }
}
