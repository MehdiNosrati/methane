import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const speedDialSpec: ComponentBehaviorSpec = {
  tag: 'mth-speed-dial',
  package: '@methane-ui/ui',
  conformance: ['overlay', 'roving-focus'],
  controllers: [
    'OverlayController',
    'RovingFocusController',
    'MotionController',
    'SlotCollectionController',
  ],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled'],
  keyboard: [
    { key: 'Enter', when: 'Trigger button is focused', expect: 'Toggles speed-dial actions menu open/closed' },
    { key: 'ArrowUp', when: 'Actions menu is open in vertical direction', expect: 'Moves focus between speed-dial action items' },
    { key: 'ArrowDown', when: 'Actions menu is open in vertical direction', expect: 'Moves focus between speed-dial action items' },
    { key: 'Escape', when: 'Actions menu is open', expect: 'Closes speed-dial and restores focus to trigger' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'direction', attr: 'direction', type: "'up' | 'down' | 'start' | 'end'", default: 'up' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'variant', attr: 'variant', type: "'primary' | 'surface' | 'secondary'", default: 'primary' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: '{ open: true }' },
    { name: 'mth-after-open', cancelable: false, detailType: '{ open: true }' },
    { name: 'mth-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-select', cancelable: false, detailType: '{ value: string; label: string }' },
  ],
  slots: [
    { name: 'icon', description: 'Trigger FAB icon content.' },
    { name: '', description: 'Optional slotted action buttons when `.actions` property is omitted.' },
  ],
  parts: [
    { name: 'base', description: 'Root speed-dial layout container.' },
    { name: 'trigger', description: 'Primary FAB toggle button.' },
    { name: 'actions', description: 'Floating action list container.' },
    { name: 'action', description: 'Individual rendered action button.' },
  ],
  messages: {
    triggerLabel: 'Speed dial actions',
    actionsLabel: 'Available actions',
  },
};

export const CEM_METADATA = {
  description: 'Floating speed-dial FAB revealing contextual secondary actions with roving focus and Escape dismissal.',
  propDescriptions: {
    open: 'Whether the speed-dial action tray is expanded.',
    direction: 'Expansion direction relative to the trigger (`up`, `down`, `start`, or `end`).',
    label: 'Accessible `aria-label` for the main trigger button.',
    disabled: 'Disables trigger interaction.',
    variant: 'Trigger button style (`primary`, `surface`, or `secondary`).',
    size: 'Trigger dimension scale (`sm`, `md`, or `lg`).',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before expanding actions.',
    'mth-after-open': 'Fired after actions finish expanding.',
    'mth-close': 'Fired when actions close.',
    'mth-after-close': 'Fired after close completes and focus returns to the trigger.',
    'mth-select': 'Fired when a speed-dial action item is activated.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Primary trigger background.' },
    { name: '--mth-color-surface-raised', description: 'Action button background.' },
    { name: '--mth-shadow-lg', description: 'Floating elevation shadow.' },
  ],
};
