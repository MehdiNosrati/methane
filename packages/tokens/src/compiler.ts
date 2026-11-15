export type DtcgTokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'shadow'
  | 'string';

export interface DtcgShadowValue {
  offsetX: string;
  offsetY: string;
  blur: string;
  spread?: string;
  color: string;
  inset?: boolean;
}

export interface DtcgThemeExtension {
  light: string;
  dark: string;
}

export interface DtcgTokenNode {
  $value: unknown;
  $type?: DtcgTokenType;
  $description?: string;
  $extensions?: {
    'com.methane.theme'?: DtcgThemeExtension;
    [key: string]: unknown;
  };
}

export interface DtcgGroupNode {
  $type?: DtcgTokenType;
  $description?: string;
  [key: string]: unknown;
}

export type DtcgDocument = DtcgGroupNode;

export interface CompiledToken {
  readonly path: string;
  readonly cssName: `--mth-${string}`;
  readonly type: DtcgTokenType;
  readonly value: string;
  readonly lightDark?: { readonly light: string; readonly dark: string };
  readonly description?: string;
}

export interface CompileResult {
  readonly tokens: ReadonlyArray<CompiledToken>;
  readonly tokenMap: Readonly<Record<string, `--mth-${string}`>>;
  readonly css: string;
}

const VALID_DTCG_TYPES: ReadonlySet<string> = new Set<DtcgTokenType>([
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'shadow',
  'string',
]);

const DENSITY_PRESETS = {
  compact: 0.8,
  default: 1,
  comfortable: 1.2,
} as const;

