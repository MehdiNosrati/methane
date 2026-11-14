export const MTH_CASCADE_LAYERS = [
  'mth.reset',
  'mth.tokens',
  'mth.primitives',
  'mth.utilities',
] as const;

export type MethaneCascadeLayer = (typeof MTH_CASCADE_LAYERS)[number];

export const LAYER_ORDER_DECLARATION = `@layer ${MTH_CASCADE_LAYERS.join(', ')};`;

export const DEFINED_FALLBACK_ANIMATION = 'mth-defined-fallback';
