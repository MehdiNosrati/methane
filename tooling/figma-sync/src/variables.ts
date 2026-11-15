import {
  compileDtcgTokens,
  type CompiledToken,
  type DtcgDocument,
  type DtcgTokenType,
} from '@methane-ui/tokens';
import {
  figmaRgbaToOklchString,
  oklchToFigmaRgba,
  parseOklchColor,
  type OklchColor,
} from './color.js';
import type {
  DtcgToFigmaOptions,
  FigmaColorValue,
  FigmaToDtcgOptions,
  FigmaVariable,
  FigmaVariableAlias,
  FigmaVariableCollection,
  FigmaVariableResolvedType,
  FigmaVariableValue,
  FigmaVariablesPayload,
} from './types.js';

const COLOR_COLLECTION_ID = 'collection:color';
const SCALE_COLLECTION_ID = 'collection:scale';

const MODE_LIGHT = 'mode:light';
const MODE_DARK = 'mode:dark';
const MODE_HC = 'mode:high-contrast';

const MODE_COMPACT = 'mode:compact';
const MODE_DEFAULT = 'mode:default';
const MODE_COMFORTABLE = 'mode:comfortable';

const DENSITY_MULTIPLIERS: Readonly<Record<string, number>> = {
  [MODE_COMPACT]: 0.8,
  [MODE_DEFAULT]: 1,
  [MODE_COMFORTABLE]: 1.2,
};

const HIGH_CONTRAST_COLORS: Readonly<Record<string, FigmaColorValue>> = {
  'color.bg': { r: 1, g: 1, b: 1, a: 1 },
  'color.bgSubtle': { r: 1, g: 1, b: 1, a: 1 },
  'color.surface': { r: 1, g: 1, b: 1, a: 1 },
  'color.surfaceRaised': { r: 1, g: 1, b: 1, a: 1 },
  'color.fg': { r: 0, g: 0, b: 0, a: 1 },
  'color.fgMuted': { r: 0.25, g: 0.25, b: 0.25, a: 1 },
  'color.fgSubtle': { r: 0.25, g: 0.25, b: 0.25, a: 1 },
  'color.border': { r: 0, g: 0, b: 0, a: 1 },
  'color.borderStrong': { r: 0, g: 0, b: 0, a: 1 },
  'color.borderFocus': { r: 0, g: 0.35, b: 0.85, a: 1 },
  'color.accent': { r: 0, g: 0.35, b: 0.85, a: 1 },
  'color.accentHover': { r: 0, g: 0.25, b: 0.75, a: 1 },
  'color.accentActive': { r: 0, g: 0.2, b: 0.65, a: 1 },
  'color.accentSubtle': { r: 1, g: 1, b: 1, a: 1 },
  'color.accentFg': { r: 1, g: 1, b: 1, a: 1 },
};

const DENSITY_BASE_PX: Readonly<Record<string, number>> = {
  'space.controlInline': 12,
  'space.controlBlock': 8,
  'space.controlGap': 8,
};

function variableIdForPath(path: string): string {
  return `var:${path}`;
}

function figmaNameForPath(path: string): string {
  return path.split('.').join('/');
}

function pathForFigmaName(name: string): string {
  return name.split('/').join('.');
}

