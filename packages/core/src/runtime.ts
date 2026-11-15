import { IS_DEV, devWarn } from './env.js';

export const CORE_VERSION = '1.0.0';
export const CORE_MAJOR = 1;

/**
 * Locked Section 7 Contract (ADR-007): Global Versioned Runtime Symbol.
 */
export const RUNTIME_SYMBOL = /* @__PURE__ */ Symbol.for('@methane-ui/runtime');

export interface OverlayStackEntry {
  readonly id: string;
  readonly element: HTMLElement;
  readonly modal: boolean;
  readonly requestClose: (reason: 'escape' | 'outside' | 'programmatic') => void;
}

export interface OverlayStackCoordinator {
  register(entry: OverlayStackEntry): void;
  unregister(id: string): void;
  peek(): OverlayStackEntry | undefined;
  list(): ReadonlyArray<OverlayStackEntry>;
  isTop(id: string): boolean;
  requestCloseTop(reason?: 'escape' | 'outside' | 'programmatic'): boolean;
  readonly size: number;
}

export interface NotificationItem {
  readonly id: string;
  readonly title?: string;
  readonly message: string;
  readonly tone?: 'info' | 'success' | 'warning' | 'danger';
  readonly durationMs?: number;
  readonly createdAt: number;
}

export type NotificationListener = (items: ReadonlyArray<NotificationItem>) => void;

export interface NotificationStoreCoordinator {
  subscribe(listener: NotificationListener): () => void;
  add(item: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string }): NotificationItem;
  dismiss(id: string): boolean;
  clear(): void;
  list(): ReadonlyArray<NotificationItem>;
}

export interface HotkeyBinding {
  readonly id: string;
  readonly combo: string;
  readonly scope?: HTMLElement | Document;
  readonly allowInInput?: boolean;
  readonly handler: (event: KeyboardEvent) => void;
}

export interface HotkeyManagerCoordinator {
  register(binding: HotkeyBinding): () => void;
  unregister(id: string): void;
  getBindings(): ReadonlyArray<HotkeyBinding>;
  handleKeydown(event: KeyboardEvent): boolean;
}

export interface LiveAnnouncerCoordinator {
  announce(message: string, politeness?: 'polite' | 'assertive'): void;
  getLastAnnouncement(): { readonly message: string; readonly politeness: 'polite' | 'assertive' } | null;
  clear(): void;
}

export type StyleUpdateListener = (tagOrGlobal: string) => void;

export interface AdoptedStyleRegistry {
  registerStyles(tagOrGlobal: string, cssText: string): CSSStyleSheet | null;
  getSheetsForTag(tagName: string): ReadonlyArray<CSSStyleSheet>;
  getRawCssForTag(tagName: string): ReadonlyArray<string>;
  subscribe(listener: StyleUpdateListener): () => void;
}

export type ResizeCallback = (entry: ResizeObserverEntry) => void;
export type IntersectionCallback = (entry: IntersectionObserverEntry) => void;
export type MediaCallback = (matches: boolean) => void;

export interface SharedObserverPools {
  observeResize(target: Element, callback: ResizeCallback): () => void;
  observeIntersection(
    target: Element,
    callback: IntersectionCallback,
    options?: IntersectionObserverInit,
  ): () => void;
  observeMedia(query: string, callback: MediaCallback): () => void;
}

export interface DefineComponentsOptions {
  prefix?: string;
  components?: Readonly<Record<string, CustomElementConstructor>>;
}

export interface PrefixElementRegistry {
  prefix: string;
  resolveTag(baseTag: string): string;
  define(baseTag: string, ctor: CustomElementConstructor, options?: ElementDefinitionOptions): string;
  defineComponents(options: DefineComponentsOptions): ReadonlyArray<string>;
  getDefinedTags(): ReadonlyMap<string, string>;
  getConstructor(baseTag: string): CustomElementConstructor | undefined;
}

export type NotificationStore = NotificationStoreCoordinator;
export type HotkeyManager = HotkeyManagerCoordinator;
export type LiveAnnouncer = LiveAnnouncerCoordinator;

export interface MethaneRuntime {
  readonly major: number;
  readonly version: string;
  readonly capabilities: ReadonlySet<string>;
  readonly overlays: OverlayStackCoordinator;
  readonly notifications: NotificationStore;
  readonly hotkeys: HotkeyManager;
  readonly announcer: LiveAnnouncer;
  readonly styles: AdoptedStyleRegistry;
  readonly observers: SharedObserverPools;
  readonly registry: PrefixElementRegistry;
}

