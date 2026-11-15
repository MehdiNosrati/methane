import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const buttonSpec: ComponentBehaviorSpec = {
  tag: 'mth-button',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'loading'],
  keyboard: [
    { key: 'Enter', when: 'Button or link is focused and neither disabled nor loading', expect: 'Activates the control and emits mth-press' },
    { key: ' ', when: 'Button is focused and neither disabled nor loading', expect: 'Activates the button and emits mth-press' },
  ],
  props: [
    { name: 'variant', attr: 'variant', type: "'solid' | 'soft' | 'outline' | 'outlined' | 'ghost' | 'danger'", default: 'solid' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'type', attr: 'type', type: "'button' | 'submit' | 'reset'", default: 'button' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'href', attr: 'href', type: 'string', default: '' },
    { name: 'target', attr: 'target', type: 'string', default: '' },
    { name: 'rel', attr: 'rel', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-press',
      cancelable: true,
      detailType: '{ originalEvent: Event }',
    },
  ],
  slots: [
    { name: '', description: 'Button label content.' },
    { name: 'prefix', description: 'Leading icon or indicator.' },
    { name: 'suffix', description: 'Trailing icon or badge.' },
  ],
  parts: [
    { name: 'base', description: 'Root button container.' },
    { name: 'control', description: 'Native internal button or anchor element.' },
    { name: 'spinner', description: 'Loading indicator displayed when loading is true.' },
  ],
  messages: {
    loadingLabel: 'Loading',
  },
};

export const CEM_METADATA = {
  description: 'Action button with variant, size, form submit/reset, anchor link, and loading states.',
  propDescriptions: {
    variant: 'Visual button emphasis.',
    size: 'Control size token scale.',
    type: 'Native button behavior inside forms (`button`, `submit`, or `reset`).',
    disabled: 'Disables interaction.',
    loading: 'Shows loading spinner and suppresses duplicate clicks.',
    href: 'Optional safe navigation URL rendering an internal `<a>` element.',
    target: 'Browsing context target when `href` is set.',
    rel: 'Relationship attribute when `href` is set (automatically includes `noopener noreferrer` for `_blank`).',
    name: 'Form field name submitted when activated as a submit button.',
    value: 'Form field value submitted when activated as a submit button.',
  },
  eventDescriptions: {
    'mth-press': 'Fired when activated via pointer or keyboard while neither disabled nor loading.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Solid variant background color.' },
    { name: '--mth-color-accent-fg', description: 'Solid variant foreground color.' },
    { name: '--mth-color-danger', description: 'Danger variant background color.' },
    { name: '--mth-radius-md', description: 'Button corner radius.' },
  ],
};
