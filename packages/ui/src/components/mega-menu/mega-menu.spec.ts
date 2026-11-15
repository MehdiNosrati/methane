import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { megaMenuMessages } from './mega-menu.messages.js';

export interface MegaMenuLink {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
}

export interface MegaMenuColumn {
  readonly title: string;
  readonly links: ReadonlyArray<MegaMenuLink>;
}

export interface MegaMenuSection {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly disabled?: boolean;
  readonly columns?: ReadonlyArray<MegaMenuColumn>;
}

export const EMPTY_MEGA_MENU_SECTIONS: ReadonlyArray<MegaMenuSection> = Object.freeze([]);

export const megaMenuSpec: ComponentBehaviorSpec = {
  tag: 'mth-mega-menu',
  package: '@methane-ui/ui',
  conformance: ['overlay', 'roving-focus'],
  controllers: ['OverlayController', 'PositioningController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['open'],
  keyboard: [
    { key: 'ArrowRight', when: 'trigger bar focused', expect: 'moves focus to next trigger' },
    { key: 'ArrowLeft', when: 'trigger bar focused', expect: 'moves focus to previous trigger' },
    { key: 'ArrowDown', when: 'focused on expandable trigger', expect: 'opens section panel' },
    { key: 'Escape', when: 'panel open', expect: 'closes panel and restores focus to trigger' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'openSection', attr: 'open-section', type: 'string', default: '' },
    { name: 'hoverDelay', attr: 'hover-delay', type: 'number', default: 120 },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    {
      name: 'sections',
      attr: false,
      type: 'ReadonlyArray<MegaMenuSection>',
      default: EMPTY_MEGA_MENU_SECTIONS,
    },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: '{ sectionId: string }' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ sectionId: string; href: string; label: string }',
    },
  ],
  slots: [
    { name: '', description: 'Optional custom mega menu panel content.' },
    { name: 'brand', description: 'Optional leading brand slot in the navigation bar.' },
  ],
  parts: [
    { name: 'nav', description: 'Semantic `<nav>` landmark container.' },
    { name: 'triggers', description: 'Horizontal bar of top-level section triggers.' },
    { name: 'trigger', description: 'Top-level section trigger button or link.' },
    { name: 'panel', description: 'Floating `[popover]` multi-column mega panel.' },
    { name: 'columns', description: 'Multi-column CSS grid layout inside the panel.' },
    { name: 'column-title', description: 'Heading for a column inside the panel.' },
    { name: 'link', description: 'Navigation link inside a column.' },
    { name: 'description', description: 'Optional helper description under a link.' },
  ],
  messages: { ...megaMenuMessages },
};

export const CEM_METADATA = {
  description:
    'Multi-column expandable navigation mega menu combining RovingFocusController triggers with OverlayController + PositioningController panels.',
  propDescriptions: {
    label: 'Accessible label for the `<nav>` landmark.',
    open: 'Whether the mega menu panel is open.',
    openSection: 'Active section ID currently displayed inside the panel.',
    hoverDelay: 'Pointer hover intent delay in milliseconds before switching sections.',
    forceFallback: 'Forces JS fallback positioning and non-top-layer overlay rendering.',
    sections: 'Structured top-level navigation sections and multi-column link groups.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the panel.',
    'mth-after-open': 'Fired after the panel opens.',
    'mth-close': 'Cancelable event fired before closing the panel.',
    'mth-after-close': 'Fired after the panel closes.',
    'mth-select': 'Fired when a link inside a column is clicked.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Top navigation bar background.' },
    { name: '--mth-color-surface-raised', description: 'Floating panel surface background.' },
    { name: '--mth-color-fg', description: 'Primary foreground text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted description text color.' },
    { name: '--mth-color-border', description: 'Bar and panel border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-radius-md', description: 'Trigger and panel corner radius.' },
    { name: '--mth-shadow-lg', description: 'Panel elevation shadow.' },
    { name: '--mth-z-index-popover', description: 'Panel stacking z-index.' },
  ],
};