interface MutableMethaneRuntime {
  readonly major: number;
  version: string;
  readonly capabilities: Set<string>;
  overlays: OverlayStackCoordinator;
  notifications: NotificationStore;
  hotkeys: HotkeyManager;
  announcer: LiveAnnouncer;
  styles: AdoptedStyleRegistry;
  observers: SharedObserverPools;
  registry: PrefixElementRegistry;
}

export interface SemverParts {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: string | null;
}

export function parseSemver(version: string): SemverParts {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version.trim());
  if (!match) {
    throw new Error(`Invalid SemVer string "${version}"`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  if (pa.prerelease === pb.prerelease) return 0;
  if (pa.prerelease === null) return 1;
  if (pb.prerelease === null) return -1;
  return pa.prerelease.localeCompare(pb.prerelease);
}

function createOverlayCoordinator(): OverlayStackCoordinator {
  const stack: OverlayStackEntry[] = [];

  return {
    register(entry) {
      const existingIdx = stack.findIndex((item) => item.id === entry.id);
      if (existingIdx >= 0) {
        stack.splice(existingIdx, 1);
      }
      stack.push(entry);
    },
    unregister(id) {
      const idx = stack.findIndex((item) => item.id === id);
      if (idx >= 0) stack.splice(idx, 1);
    },
    peek() {
      return stack.at(-1);
    },
    list() {
      return [...stack];
    },
    isTop(id) {
      return stack.at(-1)?.id === id;
    },
    requestCloseTop(reason = 'escape') {
      const top = stack.at(-1);
      if (!top) return false;
      top.requestClose(reason);
      return true;
    },
    get size() {
      return stack.length;
    },
  };
}

function createNotificationCoordinator(): NotificationStoreCoordinator {
  const items: NotificationItem[] = [];
  const listeners = new Set<NotificationListener>();
  let seq = 0;

  const notify = () => {
    const snapshot = [...items];
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener([...items]);
      return () => {
        listeners.delete(listener);
      };
    },
    add(input) {
      seq += 1;
      const id = input.id ?? `mth-toast-${seq}`;
      const dedupIdx = items.findIndex((i) => i.id === id);
      if (dedupIdx >= 0) {
        items.splice(dedupIdx, 1);
      }
      const item: NotificationItem = {
        ...input,
        id,
        createdAt: Date.now(),
      };
      items.push(item);
      notify();
      return item;
    },
    dismiss(id) {
      const idx = items.findIndex((i) => i.id === id);
      if (idx < 0) return false;
      items.splice(idx, 1);
      notify();
      return true;
    },
    clear() {
      if (items.length === 0) return;
      items.length = 0;
      notify();
    },
    list() {
      return [...items];
    },
  };
}

function normalizeHotkeyCombo(combo: string): string {
  const parts = combo.split('+');
  const modifiers = new Set<string>();
  let key = '';
  for (const rawPart of parts) {
    if (rawPart === ' ') {
      key = ' ';
      continue;
    }
    const part = rawPart.trim().toLowerCase();
    if (!part) continue;
    if (part === 'mod') {
      const isMac =
        typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform ?? '');
      modifiers.add(isMac ? 'meta' : 'ctrl');
    } else if (part === 'ctrl' || part === 'control') {
      modifiers.add('ctrl');
    } else if (part === 'meta' || part === 'cmd' || part === 'command') {
      modifiers.add('meta');
    } else if (part === 'alt' || part === 'option') {
      modifiers.add('alt');
    } else if (part === 'shift') {
      modifiers.add('shift');
    } else {
      key = part === 'space' ? ' ' : part;
    }
  }
  const orderedMods = ['ctrl', 'meta', 'alt', 'shift'].filter((m) => modifiers.has(m));
  return [...orderedMods, key].join('+');
}

