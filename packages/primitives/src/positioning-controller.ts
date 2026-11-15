import { getRuntime } from '@methane-ui/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type PlacementSide = 'top' | 'bottom' | 'left' | 'right';
export type PlacementAlign = 'start' | 'center' | 'end';
export type Placement =
  | PlacementSide
  | `${PlacementSide}-${'start' | 'end'}`;

export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect;
}

export type PositioningAnchor = Element | VirtualAnchor | DOMRect;

export interface PositioningResult {
  readonly x: number;
  readonly y: number;
  readonly placement: Placement;
  readonly strategy: 'css-anchor' | 'js-fallback';
  readonly arrowX?: number;
  readonly arrowY?: number;
  readonly arrowSide?: PlacementSide;
}

export interface PositioningControllerOptions {
  anchor?: PositioningAnchor | (() => PositioningAnchor | null);
  floating?: () => HTMLElement | null;
  arrow?: () => HTMLElement | null;
  placement?: Placement;
  offset?: number;
  viewportPadding?: number;
  flip?: boolean;
  shift?: boolean;
  arrowPadding?: number;
  forceFallback?: boolean;
  autoUpdate?: boolean;
  onPosition?: (result: PositioningResult) => void;
}

let anchorIdCounter = 0;

/**
 * Dual-path floating positioning engine (ADR-010): uses native CSS Anchor Positioning
 * when supported for Element anchors, and falls back to JS collision flip, cross-axis
 * shift clamping, arrow coordinates, scroll-parent tracking, and virtual `DOMRect` anchors.
 */
