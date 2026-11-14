import {
  CSSRule,
  CSSStyleSheet,
  CustomElementRegistry,
  CustomEvent,
  Document,
  Element,
  Event,
  EventTarget,
  HTMLElement,
  HTMLSlotElement,
  IntersectionObserver,
  MutationObserver,
  Node,
  ResizeObserver,
  ShadowRoot,
  customElements,
  document,
  window,
} from '@lit-labs/ssr-dom-shim';

let shimInstalled = false;

/**
 * Installs `@lit-labs/ssr-dom-shim` globals when executing on a server runtime
 * (Node, Bun, Deno, or WinterCG Edge) that lacks native DOM / `customElements`.
 * Idempotent and no-ops when a real DOM or JSDOM `window` is already present.
 */
export function installSsrDomShim(): boolean {
  if (shimInstalled) {
    return false;
  }
  if (typeof globalThis.customElements !== 'undefined' && typeof globalThis.HTMLElement !== 'undefined') {
    return false;
  }

  const globals: Record<string, unknown> = {
    EventTarget,
    Event,
    CustomEvent,
    Node,
    Element,
    HTMLElement,
    HTMLSlotElement,
    Document,
    document,
    ShadowRoot,
    CSSStyleSheet,
    CSSRule,
    CustomElementRegistry,
    customElements,
    IntersectionObserver,
    MutationObserver,
    ResizeObserver,
    window,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => undefined,
  };

  for (const [key, value] of Object.entries(globals)) {
    if (!(key in globalThis) || (globalThis as Record<string, unknown>)[key] === undefined) {
      (globalThis as Record<string, unknown>)[key] = value;
    }
  }

  shimInstalled = true;
  return true;
}

installSsrDomShim();