function eventToCombo(event: KeyboardEvent): string {
  const mods: string[] = [];
  if (event.ctrlKey) mods.push('ctrl');
  if (event.metaKey) mods.push('meta');
  if (event.altKey) mods.push('alt');
  if (event.shiftKey) mods.push('shift');
  mods.push(event.key === ' ' ? ' ' : event.key.toLowerCase());
  return mods.join('+');
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function createHotkeyCoordinator(): HotkeyManagerCoordinator {
  const bindings = new Map<string, HotkeyBinding>();

  return {
    register(binding) {
      bindings.set(binding.id, binding);
      return () => {
        bindings.delete(binding.id);
      };
    },
    unregister(id) {
      bindings.delete(id);
    },
    getBindings() {
      return [...bindings.values()];
    },
    handleKeydown(event) {
      if (event.isComposing || event.keyCode === 229) return false;
      const incoming = eventToCombo(event);
      const composedTarget =
        (typeof event.composedPath === 'function' ? event.composedPath()[0] : null) ?? event.target;
      let matched = false;
      for (const binding of bindings.values()) {
        if (normalizeHotkeyCombo(binding.combo) !== incoming) continue;
        if (!binding.allowInInput && isEditableTarget(composedTarget)) continue;
        if (binding.scope && typeof Node !== 'undefined' && composedTarget instanceof Node) {
          if (binding.scope !== document && !binding.scope.contains(composedTarget)) continue;
        }
        binding.handler(event);
        matched = true;
      }
      return matched;
    },
  };
}

function createLiveAnnouncerCoordinator(): LiveAnnouncerCoordinator {
  let last: { readonly message: string; readonly politeness: 'polite' | 'assertive' } | null = null;
  let politeNode: HTMLElement | null = null;
  let assertiveNode: HTMLElement | null = null;

  function ensureRegion(politeness: 'polite' | 'assertive'): HTMLElement | null {
    if (typeof document === 'undefined' || !document.body) return null;
    const existing = politeness === 'assertive' ? assertiveNode : politeNode;
    if (existing && existing.isConnected) return existing;

    const el = document.createElement('div');
    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
    el.style.position = 'fixed';
    el.style.insetBlockStart = '-9999px';
    el.style.inlineSize = '1px';
    el.style.blockSize = '1px';
    el.style.overflow = 'hidden';
    el.style.clipPath = 'inset(50%)';
    document.body.appendChild(el);

    if (politeness === 'assertive') assertiveNode = el;
    else politeNode = el;
    return el;
  }

  return {
    announce(message, politeness = 'polite') {
      last = { message, politeness };
      const region = ensureRegion(politeness);
      if (region) {
        region.textContent = '';
        region.textContent = message;
      }
    },
    getLastAnnouncement() {
      return last;
    },
    clear() {
      last = null;
      if (politeNode) politeNode.textContent = '';
      if (assertiveNode) assertiveNode.textContent = '';
    },
  };
}

function createAdoptedStyleRegistry(): AdoptedStyleRegistry {
  const sheetsByTarget = new Map<string, CSSStyleSheet[]>();
  const rawByTarget = new Map<string, string[]>();
  const listeners = new Set<StyleUpdateListener>();

  return {
    registerStyles(tagOrGlobal, cssText) {
      const normalizedKey = tagOrGlobal.toLowerCase();
      const layeredCss = /^\s*@layer\b/.test(cssText)
        ? cssText
        : `@layer override {\n${cssText}\n}`;

      const rawList = rawByTarget.get(normalizedKey) ?? [];
      rawList.push(layeredCss);
      rawByTarget.set(normalizedKey, rawList);

      let sheet: CSSStyleSheet | null = null;
      if (typeof CSSStyleSheet !== 'undefined' && 'replaceSync' in CSSStyleSheet.prototype) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(layeredCss);
        const list = sheetsByTarget.get(normalizedKey) ?? [];
        list.push(sheet);
        sheetsByTarget.set(normalizedKey, list);

        if (
          normalizedKey === '*' &&
          typeof document !== 'undefined' &&
          Array.isArray(document.adoptedStyleSheets)
        ) {
          document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        }
      }

      for (const listener of listeners) {
        listener(normalizedKey);
      }

      return sheet;
    },
    getSheetsForTag(tagName) {
      const key = tagName.toLowerCase();
      const globalSheets = sheetsByTarget.get('*') ?? [];
      const tagSheets = sheetsByTarget.get(key) ?? [];
      return [...globalSheets, ...tagSheets];
    },
    getRawCssForTag(tagName) {
      const key = tagName.toLowerCase();
      return [...(rawByTarget.get('*') ?? []), ...(rawByTarget.get(key) ?? [])];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function createSharedObserverPools(): SharedObserverPools {
  let resizeObserver: ResizeObserver | null = null;
  const resizeCallbacks = new WeakMap<Element, Set<ResizeCallback>>();
  const intersectionPools = new Map<
    string,
    { observer: IntersectionObserver; callbacks: WeakMap<Element, Set<IntersectionCallback>> }
  >();
  const mediaPools = new Map<
    string,
    { mql: MediaQueryList; listeners: Set<MediaCallback> }
  >();

  return {
    observeResize(target, callback) {
      if (typeof ResizeObserver === 'undefined') {
        return () => undefined;
      }
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cbs = resizeCallbacks.get(entry.target);
            if (!cbs) continue;
            for (const cb of cbs) cb(entry);
          }
        });
      }
      let set = resizeCallbacks.get(target);
      if (!set) {
        set = new Set();
        resizeCallbacks.set(target, set);
        resizeObserver.observe(target);
      }
      set.add(callback);

      return () => {
        const current = resizeCallbacks.get(target);
        if (!current) return;
        current.delete(callback);
        if (current.size === 0) {
          resizeCallbacks.delete(target);
          resizeObserver?.unobserve(target);
        }
      };
    },
    observeIntersection(target, callback, options) {
      if (typeof IntersectionObserver === 'undefined') {
        return () => undefined;
      }
      const key = JSON.stringify({
        rootMargin: options?.rootMargin ?? '0px',
        threshold: options?.threshold ?? 0,
      });
      let pool = intersectionPools.get(key);
      if (!pool) {
        const callbacks = new WeakMap<Element, Set<IntersectionCallback>>();
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            const cbs = callbacks.get(entry.target);
            if (!cbs) continue;
            for (const cb of cbs) cb(entry);
          }
        }, options);
        pool = { observer, callbacks };
        intersectionPools.set(key, pool);
      }

      let set = pool.callbacks.get(target);
      if (!set) {
        set = new Set();
        pool.callbacks.set(target, set);
        pool.observer.observe(target);
      }
      set.add(callback);

      return () => {
        const current = pool.callbacks.get(target);
        if (!current) return;
        current.delete(callback);
        if (current.size === 0) {
          pool.callbacks.delete(target);
          pool.observer.unobserve(target);
        }
      };
    },
    observeMedia(query, callback) {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => undefined;
      }
      let pool = mediaPools.get(query);
      if (!pool) {
        const mql = window.matchMedia(query);
        const listeners = new Set<MediaCallback>();
        const onChange = (ev: MediaQueryListEvent) => {
          for (const cb of listeners) cb(ev.matches);
        };
        mql.addEventListener('change', onChange);
        pool = { mql, listeners };
        mediaPools.set(query, pool);
      }
      pool.listeners.add(callback);
      callback(pool.mql.matches);

      return () => {
        pool.listeners.delete(callback);
      };
    },
  };
}

