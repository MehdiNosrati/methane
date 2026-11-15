import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { cookieBannerMessages } from './cookie-banner.messages.js';

export const cookieBannerSpec: ComponentBehaviorSpec = {
  tag: 'mth-cookie-banner',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController'],
  focusModel: 'none',
  states: ['open', 'preferences-open'],
  keyboard: [{ key: 'Escape', when: 'open', expect: 'Dismisses the banner without accepting optional cookies.' }],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'position', attr: 'position', type: "'bottom' | 'top' | 'floating'", default: 'bottom' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'analytics', attr: 'analytics', type: 'boolean', default: false },
    { name: 'marketing', attr: 'marketing', type: 'boolean', default: false },
    { name: 'showPreferences', attr: 'show-preferences', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
    { name: 'mth-consent', cancelable: false, detailType: '{ essential: boolean; analytics: boolean; marketing: boolean }' },
  ],
  slots: [
    { name: '', description: 'Custom consent disclosure copy.' },
    { name: 'actions', description: 'Optional extra links or controls.' },
  ],
  parts: [
    { name: 'base', description: 'Cookie consent banner surface.' },
    { name: 'content', description: 'Heading and disclosure text container.' },
    { name: 'heading', description: 'Banner heading.' },
    { name: 'preferences', description: 'Expandable granular cookie category toggles.' },
    { name: 'actions', description: 'Primary and secondary consent action buttons.' },
    { name: 'customize-button', description: 'Button toggling granular preferences.' },
    { name: 'reject-button', description: 'Reject optional cookies button.' },
    { name: 'accept-button', description: 'Accept all cookies button.' },
    { name: 'save-button', description: 'Save custom cookie preferences button.' },
  ],
  messages: { ...cookieBannerMessages },
};

export const CEM_METADATA = {
  description:
    'Accessible cookie consent notice supporting one-click accept all, reject optional, and granular category preferences.',
  propDescriptions: {
    open: 'Controls whether the cookie banner is visible.',
    position: 'Placement mode (`bottom`, `top`, or `floating`).',
    heading: 'Optional heading text overriding default localized title.',
    analytics: 'Whether optional analytics cookies are enabled.',
    marketing: 'Whether optional marketing cookies are enabled.',
    showPreferences: 'Expands the granular consent checkboxes.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the banner.',
    'mth-after-open': 'Fired after opening the banner.',
    'mth-close': 'Cancelable event fired before closing the banner.',
    'mth-after-close': 'Fired after closing the banner.',
    'mth-consent': 'Fired when consent preferences are confirmed.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Banner background color' },
    { name: '--mth-color-fg', description: 'Banner foreground text color' },
    { name: '--mth-color-border', description: 'Banner border color' },
    { name: '--mth-color-accent', description: 'Primary accept button background' },
    { name: '--mth-color-accent-fg', description: 'Primary accept button foreground' },
    { name: '--mth-radius-lg', description: 'Banner corner radius when floating' },
    { name: '--mth-shadow-lg', description: 'Banner elevation shadow' },
  ],
};
