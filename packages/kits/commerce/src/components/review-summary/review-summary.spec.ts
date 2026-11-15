import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { reviewSummaryMessages } from './review-summary.messages.js';

export const reviewSummarySpec: ComponentBehaviorSpec = {
  tag: 'mth-review-summary',
  package: '@methane-ui/commerce',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['filtered', 'empty'],
  keyboard: [],
  props: [
    { name: 'average', attr: 'average', type: 'number', default: 0 },
    { name: 'totalReviews', attr: 'total-reviews', type: 'number', default: 0 },
    { name: 'breakdown', attr: false, type: 'Record<number, number>' },
    { name: 'activeStar', attr: 'active-star', type: 'number | null', default: null },
    { name: 'maxStars', attr: 'max-stars', type: 'number', default: 5 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-rating-filter',
      cancelable: false,
      detailType: '{ star: number | null }',
    },
  ],
  slots: [{ name: 'actions', description: 'Optional call-to-action slot (e.g. Write a review).' }],
  parts: [
    { name: 'base', description: 'Root summary container.' },
    { name: 'score', description: 'Average numeric rating.' },
    { name: 'total', description: 'Total review count.' },
    { name: 'row', description: 'Interactive star distribution row button.' },
    { name: 'bar', description: 'Distribution bar track and fill.' },
  ],
  messages: { ...reviewSummaryMessages },
};

export const CEM_METADATA = {
  description:
    'Aggregate rating summary with 5-to-1 distribution bars rendered via adopted CSSStyleSheet and interactive star-filter toggles.',
  propDescriptions: {
    average: 'Average rating value.',
    totalReviews: 'Total number of reviews.',
    breakdown: 'Map from star rating (1..5) to review count.',
    activeStar: 'Currently active star filter, or null when unfiltered.',
    maxStars: 'Maximum rating scale (default 5).',
    label: 'Accessible region label overriding localized default.',
  },
  cssProperties: [
    { name: '--mth-color-warning', description: 'Star rating fill accent color.' },
    { name: '--mth-color-surface', description: 'Summary container background.' },
    { name: '--mth-color-border', description: 'Summary container border color.' },
  ],
};