function createPrefixElementRegistry(): PrefixElementRegistry {
  let prefix = 'mth';
  const definedTags = new Map<string, string>();
  const constructors = new Map<string, CustomElementConstructor>();
  const registeredCtors = new WeakSet<CustomElementConstructor>();

  const normalizePrefix = (raw: string): string => raw.trim().toLowerCase().replace(/-+$/, '');

  const resolveTag = (baseTag: string): string => {
    const clean = baseTag.trim().toLowerCase();
    if (clean.startsWith('mth-')) {
      return `${prefix}-${clean.slice(4)}`;
    }
    return clean;
  };

  const define = (
    baseTag: string,
    ctor: CustomElementConstructor,
    options?: ElementDefinitionOptions,
  ): string => {
    const targetTag = resolveTag(baseTag);
    constructors.set(baseTag, ctor);
    definedTags.set(baseTag, targetTag);

    if (typeof customElements !== 'undefined' && !customElements.get(targetTag)) {
      const targetCtor = registeredCtors.has(ctor) ? class extends ctor {} : ctor;
      registeredCtors.add(targetCtor);
      customElements.define(targetTag, targetCtor, options);
    }
    return targetTag;
  };

  const defineComponents = (options: DefineComponentsOptions): ReadonlyArray<string> => {
    if (options.prefix !== undefined && options.prefix.trim().length > 0) {
      prefix = normalizePrefix(options.prefix);
    }
    const registered: string[] = [];
    if (options.components) {
      for (const [tag, ctor] of Object.entries(options.components)) {
        registered.push(define(tag, ctor));
      }
    }
    return registered;
  };

  return {
    get prefix() {
      return prefix;
    },
    set prefix(next: string) {
      if (next.trim().length > 0) {
        prefix = normalizePrefix(next);
      }
    },
    resolveTag,
    define,
    defineComponents,
    getDefinedTags() {
      return new Map(definedTags);
    },
    getConstructor(baseTag) {
      return constructors.get(baseTag);
    },
  };
}

