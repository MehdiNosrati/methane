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

export function createAdoptedSheet(host: HTMLElement): CSSStyleSheet | null {
  if (!host.shadowRoot || typeof CSSStyleSheet === 'undefined') {
    return null;
  }
  const sheet = new CSSStyleSheet();
  host.shadowRoot.adoptedStyleSheets = [...host.shadowRoot.adoptedStyleSheets, sheet];
  return sheet;
}

export function isSafeMediaUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\/|\.\.\/)/.test(trimmed)) return true;
  if (trimmed.startsWith('blob:')) return true;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) return true;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) {
    return !trimmed.startsWith('//');
  }
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http';
}
