export interface ThemeTokenSnapshot {
  readonly accent: string;
  readonly bg: string;
  readonly fg: string;
  readonly border: string;
}

export interface BaseSatelliteEngine {
  readonly theme: ThemeTokenSnapshot;
  getAppliedToken(tokenName: string): string;
  syncTokens(host: HTMLElement): void;
  dispose(): void;
}

export function escapeCssString(raw: string): string {
  return String(raw).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, '');
}

export function createDynamicSheet(): CSSStyleSheet | null {
  return typeof CSSStyleSheet !== 'undefined' ? new CSSStyleSheet() : null;
}

export function attachDynamicSheet(host: HTMLElement, sheet: CSSStyleSheet | null): void {
  const root = host.shadowRoot;
  if (!sheet || !root || !('adoptedStyleSheets' in root)) return;
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}

export function readCssToken(host: HTMLElement, tokenName: string): string {
  const inlineVal = host.style?.getPropertyValue?.(tokenName)?.trim();
  if (inlineVal) return inlineVal;
  if (typeof getComputedStyle === 'function') {
    try {
      return getComputedStyle(host).getPropertyValue(tokenName).trim();
    } catch {
      return '';
    }
  }
  return '';
}

export function captureThemeSnapshot(host: HTMLElement): ThemeTokenSnapshot {
  return {
    accent: readCssToken(host, '--mth-color-accent'),
    bg: readCssToken(host, '--mth-color-bg'),
    fg: readCssToken(host, '--mth-color-fg'),
    border: readCssToken(host, '--mth-color-border'),
  };
}