export class PositioningController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private options: PositioningControllerOptions;
  private _lastResult: PositioningResult | null = null;
  private readonly anchorToken = `--mth-anchor-${++anchorIdCounter}`;

  private cleanupScrollListeners: Array<() => void> = [];
  private cleanupResizeObserver: (() => void) | null = null;
  private active = false;

  constructor(host: ReactiveControllerHost, options: PositioningControllerOptions = {}) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get lastResult(): PositioningResult | null {
    return this._lastResult;
  }

  get supportsCssAnchor(): boolean {
    if (this.options.forceFallback) return false;
    return (
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('position-area', 'block-end')
    );
  }

  updateOptions(options: Partial<PositioningControllerOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.active) {
      this.reposition();
    }
  }

  hostConnected(): void {
    if (this.active) {
      this.attachAutoUpdate();
      this.reposition();
    }
  }

  hostDisconnected(): void {
    this.detachAutoUpdate();
  }

  start(): PositioningResult | null {
    this.active = true;
    this.attachAutoUpdate();
    return this.reposition();
  }

  stop(): void {
    this.active = false;
    this.detachAutoUpdate();
  }

  reposition(): PositioningResult | null {
    const anchor = this.resolveAnchor();
    const floating = this.options.floating?.() ?? null;
    if (!anchor || !floating) return null;

    const requestedPlacement = this.options.placement ?? 'bottom';

    // Native CSS Anchor Positioning path when supported and anchor is a real Element.
    if (this.supportsCssAnchor && isDomElement(anchor)) {
      anchor.style.setProperty('anchor-name', this.anchorToken);
      floating.style.setProperty('position', 'fixed');
      floating.style.setProperty('position-anchor', this.anchorToken);
      floating.style.setProperty('position-area', placementToPositionArea(requestedPlacement));
      if (this.options.flip !== false) {
        floating.style.setProperty('position-try-fallbacks', 'flip-block, flip-inline');
      }
      const res: PositioningResult = {
        x: 0,
        y: 0,
        placement: requestedPlacement,
        strategy: 'css-anchor',
      };
      this._lastResult = res;
      this.options.onPosition?.(res);
      return res;
    }

    const res = this.computeJsFallback(anchor, floating, requestedPlacement);
    floating.style.position = 'fixed';
    floating.style.insetInlineStart = `${res.x}px`;
    floating.style.insetBlockStart = `${res.y}px`;
    floating.setAttribute('data-mth-placement', res.placement);

    const arrowEl = this.options.arrow?.() ?? null;
    if (arrowEl) {
      if (res.arrowX !== undefined) {
        arrowEl.style.insetInlineStart = `${res.arrowX}px`;
      }
      if (res.arrowY !== undefined) {
        arrowEl.style.insetBlockStart = `${res.arrowY}px`;
      }
      if (res.arrowSide) {
        arrowEl.setAttribute('data-mth-arrow-side', res.arrowSide);
      }
    }

    this._lastResult = res;
    this.options.onPosition?.(res);
    return res;
  }

  computeJsFallback(
    anchor: PositioningAnchor,
    floating: HTMLElement,
    requestedPlacement: Placement = this.options.placement ?? 'bottom',
  ): PositioningResult {
    const anchorRect = getAnchorRect(anchor);
    const floatingRect = floating.getBoundingClientRect();
    const viewport = getViewportBounds();
    const padding = this.options.viewportPadding ?? 8;
    const offset = this.options.offset ?? 8;

    let placement = requestedPlacement;
    let coords = computeCoordsForPlacement(anchorRect, floatingRect, placement, offset);

    if (this.options.flip !== false) {
      const flipped = maybeFlipPlacement(
        placement,
        coords,
        floatingRect,
        viewport,
        padding,
      );
      if (flipped !== placement) {
        const flippedCoords = computeCoordsForPlacement(
          anchorRect,
          floatingRect,
          flipped,
          offset,
        );
        if (fitsBetter(flipped, flippedCoords, coords, floatingRect, viewport, padding)) {
          placement = flipped;
          coords = flippedCoords;
        }
      }
    }

    const { side } = parsePlacement(placement);
    if (this.options.shift !== false) {
      if (side === 'top' || side === 'bottom') {
        const minX = viewport.left + padding;
        const maxX = Math.max(minX, viewport.right - padding - floatingRect.width);
        coords.x = clamp(coords.x, minX, maxX);
      } else {
        const minY = viewport.top + padding;
        const maxY = Math.max(minY, viewport.bottom - padding - floatingRect.height);
        coords.y = clamp(coords.y, minY, maxY);
      }
    }

    const arrowEl = this.options.arrow?.() ?? null;
    const arrowPad = this.options.arrowPadding ?? 8;
    const arrowSide = oppositeSide(side);
    let arrowX: number | undefined;
    let arrowY: number | undefined;

    if (arrowEl || side === 'top' || side === 'bottom' || side === 'left' || side === 'right') {
      const arrowRect = arrowEl?.getBoundingClientRect();
      const arrowW = arrowRect?.width ?? 8;
      const arrowH = arrowRect?.height ?? 8;

      if (side === 'top' || side === 'bottom') {
        const anchorCenterX = anchorRect.left + anchorRect.width / 2;
        const rawArrowX = anchorCenterX - coords.x - arrowW / 2;
        const maxArrowX = Math.max(arrowPad, floatingRect.width - arrowPad - arrowW);
        arrowX = Math.round(clamp(rawArrowX, arrowPad, maxArrowX));
      } else {
        const anchorCenterY = anchorRect.top + anchorRect.height / 2;
        const rawArrowY = anchorCenterY - coords.y - arrowH / 2;
        const maxArrowY = Math.max(arrowPad, floatingRect.height - arrowPad - arrowH);
        arrowY = Math.round(clamp(rawArrowY, arrowPad, maxArrowY));
      }
    }

    return {
      x: Math.round(coords.x),
      y: Math.round(coords.y),
      placement,
      strategy: 'js-fallback',
      arrowSide,
      ...(arrowX !== undefined ? { arrowX } : {}),
      ...(arrowY !== undefined ? { arrowY } : {}),
    };
  }

  private resolveAnchor(): PositioningAnchor | null {
    const raw = this.options.anchor;
    if (!raw) return null;
    return typeof raw === 'function' ? raw() : raw;
  }

  private attachAutoUpdate(): void {
    this.detachAutoUpdate();
    if (this.options.autoUpdate === false) return;

    const anchor = this.resolveAnchor();
    const floating = this.options.floating?.() ?? null;
    const runtime = getRuntime();

    const cleanups: Array<() => void> = [];
    if (floating) {
      cleanups.push(
        runtime.observers.observeResize(floating, () => {
          this.reposition();
        }),
      );
    }
    if (anchor && isDomElement(anchor)) {
      cleanups.push(
        runtime.observers.observeResize(anchor, () => {
          this.reposition();
        }),
      );

      for (const scrollParent of getScrollParents(anchor)) {
        const onScroll = () => this.reposition();
        scrollParent.addEventListener('scroll', onScroll, { passive: true });
        cleanups.push(() => scrollParent.removeEventListener('scroll', onScroll));
      }
    }

    if (typeof window !== 'undefined') {
      const onWinChange = () => this.reposition();
      window.addEventListener('scroll', onWinChange, { passive: true });
      window.addEventListener('resize', onWinChange, { passive: true });
      cleanups.push(() => {
        window.removeEventListener('scroll', onWinChange);
        window.removeEventListener('resize', onWinChange);
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onWinChange);
        window.visualViewport.addEventListener('scroll', onWinChange);
        cleanups.push(() => {
          window.visualViewport?.removeEventListener('resize', onWinChange);
          window.visualViewport?.removeEventListener('scroll', onWinChange);
        });
      }
    }

    this.cleanupScrollListeners = cleanups;
  }

  private detachAutoUpdate(): void {
    for (const fn of this.cleanupScrollListeners) {
      fn();
    }
    this.cleanupScrollListeners = [];
    this.cleanupResizeObserver?.();
    this.cleanupResizeObserver = null;
  }
}

