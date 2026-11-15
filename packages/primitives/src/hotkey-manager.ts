import { getRuntime, type HotkeyBinding } from '@methane/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface HotkeyControllerBinding {
  readonly id: string;
  readonly combo: string;
  readonly scope?: HTMLElement | Document;
  readonly allowInInput?: boolean;
  readonly preventDefault?: boolean;
  readonly handler: (event: KeyboardEvent) => void;
}

/**
 * Checks whether a KeyboardEvent is safe for shortcut matching (not in IME composition,
 * and respecting `allowInInput` when focus is inside form inputs/contentEditable).
 */
export function isHotkeyEventEligible(event: KeyboardEvent, allowInInput = false): boolean {
  if (event.isComposing || event.keyCode === 229) {
    return false;
  }
  if (allowInInput) return true;
  const target = (typeof event.composedPath === 'function' ? event.composedPath()[0] : event.target) as
    | HTMLElement
    | undefined;
  if (!target) return true;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
    return false;
  }
  return true;
}

export function normalizeCombo(combo: string, isApplePlatform = detectApplePlatform()): string {
  const parts = combo
    .split('+')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const modifiers = new Set<string>();
  let key = '';

  for (const part of parts) {
    if (part === 'mod') {
      modifiers.add(isApplePlatform ? 'meta' : 'ctrl');
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

  const ordered = ['ctrl', 'meta', 'alt', 'shift'].filter((m) => modifiers.has(m));
  return [...ordered, key].join('+');
}

export function eventToNormalizedCombo(event: KeyboardEvent): string {
  const modifiers: string[] = [];
  if (event.ctrlKey) modifiers.push('ctrl');
  if (event.metaKey) modifiers.push('meta');
  if (event.altKey) modifiers.push('alt');
  if (event.shiftKey) modifiers.push('shift');
  const key = event.key === ' ' ? ' ' : event.key.toLowerCase();
  return [...modifiers, key].join('+');
}

/**
 * Reactive controller integrating scoped, IME-aware keyboard shortcuts with `getRuntime().hotkeys`.
 */
export class HotkeyController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly bindings = new Map<string, HotkeyControllerBinding>();
  private readonly cleanups = new Map<string, () => void>();
  private connected = false;
  private readonly scopeTargets = new Set<EventTarget>();

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    initialBindings: ReadonlyArray<HotkeyControllerBinding> = [],
  ) {
    this.host = host;
    for (const b of initialBindings) {
      this.bindings.set(b.id, b);
    }
    this.host.addController(this);
  }

  hostConnected(): void {
    this.connected = true;
    for (const binding of this.bindings.values()) {
      this.registerBinding(binding);
    }
  }

  hostDisconnected(): void {
    this.connected = false;
    for (const unsub of this.cleanups.values()) {
      unsub();
    }
    this.cleanups.clear();
    for (const target of this.scopeTargets) {
      target.removeEventListener('keydown', this.handleScopedKeyDown as EventListener);
    }
    this.scopeTargets.clear();
  }

  add(binding: HotkeyControllerBinding): () => void {
    this.remove(binding.id);
    this.bindings.set(binding.id, binding);
    if (this.connected) {
      this.registerBinding(binding);
    }
    return () => this.remove(binding.id);
  }

  remove(id: string): void {
    this.bindings.delete(id);
    const unsub = this.cleanups.get(id);
    if (unsub) {
      unsub();
      this.cleanups.delete(id);
    }
  }

  private registerBinding(binding: HotkeyControllerBinding): void {
    const normalized = normalizeCombo(binding.combo);
    const runtimeBinding: HotkeyBinding = {
      id: binding.id,
      combo: normalized,
      ...(binding.scope ? { scope: binding.scope } : {}),
      ...(binding.allowInInput !== undefined ? { allowInInput: binding.allowInInput } : {}),
      handler: (event) => {
        if (!isHotkeyEventEligible(event, binding.allowInInput)) return;
        if (binding.preventDefault !== false) {
          event.preventDefault();
        }
        binding.handler(event);
      },
    };
    const unsub = getRuntime().hotkeys.register(runtimeBinding);
    this.cleanups.set(binding.id, unsub);

    const target: EventTarget = binding.scope ?? this.host.ownerDocument ?? document;
    if (!this.scopeTargets.has(target)) {
      target.addEventListener('keydown', this.handleScopedKeyDown as EventListener);
      this.scopeTargets.add(target);
    }
  }

  private readonly handleScopedKeyDown = (event: KeyboardEvent): void => {
    if (event.isComposing || event.keyCode === 229) return;
    const pressed = eventToNormalizedCombo(event);
    for (const binding of this.bindings.values()) {
      const scopeTarget: EventTarget = binding.scope ?? this.host.ownerDocument ?? document;
      if (event.currentTarget !== scopeTarget) continue;
      if (normalizeCombo(binding.combo) === pressed) {
        if (!isHotkeyEventEligible(event, binding.allowInInput)) continue;
        if (binding.preventDefault !== false) {
          event.preventDefault();
        }
        binding.handler(event);
      }
    }
  };
}

function detectApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');
}

export const HotkeyManager = HotkeyController;
