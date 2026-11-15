import { UIElement, css, getRuntime, html, property, state, type MessageCatalog } from '@methane-ui/core';

export type TagLoaderFn = (tagName: string) => Promise<void> | void;

export interface AutoLoaderOptions {
  root?: Element | Document;
  prefix?: string;
  loaders?: Readonly<Record<string, () => Promise<unknown>>>;
  resolveTag?: TagLoaderFn;
}

/**
 * Watches a DOM tree with a `MutationObserver` and lazily loads unregistered
 * Methane custom element tags on first appearance (with per-tag deduplication).
 */
export class AutoLoader {
  private readonly root: Element | Document;
  private readonly prefix: string;
  private readonly loaders: Record<string, () => Promise<unknown>>;
  private readonly resolveTag: TagLoaderFn | undefined;

  private observer: MutationObserver | null = null;
  private readonly inFlight = new Map<string, Promise<void>>();
  private readonly loadedTags = new Set<string>();

  constructor(options: AutoLoaderOptions = {}) {
    this.root = options.root ?? (typeof document !== 'undefined' ? document : ({} as Document));
    this.prefix = (options.prefix ?? 'mth-').toLowerCase();
    this.loaders = { ...(options.loaders ?? {}) };
    this.resolveTag = options.resolveTag;
  }

  get registeredLoadedTags(): ReadonlySet<string> {
    return this.loadedTags;
  }

  register(tagName: string, loader: () => Promise<unknown>): void {
    this.loaders[tagName.toLowerCase()] = loader;
  }

  start(): Promise<void> {
    this.stop();
    const initialPromise = this.scanNode(this.root);

    const targetNode =
      'documentElement' in this.root ? this.root.documentElement : this.root;
    if (typeof MutationObserver !== 'undefined' && targetNode instanceof Node) {
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const added of mutation.addedNodes) {
            if (added instanceof Element) {
              void this.scanNode(added);
            }
          }
        }
      });
      this.observer.observe(targetNode, { childList: true, subtree: true });
    }

    return initialPromise;
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  async scanNode(node: Element | Document): Promise<void> {
    const tagsToLoad = new Set<string>();
    const collectIfUnregistered = (el: Element): void => {
      const tag = el.localName.toLowerCase();
      if (tag.startsWith(this.prefix) && !customElements.get(tag)) {
        tagsToLoad.add(tag);
      }
      if (el.shadowRoot) {
        for (const shadowChild of el.shadowRoot.querySelectorAll('*')) {
          collectIfUnregistered(shadowChild);
        }
      }
    };

    if ('localName' in node && node instanceof Element) {
      collectIfUnregistered(node);
    }
    if ('querySelectorAll' in node && typeof node.querySelectorAll === 'function') {
      for (const el of node.querySelectorAll('*')) {
        collectIfUnregistered(el);
      }
    }

    await Promise.all(Array.from(tagsToLoad).map((tag) => this.loadTag(tag)));
  }

  loadTag(tagName: string): Promise<void> {
    const normalized = tagName.toLowerCase();
    if (this.loadedTags.has(normalized)) {
      return Promise.resolve();
    }
    const pending = this.inFlight.get(normalized);
    if (pending) return pending;

    const loader = this.loaders[normalized];
    if (!loader && !this.resolveTag) {
      return Promise.resolve();
    }

    const job = Promise.resolve()
      .then(async () => {
        if (loader) {
          await loader();
        } else if (this.resolveTag) {
          await this.resolveTag(normalized);
        }
        this.loadedTags.add(normalized);
      })
      .finally(() => {
        this.inFlight.delete(normalized);
      });

    this.inFlight.set(normalized, job);
    return job;
  }
}

/**
 * `<mth-visually-hidden>`: screen-reader-only utility element using logical CSS properties.
 */