const FORCED_COLORS_MAP: ReadonlyArray<readonly [string, string]> = [
  ['--mth-color-bg', 'Canvas'],
  ['--mth-color-bg-subtle', 'Canvas'],
  ['--mth-color-bg-muted', 'Canvas'],
  ['--mth-color-surface', 'Canvas'],
  ['--mth-color-surface-raised', 'Canvas'],
  ['--mth-color-fg', 'CanvasText'],
  ['--mth-color-fg-muted', 'GrayText'],
  ['--mth-color-fg-subtle', 'GrayText'],
  ['--mth-color-border', 'ButtonBorder'],
  ['--mth-color-border-strong', 'ButtonBorder'],
  ['--mth-color-border-focus', 'Highlight'],
  ['--mth-color-accent', 'Highlight'],
  ['--mth-color-accent-hover', 'Highlight'],
  ['--mth-color-accent-active', 'Highlight'],
  ['--mth-color-accent-subtle', 'Canvas'],
  ['--mth-color-accent-fg', 'HighlightText'],
  ['--mth-color-danger', 'LinkText'],
  ['--mth-color-danger-fg', 'HighlightText'],
  ['--mth-color-warning', 'LinkText'],
  ['--mth-color-success', 'LinkText'],
  ['--mth-color-info', 'LinkText'],
  ['--mth-shadow-xs', 'none'],
  ['--mth-shadow-sm', 'none'],
  ['--mth-shadow-md', 'none'],
  ['--mth-shadow-lg', 'none'],
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTokenNode(node: Record<string, unknown>): node is DtcgTokenNode & Record<string, unknown> {
  return '$value' in node;
}

export function toKebabCase(segment: string): string {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function pathToCssVar(path: string): `--mth-${string}` {
  const kebab = path.split('.').map(toKebabCase).join('-');
  return `--mth-${kebab}`;
}

interface RawTokenEntry {
  path: string;
  cssName: `--mth-${string}`;
  type: DtcgTokenType;
  rawValue: unknown;
  theme?: DtcgThemeExtension;
  description?: string;
}

function collectTokens(
  node: Record<string, unknown>,
  pathSegments: string[],
  inheritedType: DtcgTokenType | undefined,
  out: Map<string, RawTokenEntry>,
): void {
  const localType = node['$type'];
  if (localType !== undefined) {
    if (typeof localType !== 'string' || !VALID_DTCG_TYPES.has(localType)) {
      throw new Error(`Invalid DTCG $type "${String(localType)}" at "${pathSegments.join('.') || '<root>'}"`);
    }
  }
  const activeType = (localType as DtcgTokenType | undefined) ?? inheritedType;

  if (isTokenNode(node)) {
    if (pathSegments.length === 0) {
      throw new Error('DTCG token cannot appear at document root');
    }
    if (!activeType) {
      throw new Error(`Missing DTCG $type for token "${pathSegments.join('.')}"`);
    }
    const path = pathSegments.join('.');
    const extensions = isPlainObject(node['$extensions']) ? node['$extensions'] : undefined;
    const rawTheme = extensions ? extensions['com.methane.theme'] : undefined;
    let theme: DtcgThemeExtension | undefined;
    if (rawTheme !== undefined) {
      if (
        !isPlainObject(rawTheme) ||
        typeof rawTheme['light'] !== 'string' ||
        typeof rawTheme['dark'] !== 'string'
      ) {
        throw new Error(`Invalid com.methane.theme extension at "${path}"`);
      }
      theme = { light: rawTheme['light'], dark: rawTheme['dark'] };
    }
    const entry: RawTokenEntry = {
      path,
      cssName: pathToCssVar(path),
      type: activeType,
      rawValue: node['$value'],
      ...(theme ? { theme } : {}),
      ...(typeof node['$description'] === 'string' ? { description: node['$description'] } : {}),
    };
    out.set(path, entry);
    return;
  }

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (!isPlainObject(child)) {
      throw new Error(`Expected DTCG group or token object at "${[...pathSegments, key].join('.')}"`);
    }
    collectTokens(child, [...pathSegments, key], activeType, out);
  }
}

const REFERENCE_PATTERN = /^\{([a-zA-Z0-9_.-]+)\}$/;
const INLINE_REFERENCE_PATTERN = /\{([a-zA-Z0-9_.-]+)\}/g;

function formatShadowValue(value: unknown, path: string): string {
  if (value === 'none') return 'none';
  if (Array.isArray(value)) {
    return value.map((item) => formatShadowValue(item, path)).join(', ');
  }
  if (!isPlainObject(value)) {
    throw new Error(`Invalid shadow $value at "${path}"`);
  }
  const offsetX = value['offsetX'];
  const offsetY = value['offsetY'];
  const blur = value['blur'];
  const spread = value['spread'] ?? '0px';
  const color = value['color'];
  const inset = value['inset'] === true ? 'inset ' : '';
  if (
    typeof offsetX !== 'string' ||
    typeof offsetY !== 'string' ||
    typeof blur !== 'string' ||
    typeof spread !== 'string' ||
    typeof color !== 'string'
  ) {
    throw new Error(`Incomplete shadow object at "${path}"`);
  }
  return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
}

function formatDtcgValue(type: DtcgTokenType, value: unknown, path: string): string {
  switch (type) {
    case 'color':
    case 'dimension':
    case 'duration':
    case 'string': {
      if (typeof value !== 'string') {
        throw new Error(`Expected string $value for ${type} token "${path}"`);
      }
      return value;
    }
    case 'number':
    case 'fontWeight': {
      if (typeof value !== 'number' && typeof value !== 'string') {
        throw new Error(`Expected number/string $value for ${type} token "${path}"`);
      }
      return String(value);
    }
    case 'fontFamily': {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        return value.map((family) => (/[\s,]/.test(family) ? `"${family}"` : family)).join(', ');
      }
      throw new Error(`Expected fontFamily string or string[] at "${path}"`);
    }
    case 'cubicBezier': {
      if (
        Array.isArray(value) &&
        value.length === 4 &&
        value.every((n) => typeof n === 'number' && Number.isFinite(n))
      ) {
        return `cubic-bezier(${value.join(', ')})`;
      }
      throw new Error(`Expected 4-number array for cubicBezier token "${path}"`);
    }
    case 'shadow': {
      return formatShadowValue(value, path);
    }
  }
}

function resolveExpression(
  expr: string,
  entries: Map<string, RawTokenEntry>,
  stack: Set<string>,
  mode: 'css-var' | 'value',
): string {
  const exactMatch = REFERENCE_PATTERN.exec(expr.trim());
  if (exactMatch) {
    const refPath = exactMatch[1];
    if (!refPath) throw new Error(`Empty token reference in "${expr}"`);
    const target = entries.get(refPath);
    if (!target) {
      throw new Error(`Unresolved token reference "{${refPath}}"`);
    }
    if (stack.has(refPath)) {
      throw new Error(`Circular token reference detected: ${[...stack, refPath].join(' -> ')}`);
    }
    if (mode === 'css-var') {
      return `var(${target.cssName})`;
    }
    stack.add(refPath);
    const resolved = resolveTokenValue(target, entries, stack, mode);
    stack.delete(refPath);
    return resolved;
  }

  return expr.replace(INLINE_REFERENCE_PATTERN, (_full, refPath: string) => {
    const target = entries.get(refPath);
    if (!target) {
      throw new Error(`Unresolved token reference "{${refPath}}"`);
    }
    if (stack.has(refPath)) {
      throw new Error(`Circular token reference detected: ${[...stack, refPath].join(' -> ')}`);
    }
    if (mode === 'css-var') {
      return `var(${target.cssName})`;
    }
    stack.add(refPath);
    const resolved = resolveTokenValue(target, entries, stack, mode);
    stack.delete(refPath);
    return resolved;
  });
}

