export const MTH_CASCADE_LAYERS = [
  'mth.reset',
  'mth.tokens',
  'mth.primitives',
  'mth.utilities',
] as const;

export type MethaneCascadeLayer = (typeof MTH_CASCADE_LAYERS)[number];

export const LAYER_ORDER_DECLARATION = `@layer ${MTH_CASCADE_LAYERS.join(', ')};`;

export const DEFINED_FALLBACK_ANIMATION = 'mth-defined-fallback';

export const MTH_LAYOUT_PRIMITIVES = [
  'mth-stack',
  'mth-grid',
  'mth-flex',
  'mth-container',
  'mth-aspect-ratio',
  'mth-sticky',
  'mth-divider',
  'mth-spacer',
  'mth-app-shell',
  'mth-sidebar-layout',
  'mth-bento-grid',
] as const;

export const MTH_UNUPGRADED_TAG_PRIMITIVES = [
  'mth-stack',
  'mth-grid',
  'mth-flex',
  'mth-container',
  'mth-spacer',
] as const;

export const MTH_TYPOGRAPHY_PRIMITIVES = ['mth-prose', 'mth-dl'] as const;

export const MTH_MARKETING_PRIMITIVES = [
  'mth-hero',
  'mth-feature-grid',
  'mth-testimonial',
  'mth-logo-cloud',
  'mth-footer',
  'mth-faq',
  'mth-article-layout',
  'mth-pricing-table',
  'mth-cta',
  'mth-announcement-bar',
] as const;

export const MTH_CSS_PRIMITIVES = [
  ...MTH_LAYOUT_PRIMITIVES,
  ...MTH_TYPOGRAPHY_PRIMITIVES,
  ...MTH_MARKETING_PRIMITIVES,
] as const;