const DEFAULT_CAPABILITIES: ReadonlyArray<string> = [
  'dsd-hydration',
  'face-internals',
  'custom-state-set',
  'context-protocol-v1',
  'i18n-plural-bidi',
  'adopted-styles-override',
  'prefix-registry',
];

export interface NegotiateRuntimeOptions {
  readonly version?: string;
  readonly bundleId?: string;
  readonly capabilities?: ReadonlyArray<string>;
  readonly hostGlobal?: Record<symbol, unknown>;
}

const RUNTIME_BUNDLE_IDS_SYMBOL = /* @__PURE__ */ Symbol.for('@methane-ui/runtime:bundles');

export function negotiateRuntime(options?: NegotiateRuntimeOptions): MethaneRuntime {
  const version = options?.version ?? CORE_VERSION;
  const parsed = parseSemver(version);
  const host = (options?.hostGlobal ?? globalThis) as Record<symbol, unknown>;
  const bundleId = options?.bundleId ?? `core@${version}`;

  const existing = host[RUNTIME_SYMBOL] as MutableMethaneRuntime | undefined;
  const bundleIds = (host[RUNTIME_BUNDLE_IDS_SYMBOL] as Set<string> | undefined) ?? new Set<string>();
  host[RUNTIME_BUNDLE_IDS_SYMBOL] = bundleIds;

  if (!existing) {
    const runtime: MutableMethaneRuntime = {
      major: parsed.major,
      version,
      capabilities: new Set([...DEFAULT_CAPABILITIES, ...(options?.capabilities ?? [])]),
      overlays: createOverlayCoordinator(),
      notifications: createNotificationCoordinator(),
      hotkeys: createHotkeyCoordinator(),
      announcer: createLiveAnnouncerCoordinator(),
      styles: createAdoptedStyleRegistry(),
      observers: createSharedObserverPools(),
      registry: createPrefixElementRegistry(),
    };
    bundleIds.add(bundleId);
    host[RUNTIME_SYMBOL] = runtime;
    return runtime;
  }

  if (existing.major !== parsed.major) {
    throw new Error(
      `Incompatible @methane-ui/core runtime major version: existing=${existing.major} (${existing.version}), candidate=${parsed.major} (${version}).`,
    );
  }

  if (!bundleIds.has(bundleId)) {
    bundleIds.add(bundleId);
    if (IS_DEV) {
      devWarn(
        `Duplicate @methane-ui/core bundle detected ("${bundleId}" alongside existing "${existing.version}"). Sharing global runtime at Symbol.for('@methane-ui/runtime').`,
      );
    }
  }

  for (const cap of options?.capabilities ?? []) {
    existing.capabilities.add(cap);
  }

  if (compareSemver(version, existing.version) > 0) {
    existing.version = version;
    // Ensure newer coordinators exist if upgrading from an older 1.x minor
    if (!existing.overlays) existing.overlays = createOverlayCoordinator();
    if (!existing.notifications) existing.notifications = createNotificationCoordinator();
    if (!existing.hotkeys) existing.hotkeys = createHotkeyCoordinator();
    if (!existing.announcer) existing.announcer = createLiveAnnouncerCoordinator();
    if (!existing.styles) existing.styles = createAdoptedStyleRegistry();
    if (!existing.observers) existing.observers = createSharedObserverPools();
    if (!existing.registry) existing.registry = createPrefixElementRegistry();
  }

  return existing;
}

export function getRuntime(hostGlobal?: Record<symbol, unknown>): MethaneRuntime {
  const host = (hostGlobal ?? globalThis) as Record<symbol, unknown>;
  const existing = host[RUNTIME_SYMBOL] as MethaneRuntime | undefined;
  if (existing) return existing;
  return negotiateRuntime({ hostGlobal: host });
}

export function registerStyles(tagOrGlobal: string, cssText: string): CSSStyleSheet | null {
  return getRuntime().styles.registerStyles(tagOrGlobal, cssText);
}

export function defineComponents(options: DefineComponentsOptions): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents(options);
}