function parseDimensionPx(value: string, remBasePx: number): number | null {
  const trimmed = value.trim();
  if (trimmed.endsWith('rem')) {
    const n = Number(trimmed.slice(0, -3));
    return Number.isFinite(n) ? Number((n * remBasePx).toFixed(4)) : null;
  }
  if (trimmed.endsWith('px')) {
    const n = Number(trimmed.slice(0, -2));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseDurationMs(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.endsWith('ms')) {
    const n = Number(trimmed.slice(0, -2));
    return Number.isFinite(n) ? n : null;
  }
  if (trimmed.endsWith('s')) {
    const n = Number(trimmed.slice(0, -1));
    return Number.isFinite(n) ? n * 1000 : null;
  }
  return null;
}

function extractSingleVarRef(expr: string): string | null {
  const match = /^var\((--mth-[a-z0-9-]+)\)$/i.exec(expr.trim());
  return match ? match[1]! : null;
}

export function dtcgToFigmaVariables(
  document: DtcgDocument,
  options: DtcgToFigmaOptions = {},
): FigmaVariablesPayload {
  const remBasePx = options.remBasePx ?? 16;
  const compiled = compileDtcgTokens(document);

  const byCssName = new Map<string, CompiledToken>();
  const resolvedOklchCache = new Map<string, OklchColor>();
  for (const token of compiled.tokens) {
    byCssName.set(token.cssName, token);
  }

  const resolveVarToOklch = (cssVarName: string, seen = new Set<string>()): OklchColor | null => {
    const cached = resolvedOklchCache.get(cssVarName);
    if (cached) return cached;
    if (seen.has(cssVarName)) return null;
    seen.add(cssVarName);

    const token = byCssName.get(cssVarName);
    if (!token) return null;

    const expr = token.lightDark ? token.lightDark.light : token.value;
    const directRef = extractSingleVarRef(expr);
    if (directRef) {
      const resolved = resolveVarToOklch(directRef, seen);
      if (resolved) resolvedOklchCache.set(cssVarName, resolved);
      return resolved;
    }

    const parsed = parseOklchColor(expr, (inner) => resolveVarToOklch(inner, seen));
    if (parsed) resolvedOklchCache.set(cssVarName, parsed);
    return parsed;
  };

  const colorVariableIds: string[] = [];
  const scaleVariableIds: string[] = [];
  const variables: Record<string, FigmaVariable> = {};

  for (const token of compiled.tokens) {
    const id = variableIdForPath(token.path);
    const name = figmaNameForPath(token.path);

    if (token.type === 'color') {
      const resolveColorMode = (expr: string): FigmaVariableValue => {
        const directRef = extractSingleVarRef(expr);
        if (directRef) {
          const target = byCssName.get(directRef);
          if (target) {
            const alias: FigmaVariableAlias = {
              type: 'VARIABLE_ALIAS',
              id: variableIdForPath(target.path),
            };
            return alias;
          }
        }
        const parsed = parseOklchColor(expr, (inner) => resolveVarToOklch(inner));
        if (parsed) {
          return oklchToFigmaRgba(parsed);
        }
        return { r: 0, g: 0, b: 0, a: 1 };
      };

      const lightExpr = token.lightDark ? token.lightDark.light : token.value;
      const darkExpr = token.lightDark ? token.lightDark.dark : token.value;
      const lightVal = resolveColorMode(lightExpr);
      const darkVal = resolveColorMode(darkExpr);
      const hcVal: FigmaVariableValue = HIGH_CONTRAST_COLORS[token.path] ?? lightVal;

      colorVariableIds.push(id);
      variables[id] = {
        id,
        name,
        variableCollectionId: COLOR_COLLECTION_ID,
        resolvedType: 'COLOR',
        valuesByMode: {
          [MODE_LIGHT]: lightVal,
          [MODE_DARK]: darkVal,
          [MODE_HC]: hcVal,
        },
        ...(token.description ? { description: token.description } : {}),
        scopes: ['ALL_SCOPES'],
        codeSyntax: { WEB: `var(${token.cssName})` },
      };
      continue;
    }

    let resolvedType: FigmaVariableResolvedType = 'STRING';
    let valuesByMode: Record<string, FigmaVariableValue>;

    if (token.path === 'density') {
      resolvedType = 'FLOAT';
      valuesByMode = {
        [MODE_COMPACT]: 0.8,
        [MODE_DEFAULT]: 1,
        [MODE_COMFORTABLE]: 1.2,
      };
    } else if (token.path in DENSITY_BASE_PX) {
      resolvedType = 'FLOAT';
      const base = DENSITY_BASE_PX[token.path]!;
      valuesByMode = {
        [MODE_COMPACT]: Number((base * DENSITY_MULTIPLIERS[MODE_COMPACT]!).toFixed(4)),
        [MODE_DEFAULT]: base,
        [MODE_COMFORTABLE]: Number((base * DENSITY_MULTIPLIERS[MODE_COMFORTABLE]!).toFixed(4)),
      };
    } else if (token.type === 'dimension') {
      const px = parseDimensionPx(token.value, remBasePx);
      if (px !== null) {
        resolvedType = 'FLOAT';
        valuesByMode = {
          [MODE_COMPACT]: px,
          [MODE_DEFAULT]: px,
          [MODE_COMFORTABLE]: px,
        };
      } else {
        valuesByMode = {
          [MODE_COMPACT]: token.value,
          [MODE_DEFAULT]: token.value,
          [MODE_COMFORTABLE]: token.value,
        };
      }
    } else if (token.type === 'duration') {
      const ms = parseDurationMs(token.value);
      if (ms !== null) {
        resolvedType = 'FLOAT';
        valuesByMode = {
          [MODE_COMPACT]: ms,
          [MODE_DEFAULT]: ms,
          [MODE_COMFORTABLE]: ms,
        };
      } else {
        valuesByMode = {
          [MODE_COMPACT]: token.value,
          [MODE_DEFAULT]: token.value,
          [MODE_COMFORTABLE]: token.value,
        };
      }
    } else if (token.type === 'number' || token.type === 'fontWeight') {
      const num = Number(token.value);
      if (Number.isFinite(num)) {
        resolvedType = 'FLOAT';
        valuesByMode = {
          [MODE_COMPACT]: num,
          [MODE_DEFAULT]: num,
          [MODE_COMFORTABLE]: num,
        };
      } else {
        valuesByMode = {
          [MODE_COMPACT]: token.value,
          [MODE_DEFAULT]: token.value,
          [MODE_COMFORTABLE]: token.value,
        };
      }
    } else {
      valuesByMode = {
        [MODE_COMPACT]: token.value,
        [MODE_DEFAULT]: token.value,
        [MODE_COMFORTABLE]: token.value,
      };
    }

    scaleVariableIds.push(id);
    variables[id] = {
      id,
      name,
      variableCollectionId: SCALE_COLLECTION_ID,
      resolvedType,
      valuesByMode,
      ...(token.description ? { description: token.description } : {}),
      codeSyntax: { WEB: `var(${token.cssName})` },
    };
  }

  const variableCollections: Record<string, FigmaVariableCollection> = {
    [COLOR_COLLECTION_ID]: {
      id: COLOR_COLLECTION_ID,
      name: 'Methane Color & Surface',
      defaultModeId: MODE_LIGHT,
      modes: [
        { modeId: MODE_LIGHT, name: 'Light' },
        { modeId: MODE_DARK, name: 'Dark' },
        { modeId: MODE_HC, name: 'High-Contrast' },
      ],
      variableIds: colorVariableIds,
    },
    [SCALE_COLLECTION_ID]: {
      id: SCALE_COLLECTION_ID,
      name: 'Methane Scale & Density',
      defaultModeId: MODE_DEFAULT,
      modes: [
        { modeId: MODE_COMPACT, name: 'Compact' },
        { modeId: MODE_DEFAULT, name: 'Default' },
        { modeId: MODE_COMFORTABLE, name: 'Comfortable' },
      ],
      variableIds: scaleVariableIds,
    },
  };

  return {
    version: 1,
    meta: {
      variableCollections,
      variables,
    },
  };
}

function isFigmaAlias(val: FigmaVariableValue): val is FigmaVariableAlias {
  return (
    typeof val === 'object' &&
    val !== null &&
    'type' in val &&
    val.type === 'VARIABLE_ALIAS' &&
    'id' in val
  );
}

function isFigmaColor(val: FigmaVariableValue): val is FigmaColorValue {
  return typeof val === 'object' && val !== null && 'r' in val && 'g' in val && 'b' in val;
}

function getNestedNode(root: Record<string, unknown>, path: string): Record<string, unknown> | null {
  let cursor: unknown = root;
  for (const segment of path.split('.')) {
    if (typeof cursor !== 'object' || cursor === null || Array.isArray(cursor)) return null;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === 'object' && cursor !== null && !Array.isArray(cursor)
    ? (cursor as Record<string, unknown>)
    : null;
}

function setNestedToken(
  root: Record<string, unknown>,
  path: string,
  tokenNode: Record<string, unknown>,
): void {
  const segments = path.split('.');
  let cursor = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!;
    const existing = cursor[seg];
    if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
      cursor[seg] = {};
    }
    cursor = cursor[seg] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]!] = tokenNode;
}

