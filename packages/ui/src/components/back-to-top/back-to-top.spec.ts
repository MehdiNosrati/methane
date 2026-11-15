import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { backToTopMessages } from './back-to-top.messages.js';

export const backToTopSpec: ComponentBehaviorSpec = {
  tag: 'mth-back-to-top',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['visible'],
  keyboard: [
    { key: 'Enter', when: 'button focused', expect: 'scrolls document or target container to top' },
    { key: 'Space', when: 'button focused', expect: 'scrolls document or target container to top' },
  ],
  props: [
    { name: 'threshold', attr: 'threshold', type: 'number', default: 300 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'smooth', attr: 'smooth', type: 'boolean', default: true },
    { name: 'visible', attr: 'visible', type: 'boolean', default: false },
    { name: 'alwaysVisible', attr: 'always-visible', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-scroll-top',
      cancelable: true,
      detailType: '{ threshold: number }',
    },
  ],
  slots: [
    { name: '', description: 'Optional custom button label or icon content.' },
  ],
  parts: [
    { name: 'button', description: 'Floating back-to-top `<button>`.' },
  ],
  messages: { ...backToTopMessages },
};

export const CEM_METADATA = {
  description:
    'Floating scroll-to-top action button that reveals automatically after scrolling past `threshold` pixels.',
  propDescriptions: {
    threshold: 'Vertical scroll offset in pixels before the button becomes visible.',
    label: 'Accessible button `aria-label` override.',
    smooth: 'Uses smooth scroll behavior unless reduced motion is preferred.',
    visible: 'Reflected visibility state when threshold is exceeded or `alwaysVisible` is true.',
    alwaysVisible: 'Keeps the button visible regardless of scroll offset.',
  },
  eventDescriptions: {
    'mth-scroll-top': 'Cancelable event dispatched just before scrolling to top.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Button surface background.' },
    { name: '--mth-color-fg', description: 'Button text color.' },
    { name: '--mth-color-border', description: 'Button border color.' },
    { name: '--mth-color-accent', description: 'Focus ring outline color.' },
    { name: '--mth-radius-full', description: 'Pill/circle corner radius.' },
    { name: '--mth-shadow-md', description: 'Floating button shadow.' },
    { name: '--mth-z-index-sticky', description: 'Floating button z-index.' },
  ],
};