export class MthVisuallyHiddenElement extends UIElement {
  static override styles = css`
    :host {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

/**
 * `<mth-skip-link>`: accessible skip-navigation link revealing on `:focus-visible`.
 */
export class MthSkipLinkElement extends UIElement {
  static override messages: MessageCatalog = {
    skipToMain: 'Skip to main content',
  };

  static override styles = css`
    :host {
      display: contents;
    }

    a {
      position: fixed;
      inset-block-start: -9999px;
      inset-inline-start: var(--mth-space-4, 1rem);
      z-index: 9999;
      padding-block: var(--mth-space-2, 0.5rem);
      padding-inline: var(--mth-space-4, 1rem);
      background: var(--mth-color-surface-raised, Canvas);
      color: var(--mth-color-text, CanvasText);
      border-radius: var(--mth-radius-md, 0.375rem);
      text-decoration: none;
    }

    a:focus-visible {
      inset-block-start: var(--mth-space-4, 1rem);
      outline: 2px solid var(--mth-color-focus, Highlight);
      outline-offset: 2px;
    }
  `;

  @property({ type: String })
  href = '#main';

  private handleActivate = (event: Event): void => {
    if (!this.href.startsWith('#')) return;
    const id = this.href.slice(1);
    const root = this.getRootNode() as Document | ShadowRoot;
    const target =
      'getElementById' in root
        ? root.getElementById(id)
        : document.getElementById(id);
    if (target instanceof HTMLElement) {
      event.preventDefault();
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
    }
  };

  override render() {
    return html`<a href=${this.href} @click=${this.handleActivate}
      ><slot>${this.t('skipToMain')}</slot></a
    >`;
  }
}

/**
 * `<mth-error-boundary>`: captures errors / `mth-error` events from slotted subtree
 * and presents a localized declarative fallback with programmatic reset/retry.
 */
export class MthErrorBoundaryElement extends UIElement {
  static override messages: MessageCatalog = {
    errorFallback: 'Something went wrong.',
    retry: 'Retry',
  };

  static override styles = css`
    :host {
      display: block;
    }

    .fallback {
      padding-block: var(--mth-space-4, 1rem);
      padding-inline: var(--mth-space-4, 1rem);
      border: 1px solid var(--mth-color-danger, crimson);
      border-radius: var(--mth-radius-md, 0.375rem);
    }
  `;

  @property({ type: String })
  fallbackMessage?: string;

  @state()
  private capturedError: unknown = null;

  get hasError(): boolean {
    return this.capturedError !== null;
  }

  get error(): unknown {
    return this.capturedError;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('error', this.handleSubtreeError);
    this.addEventListener('mth-error', this.handleSubtreeError);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('error', this.handleSubtreeError);
    this.removeEventListener('mth-error', this.handleSubtreeError);
  }

  capture(error: unknown): void {
    this.capturedError = error;
    this.emitEvent('mth-error-captured', { detail: { error } });
  }

  reset(): void {
    this.capturedError = null;
    this.emitEvent('mth-reset');
  }

  private readonly handleSubtreeError = (event: Event): void => {
    event.stopPropagation();
    const detailError =
      event instanceof CustomEvent
        ? (event.detail as { error?: unknown } | undefined)?.error ?? event.detail
        : event instanceof ErrorEvent
          ? event.error ?? new Error(event.message)
          : new Error('Subtree error');
    this.capture(detailError);
  };

  override render() {
    if (this.capturedError !== null) {
      const message =
        this.capturedError instanceof Error
          ? this.capturedError.message
          : (this.fallbackMessage ?? this.t('errorFallback'));
      return html`
        <div class="fallback" role="alert">
          <slot name="fallback">
            <p>${message}</p>
            <button type="button" @click=${this.reset}>${this.t('retry')}</button>
          </slot>
        </div>
      `;
    }
    return html`<slot></slot>`;
  }
}

export function registerUtilityElements(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-visually-hidden': MthVisuallyHiddenElement,
      'mth-skip-link': MthSkipLinkElement,
      'mth-error-boundary': MthErrorBoundaryElement,
    },
  });
}