function inferTokenType(path: string, variable: FigmaVariable, baseType?: string): DtcgTokenType {
  if (baseType) return baseType as DtcgTokenType;
  if (variable.resolvedType === 'COLOR') return 'color';
  if (path.startsWith('motion.duration')) return 'duration';
  if (path.startsWith('motion.easing')) return 'cubicBezier';
  if (path.startsWith('fontWeight')) return 'fontWeight';
  if (path.startsWith('font.')) return 'fontFamily';
  if (path.startsWith('shadow.')) return 'shadow';
  if (path === 'density' || path.startsWith('lineHeight') || path.startsWith('zIndex')) {
    return 'number';
  }
  if (variable.resolvedType === 'FLOAT') return 'dimension';
  return 'string';
}

export function figmaVariablesToDtcg(
  payload: FigmaVariablesPayload,
  options: FigmaToDtcgOptions = {},
): DtcgDocument {
  const remBasePx = options.remBasePx ?? 16;
  const { variableCollections, variables } = payload.meta;
  const doc: Record<string, unknown> = {
    $description: 'Methane UI W3C DTCG tokens synced from Figma Variables',
  };

  const findModeId = (collection: FigmaVariableCollection | undefined, names: string[]): string | undefined => {
    if (!collection) return undefined;
    for (const target of names) {
      const found = collection.modes.find((m) => m.name.toLowerCase() === target.toLowerCase());
      if (found) return found.modeId;
    }
    return collection.defaultModeId;
  };

  const formatColorValue = (val: FigmaVariableValue): string => {
    if (isFigmaAlias(val)) {
      const targetVar = variables[val.id];
      const targetPath = targetVar ? pathForFigmaName(targetVar.name) : val.id.replace(/^var:/, '');
      return `{${targetPath}}`;
    }
    if (isFigmaColor(val)) {
      return figmaRgbaToOklchString(val);
    }
    return String(val);
  };

  const sortedVars = Object.values(variables).sort((a, b) => a.name.localeCompare(b.name));

  for (const variable of sortedVars) {
    const path = pathForFigmaName(variable.name);
    const collection = variableCollections[variable.variableCollectionId];
    const baseNode = options.baseDocument ? getNestedNode(options.baseDocument, path) : null;
    const parentGroupPath = path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : '';
    const baseGroup =
      options.baseDocument && parentGroupPath
        ? getNestedNode(options.baseDocument, parentGroupPath)
        : null;
    const inheritedBaseType =
      typeof baseNode?.['$type'] === 'string'
        ? baseNode['$type']
        : typeof baseGroup?.['$type'] === 'string'
          ? baseGroup['$type']
          : undefined;
    const dtcgType = inferTokenType(path, variable, inheritedBaseType);

    if (variable.resolvedType === 'COLOR') {
      const lightModeId = findModeId(collection, ['Light', 'Default']) ?? Object.keys(variable.valuesByMode)[0]!;
      const darkModeId = findModeId(collection, ['Dark']);
      const lightRaw = variable.valuesByMode[lightModeId];
      const darkRaw = darkModeId ? variable.valuesByMode[darkModeId] : undefined;

      const lightValue = lightRaw !== undefined ? formatColorValue(lightRaw) : 'oklch(0.5 0 0)';
      const darkValue = darkRaw !== undefined ? formatColorValue(darkRaw) : lightValue;

      const tokenNode: Record<string, unknown> = {
        $type: 'color',
        $value: lightValue,
      };
      if (darkValue !== lightValue || (baseNode?.['$extensions'] && typeof baseNode['$extensions'] === 'object')) {
        tokenNode['$extensions'] = {
          'com.methane.theme': {
            light: lightValue,
            dark: darkValue,
          },
        };
      }
      if (variable.description) tokenNode['$description'] = variable.description;
      setNestedToken(doc, path, tokenNode);
      continue;
    }

    const defaultModeId =
      findModeId(collection, ['Default', 'Light']) ?? Object.keys(variable.valuesByMode)[0]!;
    const rawVal = variable.valuesByMode[defaultModeId];
    let dtcgValue: unknown = rawVal;

    if (typeof rawVal === 'number') {
      if (dtcgType === 'duration') {
        dtcgValue = `${rawVal}ms`;
      } else if (dtcgType === 'dimension') {
        const usePx =
          path === 'space.0' ||
          path === 'space.px' ||
          path === 'radius.none' ||
          path === 'radius.full';
        dtcgValue = usePx ? `${rawVal}px` : `${Number((rawVal / remBasePx).toFixed(4))}rem`;
      } else {
        dtcgValue = rawVal;
      }
    } else if (typeof rawVal === 'string') {
      if (dtcgType === 'cubicBezier' && rawVal.startsWith('cubic-bezier(')) {
        const nums = rawVal
          .slice('cubic-bezier('.length, -1)
          .split(',')
          .map((n) => Number(n.trim()));
        if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
          dtcgValue = nums;
        }
      } else if (dtcgType === 'shadow' && baseNode && '$value' in baseNode) {
        dtcgValue = baseNode['$value'];
      } else if (dtcgType === 'fontFamily' && baseNode && '$value' in baseNode) {
        dtcgValue = baseNode['$value'];
      }
    }

    if (path in DENSITY_BASE_PX && baseNode && '$value' in baseNode) {
      dtcgValue = baseNode['$value'];
    }

    const tokenNode: Record<string, unknown> = {
      $type: dtcgType,
      $value: dtcgValue,
    };
    if (variable.description) tokenNode['$description'] = variable.description;
    setNestedToken(doc, path, tokenNode);
  }

  return doc as DtcgDocument;
}