function isDomElement(anchor: PositioningAnchor): anchor is HTMLElement {
  return typeof Element !== 'undefined' && anchor instanceof Element && 'style' in anchor;
}

function getAnchorRect(anchor: PositioningAnchor): DOMRect {
  if ('getBoundingClientRect' in anchor && typeof anchor.getBoundingClientRect === 'function') {
    return anchor.getBoundingClientRect();
  }
  return anchor as DOMRect;
}

function getViewportBounds(): { top: number; left: number; right: number; bottom: number } {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, right: 1024, bottom: 768 };
  }
  const vv = window.visualViewport;
  const left = vv ? vv.offsetLeft : 0;
  const top = vv ? vv.offsetTop : 0;
  const width = vv ? vv.width : window.innerWidth;
  const height = vv ? vv.height : window.innerHeight;
  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
  };
}

function parsePlacement(placement: Placement): { side: PlacementSide; align: PlacementAlign } {
  const [side, align] = placement.split('-') as [PlacementSide, PlacementAlign | undefined];
  return { side, align: align ?? 'center' };
}

function oppositeSide(side: PlacementSide): PlacementSide {
  switch (side) {
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

function flipPlacementName(placement: Placement): Placement {
  const { side, align } = parsePlacement(placement);
  const opp = oppositeSide(side);
  return align === 'center' ? opp : `${opp}-${align}`;
}

function computeCoordsForPlacement(
  anchor: DOMRect,
  floating: DOMRect,
  placement: Placement,
  offset: number,
): { x: number; y: number } {
  const { side, align } = parsePlacement(placement);
  let x = anchor.left;
  let y = anchor.top;

  switch (side) {
    case 'top':
      y = anchor.top - floating.height - offset;
      x = alignHorizontal(anchor, floating, align);
      break;
    case 'bottom':
      y = anchor.bottom + offset;
      x = alignHorizontal(anchor, floating, align);
      break;
    case 'left':
      x = anchor.left - floating.width - offset;
      y = alignVertical(anchor, floating, align);
      break;
    case 'right':
      x = anchor.right + offset;
      y = alignVertical(anchor, floating, align);
      break;
  }

  return { x, y };
}

function alignHorizontal(anchor: DOMRect, floating: DOMRect, align: PlacementAlign): number {
  switch (align) {
    case 'start':
      return anchor.left;
    case 'end':
      return anchor.right - floating.width;
    case 'center':
      return anchor.left + anchor.width / 2 - floating.width / 2;
  }
}

function alignVertical(anchor: DOMRect, floating: DOMRect, align: PlacementAlign): number {
  switch (align) {
    case 'start':
      return anchor.top;
    case 'end':
      return anchor.bottom - floating.height;
    case 'center':
      return anchor.top + anchor.height / 2 - floating.height / 2;
  }
}

function maybeFlipPlacement(
  placement: Placement,
  coords: { x: number; y: number },
  floating: DOMRect,
  viewport: { top: number; left: number; right: number; bottom: number },
  padding: number,
): Placement {
  const { side } = parsePlacement(placement);
  const overflows =
    (side === 'top' && coords.y < viewport.top + padding) ||
    (side === 'bottom' && coords.y + floating.height > viewport.bottom - padding) ||
    (side === 'left' && coords.x < viewport.left + padding) ||
    (side === 'right' && coords.x + floating.width > viewport.right - padding);
  return overflows ? flipPlacementName(placement) : placement;
}

function fitsBetter(
  candidatePlacement: Placement,
  candidateCoords: { x: number; y: number },
  currentCoords: { x: number; y: number },
  floating: DOMRect,
  viewport: { top: number; left: number; right: number; bottom: number },
  padding: number,
): boolean {
  const { side } = parsePlacement(candidatePlacement);
  if (side === 'top') {
    const candidateOverflow = Math.max(0, viewport.top + padding - candidateCoords.y);
    const currentOverflow = Math.max(0, currentCoords.y + floating.height - (viewport.bottom - padding));
    return candidateOverflow < currentOverflow;
  }
  if (side === 'bottom') {
    const candidateOverflow = Math.max(0, candidateCoords.y + floating.height - (viewport.bottom - padding));
    const currentOverflow = Math.max(0, viewport.top + padding - currentCoords.y);
    return candidateOverflow < currentOverflow;
  }
  if (side === 'left') {
    const candidateOverflow = Math.max(0, viewport.left + padding - candidateCoords.x);
    const currentOverflow = Math.max(0, currentCoords.x + floating.width - (viewport.right - padding));
    return candidateOverflow < currentOverflow;
  }
  const candidateOverflow = Math.max(0, candidateCoords.x + floating.width - (viewport.right - padding));
  const currentOverflow = Math.max(0, viewport.left + padding - currentCoords.x);
  return candidateOverflow < currentOverflow;
}

function placementToPositionArea(placement: Placement): string {
  switch (placement) {
    case 'top':
      return 'block-start';
    case 'top-start':
      return 'block-start span-inline-end';
    case 'top-end':
      return 'block-start span-inline-start';
    case 'bottom':
      return 'block-end';
    case 'bottom-start':
      return 'block-end span-inline-end';
    case 'bottom-end':
      return 'block-end span-inline-start';
    case 'left':
      return 'inline-start';
    case 'left-start':
      return 'inline-start span-block-end';
    case 'left-end':
      return 'inline-start span-block-start';
    case 'right':
      return 'inline-end';
    case 'right-start':
      return 'inline-end span-block-end';
    case 'right-end':
      return 'inline-end span-block-start';
  }
}

function getScrollParents(el: Element): Element[] {
  const parents: Element[] = [];
  let cur: Element | null = el.parentElement;
  while (cur) {
    if (typeof getComputedStyle === 'function') {
      const style = getComputedStyle(cur);
      const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`;
      if (/(auto|scroll|overlay)/.test(overflow)) {
        parents.push(cur);
      }
    }
    cur = cur.parentElement;
  }
  return parents;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
