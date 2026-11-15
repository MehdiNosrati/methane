export function attachDynamicSheet(
  renderRoot: DocumentFragment | ShadowRoot,
  existingSheet?: CSSStyleSheet | null,
): CSSStyleSheet | null {
  if (typeof CSSStyleSheet === 'undefined' || !('adoptedStyleSheets' in renderRoot)) {
    return null;
  }
  const sheet = existingSheet ?? new CSSStyleSheet();
  if (!renderRoot.adoptedStyleSheets.includes(sheet)) {
    renderRoot.adoptedStyleSheets = [...renderRoot.adoptedStyleSheets, sheet];
  }
  return sheet;
}

export function sanitizeCssNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function escapeAttrValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

export function resolveEffectiveDir(
  host: HTMLElement,
  resolvedDir: 'ltr' | 'rtl',
): 'ltr' | 'rtl' {
  const closestDir = host.closest('[dir]')?.getAttribute('dir')?.trim().toLowerCase();
  const effective = closestDir || resolvedDir;
  return effective === 'rtl' ? 'rtl' : 'ltr';
}

export function stopRovingKeys(event: KeyboardEvent): void {
  if (
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowRight' ||
    event.key === 'ArrowUp' ||
    event.key === 'ArrowDown' ||
    event.key === 'Home' ||
    event.key === 'End'
  ) {
    event.stopPropagation();
  }
}
