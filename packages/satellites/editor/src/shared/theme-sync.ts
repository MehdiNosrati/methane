const UNSAFE_CSS_VALUE_RE = /[;{}<>\\]|url\s*\(|@import|expression\s*\(/i;

/**
 * Validates that a CSS custom property value is safe to interpolate into an adopted CSSStyleSheet.
 */
export function sanitizeCssTokenValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 256) return null;
  if (UNSAFE_CSS_VALUE_RE.test(trimmed)) return null;
  return trimmed;
}

/**
 * Reads a token value from host inline style / computed style without mutating host.style.
 */
export function readHostTokenValue(host: HTMLElement, tokenName: string): string {
  const inlineVal = host.style?.getPropertyValue?.(tokenName)?.trim() ?? '';
  if (inlineVal) return sanitizeCssTokenValue(inlineVal) ?? '';
  if (typeof getComputedStyle === 'function') {
    const computed = getComputedStyle(host).getPropertyValue(tokenName).trim();
    return sanitizeCssTokenValue(computed) ?? '';
  }
  return '';
}

/**
 * Synchronizes `--mth-*` host tokens into a private adopted stylesheet (`:--_sat-*` vars)
 * and a reactive token map without calling `host.style.setProperty`.
 */
export function syncTokenStylesheet(
  host: HTMLElement,
  shadowRoot: ShadowRoot | null,
  sheet: CSSStyleSheet | null,
  tokenMap: Map<string, string>,
  tokenNames: ReadonlyArray<string>,
): void {
  const declarations: Array<string> = [];
  for (const name of tokenNames) {
    const val = readHostTokenValue(host, name);
    if (val) {
      tokenMap.set(name, val);
      const localVar = `--_sat-${name.replace(/^--mth-/, '')}`;
      declarations.push(`${localVar}: ${val};`);
    } else {
      tokenMap.delete(name);
    }
  }

  if (!shadowRoot || !sheet) return;
  if (!shadowRoot.adoptedStyleSheets.includes(sheet)) {
    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
  }
  sheet.replaceSync(declarations.length > 0 ? `:host { ${declarations.join(' ')} }` : '');
}
