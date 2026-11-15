export interface ThemeTokenEngine {
  getThemeToken(name: string): string;
  syncThemeTokens(tokens: Record<string, string>): void;
  dispose(): void;
}

const DEFAULT_SYNCED_TOKENS: ReadonlyArray<string> = [
  '--mth-color-accent',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-surface',
  '--mth-color-surface-raised',
  '--mth-color-bg-subtle',
  '--mth-color-border',
  '--mth-color-border-focus',
  '--mth-color-danger',
  '--mth-color-success',
];

export function readHostToken(host: HTMLElement, tokenName: string): string {
  const inline = host.style?.getPropertyValue(tokenName)?.trim();
  if (inline) return inline;
  if (typeof getComputedStyle === 'function') {
    const computed = getComputedStyle(host).getPropertyValue(tokenName)?.trim();
    if (computed) return computed;
  }
  return '';
}

export function collectHostThemeTokens(host: HTMLElement): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const name of DEFAULT_SYNCED_TOKENS) {
    const value = readHostToken(host, name);
    if (value) {
      tokens[name] = value;
    }
  }
  return tokens;
}

export function createAdoptedSheet(
  host: HTMLElement,
  existing: CSSStyleSheet | null = null,
): CSSStyleSheet | null {
  if (!host.shadowRoot || typeof CSSStyleSheet === 'undefined') {
    return null;
  }
  const sheet = existing ?? new CSSStyleSheet();
  if (!host.shadowRoot.adoptedStyleSheets.includes(sheet)) {
    host.shadowRoot.adoptedStyleSheets = [...host.shadowRoot.adoptedStyleSheets, sheet];
  }
  return sheet;
}

export function removeAdoptedSheet(host: HTMLElement, sheet: CSSStyleSheet | null): void {
  if (!sheet || !host.shadowRoot) return;
  if (host.shadowRoot.adoptedStyleSheets.includes(sheet)) {
    host.shadowRoot.adoptedStyleSheets = host.shadowRoot.adoptedStyleSheets.filter(
      (s) => s !== sheet,
    );
  }
}

export function formatDurationSeconds(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
