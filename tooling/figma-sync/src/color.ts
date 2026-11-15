import type { FigmaColorValue } from './types.js';

export interface OklchColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly alpha: number;
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

function linearToSrgb(c: number): number {
  const clamped = clamp01(c);
  if (clamped <= 0.0031308) return 12.92 * clamped;
  return 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function srgbToLinear(c: number): number {
  const clamped = clamp01(c);
  if (clamped <= 0.04045) return clamped / 12.92;
  return Math.pow((clamped + 0.055) / 1.055, 2.4);
}

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

export function oklchToFigmaRgba(oklch: OklchColor): FigmaColorValue {
  const hueRad = (oklch.h * Math.PI) / 180;
  const a = oklch.c * Math.cos(hueRad);
  const b = oklch.c * Math.sin(hueRad);

  const l_ = oklch.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = oklch.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = oklch.l - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: roundTo(linearToSrgb(rLin), 6),
    g: roundTo(linearToSrgb(gLin), 6),
    b: roundTo(linearToSrgb(bLin), 6),
    a: roundTo(clamp01(oklch.alpha), 6),
  };
}

export function figmaRgbaToOklchString(color: FigmaColorValue): string {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.sqrt(okA * okA + okB * okB);
  let h = (Math.atan2(okB, okA) * 180) / Math.PI;
  if (h < 0) h += 360;

  const lOut = roundTo(clamp01(okL), 4);
  const cOut = c < 0.0005 ? 0 : roundTo(c, 4);
  const hOut = cOut === 0 ? 0 : roundTo(h, 2);
  const aOut = roundTo(clamp01(color.a), 4);

  if (aOut < 1) {
    return `oklch(${lOut} ${cOut} ${hOut} / ${aOut})`;
  }
  return `oklch(${lOut} ${cOut} ${hOut})`;
}

function evalSimpleMath(expr: string, vars: Readonly<Record<string, number>>): number {
  let replaced = expr.trim();
  for (const [name, value] of Object.entries(vars)) {
    replaced = replaced.replace(new RegExp(`\\b${name}\\b`, 'g'), String(value));
  }
  replaced = replaced.replace(/\bcalc\s*\(/g, '(');

  // Safe arithmetic evaluator supporting +, -, *, /, parentheses, and numeric literals.
  let pos = 0;

  const skipWs = () => {
    while (pos < replaced.length && /\s/.test(replaced[pos]!)) pos++;
  };

  const parseExpr = (): number => {
    let val = parseTerm();
    while (true) {
      skipWs();
      const ch = replaced[pos];
      if (ch === '+') {
        pos++;
        val += parseTerm();
      } else if (ch === '-') {
        pos++;
        val -= parseTerm();
      } else {
        break;
      }
    }
    return val;
  };

  const parseTerm = (): number => {
    let val = parseFactor();
    while (true) {
      skipWs();
      const ch = replaced[pos];
      if (ch === '*') {
        pos++;
        val *= parseFactor();
      } else if (ch === '/') {
        pos++;
        const denom = parseFactor();
        val = denom === 0 ? 0 : val / denom;
      } else {
        break;
      }
    }
    return val;
  };

  const parseFactor = (): number => {
    skipWs();
    if (replaced[pos] === '(') {
      pos++;
      const inner = parseExpr();
      skipWs();
      if (replaced[pos] === ')') pos++;
      return inner;
    }
    if (replaced[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (replaced[pos] === '+') {
      pos++;
      return parseFactor();
    }
    const start = pos;
    while (pos < replaced.length && /[0-9.]/.test(replaced[pos]!)) pos++;
    const numStr = replaced.slice(start, pos);
    const num = Number(numStr);
    return Number.isFinite(num) ? num : 0;
  };

  return parseExpr();
}

function splitTopLevelTokens(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(ch)) {
      if (current.length > 0) {
        parts.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) parts.push(current);
  return parts;
}

export function parseOklchColor(
  cssColor: string,
  resolveVar?: (cssVarName: string) => OklchColor | null,
): OklchColor | null {
  const trimmed = cssColor.trim();
  const match = /^oklch\((.*)\)$/i.exec(trimmed);
  if (!match) return null;

  const rawBody = match[1]!.trim();
  const slashIndex = rawBody.lastIndexOf('/');
  let channelsPart = rawBody;
  let alpha = 1;

  if (slashIndex !== -1) {
    const before = rawBody.slice(0, slashIndex).trim();
    const after = rawBody.slice(slashIndex + 1).trim();
    channelsPart = before;
    alpha = after.endsWith('%') ? Number(after.slice(0, -1)) / 100 : Number(after);
    if (!Number.isFinite(alpha)) alpha = 1;
  }

  let base: OklchColor = { l: 0.5, c: 0, h: 0, alpha: 1 };
  const fromMatch = /^from\s+var\((--mth-[a-z0-9-]+)\)\s+(.*)$/i.exec(channelsPart);
  if (fromMatch) {
    const origin = resolveVar?.(fromMatch[1]!);
    if (!origin) return null;
    base = origin;
    channelsPart = fromMatch[2]!.trim();
  }

  const tokens = splitTopLevelTokens(channelsPart);
  if (tokens.length < 3) return null;

  const vars = { l: base.l, c: base.c, h: base.h };
  const parseChannel = (token: string, scalePercent = 1): number => {
    const t = token.trim();
    if (t.endsWith('%') && !t.includes('calc(')) {
      return (Number(t.slice(0, -1)) / 100) * scalePercent;
    }
    return evalSimpleMath(t, vars);
  };

  return {
    l: clamp01(parseChannel(tokens[0]!)),
    c: Math.max(0, parseChannel(tokens[1]!)),
    h: ((parseChannel(tokens[2]!) % 360) + 360) % 360,
    alpha: clamp01(alpha),
  };
}