function resolveTokenValue(
  entry: RawTokenEntry,
  entries: Map<string, RawTokenEntry>,
  stack: Set<string>,
  mode: 'css-var' | 'value',
): string {
  const formatted = formatDtcgValue(entry.type, entry.rawValue, entry.path);
  return resolveExpression(formatted, entries, stack, mode);
}

export function compileDtcgTokens(document: DtcgDocument): CompileResult {
  if (!isPlainObject(document)) {
    throw new Error('DTCG document must be a JSON object');
  }

  const entries = new Map<string, RawTokenEntry>();
  collectTokens(document, [], undefined, entries);

  const tokens: CompiledToken[] = [];
  const tokenMap: Record<string, `--mth-${string}`> = {};

  for (const entry of entries.values()) {
    const stack = new Set<string>([entry.path]);
    // Validate cycles eagerly on concrete resolution path as well
    resolveTokenValue(entry, entries, new Set<string>([entry.path]), 'value');

    let cssValue = resolveTokenValue(entry, entries, stack, 'css-var');
    let lightDark: { light: string; dark: string } | undefined;

    if (entry.theme) {
      const light = resolveExpression(entry.theme.light, entries, new Set([entry.path]), 'css-var');
      const dark = resolveExpression(entry.theme.dark, entries, new Set([entry.path]), 'css-var');
      lightDark = { light, dark };
      cssValue = `light-dark(${light}, ${dark})`;
    }

    const compiled: CompiledToken = {
      path: entry.path,
      cssName: entry.cssName,
      type: entry.type,
      value: cssValue,
      ...(lightDark ? { lightDark } : {}),
      ...(entry.description ? { description: entry.description } : {}),
    };
    tokens.push(compiled);
    tokenMap[entry.path] = entry.cssName;
  }

  const rootDeclarations = tokens.map((t) => `    ${t.cssName}: ${t.value};`).join('\n');

  // Re-emit tokens referencing --mth-density inside each scoped density block so subtree
  // density containers recompute derived values instead of inheriting :root's substituted 1.
  const densityDependentNames = new Set<string>(['--mth-density']);
  let added = true;
  while (added) {
    added = false;
    for (const token of tokens) {
      if (densityDependentNames.has(token.cssName)) continue;
      for (const dep of densityDependentNames) {
        if (token.value.includes(`var(${dep})`) || token.value.includes(`var(${dep},`)) {
          densityDependentNames.add(token.cssName);
          added = true;
          break;
        }
      }
    }
  }
  const derivedDensityDecls = tokens
    .filter((t) => t.cssName !== '--mth-density' && densityDependentNames.has(t.cssName))
    .map((t) => `    ${t.cssName}: ${t.value};`)
    .join('\n');

  const densityBlocks = Object.entries(DENSITY_PRESETS)
    .map(([name, multiplier]) => {
      const lines = [`    --mth-density: ${multiplier};`];
      if (derivedDensityDecls) {
        lines.push(derivedDensityDecls);
      }
      return `  [data-mth-density='${name}'],\n  .mth-density-${name} {\n${lines.join('\n')}\n  }`;
    })
    .join('\n\n');

  const themeBlocks = [
    "  [data-mth-theme='light'],",
    '  .mth-theme-light {',
    '    color-scheme: light;',
    '  }',
    '',
    "  [data-mth-theme='dark'],",
    '  .mth-theme-dark {',
    '    color-scheme: dark;',
    '  }',
  ].join('\n');

  const reducedMotionDurations = tokens
    .filter((t) => t.type === 'duration')
    .map((t) => `      ${t.cssName}: 0ms;`)
    .join('\n');

  const forcedColorDecls = FORCED_COLORS_MAP.map(([name, val]) => `      ${name}: ${val};`).join('\n');

  const css = [
    '/* Generated by @methane-ui/tokens W3C DTCG compiler. Do not edit directly. */',
    '@layer mth.tokens {',
    '  :root {',
    '    color-scheme: light dark;',
    '',
    rootDeclarations,
    '  }',
    '',
    themeBlocks,
    '',
    densityBlocks,
    '',
    '  @media (prefers-reduced-motion: reduce) {',
    '    :root {',
    reducedMotionDurations,
    '    }',
    '  }',
    '',
    '  @media (forced-colors: active) {',
    '    :root {',
    forcedColorDecls,
    '    }',
    '  }',
    '}',
    '',
  ].join('\n');

  return { tokens, tokenMap, css };
}
