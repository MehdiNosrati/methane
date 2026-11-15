/**
 * Resolves effective writing direction from the nearest explicit `[dir]` ancestor
 * or `UIElement.resolvedDir` (`LOCALE_CONTEXT` fallback).
 */
export function resolveEffectiveDir(host: Element, resolvedDir: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  const raw = host.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? resolvedDir;
  return raw === 'rtl' ? 'rtl' : 'ltr';
}
