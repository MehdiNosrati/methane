import { compileDtcgTokens, dtcgSource, type DtcgDocument } from '@methane/tokens';

export type RadiusPreset = 'none' | 'sharp' | 'default' | 'rounded' | 'pill';
export type DensityPreset = 'compact' | 'default' | 'comfortable';

export interface ThemeBuilderConfig {
  readonly brandLightness: number;
  readonly brandChroma: number;
  readonly brandHue: number;
  readonly radiusPreset: RadiusPreset;
  readonly density: DensityPreset;
}

export const DEFAULT_THEME_CONFIG: ThemeBuilderConfig = {
  brandLightness: 0.56,
  brandChroma: 0.21,
  brandHue: 255,
  radiusPreset: 'default',
  density: 'default',
};

const RADIUS_PRESET_MAP: Readonly<Record<RadiusPreset, { sm: string; md: string; lg: string; xl: string }>> = {
  none: { sm: '0px', md: '0px', lg: '0px', xl: '0px' },
  sharp: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem' },
  default: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
  rounded: { sm: '0.375rem', md: '0.625rem', lg: '0.875rem', xl: '1.25rem' },
  pill: { sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
};

const DENSITY_MAP: Readonly<Record<DensityPreset, number>> = {
  compact: 0.8,
  default: 1,
  comfortable: 1.2,
};

export function formatBrandSeedOklch(config: ThemeBuilderConfig): string {
  const l = Number(config.brandLightness.toFixed(3));
  const c = Number(config.brandChroma.toFixed(3));
  const h = Math.round(config.brandHue);
  return `oklch(${l} ${c} ${h})`;
}

export function generateThemeCssOverrides(config: ThemeBuilderConfig): string {
  const seed = formatBrandSeedOklch(config);
  const radii = RADIUS_PRESET_MAP[config.radiusPreset];
  const density = DENSITY_MAP[config.density];

  return [
    ':root {',
    `  --mth-color-seed-brand: ${seed};`,
    `  --mth-density: ${density};`,
    `  --mth-radius-sm: ${radii.sm};`,
    `  --mth-radius-md: ${radii.md};`,
    `  --mth-radius-lg: ${radii.lg};`,
    `  --mth-radius-xl: ${radii.xl};`,
    '  --mth-space-control-inline: calc(var(--mth-space-3) * var(--mth-density));',
    '  --mth-space-control-block: calc(var(--mth-space-2) * var(--mth-density));',
    '  --mth-space-control-gap: calc(var(--mth-space-2) * var(--mth-density));',
    '}',
    '',
  ].join('\n');
}

export function generateThemeDtcgDocument(config: ThemeBuilderConfig): DtcgDocument {
  const clone = structuredClone(dtcgSource) as Record<string, unknown>;
  const color = clone['color'] as Record<string, unknown>;
  const seed = color['seed'] as Record<string, unknown>;
  seed['brand'] = {
    $value: formatBrandSeedOklch(config),
    $description: 'Primary brand accent seed in OKLCH (Theme Builder)',
  };

  const radius = clone['radius'] as Record<string, unknown>;
  const radii = RADIUS_PRESET_MAP[config.radiusPreset];
  radius['sm'] = { $value: radii.sm };
  radius['md'] = { $value: radii.md };
  radius['lg'] = { $value: radii.lg };
  radius['xl'] = { $value: radii.xl };

  clone['density'] = {
    $type: 'number',
    $value: DENSITY_MAP[config.density],
    $description: `Global density multiplier (${config.density})`,
  };

  return clone as DtcgDocument;
}

export function compileThemeDtcgCss(config: ThemeBuilderConfig): string {
  return compileDtcgTokens(generateThemeDtcgDocument(config)).css;
}
