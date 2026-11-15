import { compileDtcgTokens, type DtcgDocument } from './compiler.js';
import rawTokens from './tokens.dtcg.json' with { type: 'json' };

export {
  compileDtcgTokens,
  pathToCssVar,
  toKebabCase,
  type CompileResult,
  type CompiledToken,
  type DtcgDocument,
  type DtcgGroupNode,
  type DtcgShadowValue,
  type DtcgThemeExtension,
  type DtcgTokenNode,
  type DtcgTokenType,
} from './compiler.js';

const compiled = compileDtcgTokens(rawTokens as DtcgDocument);

export const dtcgSource = rawTokens as DtcgDocument;
export const compiledTokens = compiled.tokens;
export const tokensCss = compiled.css;

export const tokenVars = {
  color: {
    seed: {
      brand: '--mth-color-seed-brand',
      neutral: '--mth-color-seed-neutral',
      danger: '--mth-color-seed-danger',
      warning: '--mth-color-seed-warning',
      success: '--mth-color-seed-success',
      info: '--mth-color-seed-info',
    },
    brand: {
      50: '--mth-color-brand-50',
      100: '--mth-color-brand-100',
      200: '--mth-color-brand-200',
      300: '--mth-color-brand-300',
      400: '--mth-color-brand-400',
      500: '--mth-color-brand-500',
      600: '--mth-color-brand-600',
      700: '--mth-color-brand-700',
      800: '--mth-color-brand-800',
      900: '--mth-color-brand-900',
      950: '--mth-color-brand-950',
    },
    neutral: {
      50: '--mth-color-neutral-50',
      100: '--mth-color-neutral-100',
      200: '--mth-color-neutral-200',
      300: '--mth-color-neutral-300',
      400: '--mth-color-neutral-400',
      500: '--mth-color-neutral-500',
      600: '--mth-color-neutral-600',
      700: '--mth-color-neutral-700',
      800: '--mth-color-neutral-800',
      900: '--mth-color-neutral-900',
      950: '--mth-color-neutral-950',
    },
    bg: '--mth-color-bg',
    bgSubtle: '--mth-color-bg-subtle',
    bgMuted: '--mth-color-bg-muted',
    surface: '--mth-color-surface',
    surfaceRaised: '--mth-color-surface-raised',
    fg: '--mth-color-fg',
    fgMuted: '--mth-color-fg-muted',
    fgSubtle: '--mth-color-fg-subtle',
    border: '--mth-color-border',
    borderStrong: '--mth-color-border-strong',
    borderFocus: '--mth-color-border-focus',
    accent: '--mth-color-accent',
    accentHover: '--mth-color-accent-hover',
    accentActive: '--mth-color-accent-active',
    accentSubtle: '--mth-color-accent-subtle',
    accentFg: '--mth-color-accent-fg',
    danger: '--mth-color-danger',
    dangerSubtle: '--mth-color-danger-subtle',
    dangerFg: '--mth-color-danger-fg',
    warning: '--mth-color-warning',
    warningSubtle: '--mth-color-warning-subtle',
    success: '--mth-color-success',
    successSubtle: '--mth-color-success-subtle',
    info: '--mth-color-info',
    infoSubtle: '--mth-color-info-subtle',
    backdrop: '--mth-color-backdrop',
  },
  density: '--mth-density',
  space: {
    0: '--mth-space-0',
    px: '--mth-space-px',
    1: '--mth-space-1',
    2: '--mth-space-2',
    3: '--mth-space-3',
    4: '--mth-space-4',
    5: '--mth-space-5',
    6: '--mth-space-6',
    8: '--mth-space-8',
    10: '--mth-space-10',
    12: '--mth-space-12',
    16: '--mth-space-16',
    20: '--mth-space-20',
    24: '--mth-space-24',
    controlInline: '--mth-space-control-inline',
    controlBlock: '--mth-space-control-block',
    controlGap: '--mth-space-control-gap',
  },
  font: {
    sans: '--mth-font-sans',
    mono: '--mth-font-mono',
    serif: '--mth-font-serif',
  },
  fontSize: {
    xs: '--mth-font-size-xs',
    sm: '--mth-font-size-sm',
    md: '--mth-font-size-md',
    lg: '--mth-font-size-lg',
    xl: '--mth-font-size-xl',
    '2xl': '--mth-font-size-2xl',
    '3xl': '--mth-font-size-3xl',
    '4xl': '--mth-font-size-4xl',
  },
  fontWeight: {
    normal: '--mth-font-weight-normal',
    medium: '--mth-font-weight-medium',
    semibold: '--mth-font-weight-semibold',
    bold: '--mth-font-weight-bold',
  },
  lineHeight: {
    tight: '--mth-line-height-tight',
    normal: '--mth-line-height-normal',
    relaxed: '--mth-line-height-relaxed',
  },
  radius: {
    none: '--mth-radius-none',
    xs: '--mth-radius-xs',
    sm: '--mth-radius-sm',
    md: '--mth-radius-md',
    lg: '--mth-radius-lg',
    xl: '--mth-radius-xl',
    '2xl': '--mth-radius-2xl',
    full: '--mth-radius-full',
  },
  shadow: {
    none: '--mth-shadow-none',
    xs: '--mth-shadow-xs',
    sm: '--mth-shadow-sm',
    md: '--mth-shadow-md',
    lg: '--mth-shadow-lg',
  },
  motion: {
    duration: {
      instant: '--mth-motion-duration-instant',
      fast: '--mth-motion-duration-fast',
      normal: '--mth-motion-duration-normal',
      slow: '--mth-motion-duration-slow',
    },
    easing: {
      standard: '--mth-motion-easing-standard',
      emphasized: '--mth-motion-easing-emphasized',
      decelerate: '--mth-motion-easing-decelerate',
      accelerate: '--mth-motion-easing-accelerate',
    },
  },
  zIndex: {
    base: '--mth-z-index-base',
    dropdown: '--mth-z-index-dropdown',
    sticky: '--mth-z-index-sticky',
    overlay: '--mth-z-index-overlay',
    modal: '--mth-z-index-modal',
    popover: '--mth-z-index-popover',
    toast: '--mth-z-index-toast',
    tooltip: '--mth-z-index-tooltip',
  },
  focus: {
    ringWidth: '--mth-focus-ring-width',
    ringOffset: '--mth-focus-ring-offset',
  },
} as const;

export type TokenVars = typeof tokenVars;
export const tokenMap: Readonly<Record<string, `--mth-${string}`>> = compiled.tokenMap;

export function cssVar(name: `--mth-${string}`, fallback?: string): string {
  return fallback !== undefined ? `var(${name}, ${fallback})` : `var(${name})`;
}
