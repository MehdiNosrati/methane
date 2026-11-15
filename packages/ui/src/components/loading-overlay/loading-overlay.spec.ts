import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { loadingOverlayMessages } from './loading-overlay.messages.js';

export const loadingOverlaySpec: ComponentBehaviorSpec = {
  tag: 'mth-loading-overlay',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['active', 'fullscreen'],
  keyboard: [],
  props: [
    { name: 'active', attr: 'active', type: 'boolean', default: false },
    { name: 'fullscreen', attr: 'fullscreen', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'blurred', attr: 'blurred', type: 'boolean', default: false },
  ],
  events: [{ name: 'mth-active-change', cancelable: false, detailType: '{ active: boolean }' }],
  slots: [
    { name: '', description: 'Target content overlaid when `active` is true.' },
    { name: 'spinner', description: 'Optional custom spinner graphic.' },
  ],
  parts: [
    { name: 'base', description: 'Relative host container wrapping content and backdrop.' },
    { name: 'content', description: 'Wrapper around slotted host content with `aria-busy`.' },
    { name: 'backdrop', description: 'Loading backdrop scrim and centered indicator.' },
    { name: 'spinner', description: 'Animated CSS spinner.' },
    { name: 'label', description: 'Accessible loading message text.' },
  ],
  messages: { ...loadingOverlayMessages },
};

export const CEM_METADATA = {
  description:
    'Region or fullscreen loading overlay displaying an animated CSS spinner, `aria-busy` scrim, and localized status message over slotted content.',
  propDescriptions: {
    active: 'Controls whether the loading overlay scrim is displayed.',
    fullscreen: 'Pins the overlay across the full viewport (`position: fixed`).',
    label: 'Optional message displayed below the spinner and announced to screen readers.',
    blurred: 'Applies a subtle backdrop blur over underlying content when supported.',
  },
  eventDescriptions: {
    'mth-active-change': 'Fired when the `active` loading state toggles.',
  },
  cssProperties: [
    { name: '--mth-color-backdrop', description: 'Scrim backdrop color' },
    { name: '--mth-color-accent', description: 'Spinner arc color' },
    { name: '--mth-color-fg', description: 'Label text color' },
    { name: '--mth-z-index-overlay', description: 'Overlay stacking z-index' },
  ],
};
