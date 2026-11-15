/**
 * Temporary Phase 1 fallback CEM declarations (`mth-button`, `mth-checkbox`, `mth-switch`)
 * merged into `packages/ui/custom-elements.json` until Phase 1 components land in
 * `packages/ui/src/components/`.
 */
export const PHASE1_FALLBACK_MODULES = [
  {
    kind: 'javascript-module',
    path: 'src/components/button/mth-button.ts',
    declarations: [
      {
        kind: 'class',
        name: 'MthButton',
        tagName: 'mth-button',
        customElement: true,
        description: 'Action button with variant, size, and loading states.',
        members: [
          {
            kind: 'field',
            name: 'variant',
            attribute: 'variant',
            reflect: true,
            type: { text: "'solid' | 'outline' | 'ghost' | 'danger'" },
            default: "'solid'",
            description: 'Visual button emphasis.',
          },
          {
            kind: 'field',
            name: 'size',
            attribute: 'size',
            reflect: true,
            type: { text: "'sm' | 'md' | 'lg'" },
            default: "'md'",
            description: 'Control size token scale.',
          },
          {
            kind: 'field',
            name: 'disabled',
            attribute: 'disabled',
            reflect: true,
            type: { text: 'boolean' },
            default: 'false',
            description: 'Disables interaction.',
          },
          {
            kind: 'field',
            name: 'loading',
            attribute: 'loading',
            reflect: true,
            type: { text: 'boolean' },
            default: 'false',
            description: 'Shows loading spinner and suppresses duplicate clicks.',
          },
        ],
        attributes: [
          { name: 'variant', fieldName: 'variant', type: { text: "'solid' | 'outline' | 'ghost' | 'danger'" }, default: "'solid'" },
          { name: 'size', fieldName: 'size', type: { text: "'sm' | 'md' | 'lg'" }, default: "'md'" },
          { name: 'disabled', fieldName: 'disabled', type: { text: 'boolean' }, default: 'false' },
          { name: 'loading', fieldName: 'loading', type: { text: 'boolean' }, default: 'false' },
        ],
        events: [
          {
            name: 'mth-press',
            type: { text: 'CustomEvent<{ originalEvent: Event }>' },
            description: 'Fired when activated via pointer or keyboard.',
          },
        ],
        slots: [
          { name: '', description: 'Button label content.' },
          { name: 'prefix', description: 'Leading icon or indicator.' },
          { name: 'suffix', description: 'Trailing icon or badge.' },
        ],
        cssParts: [
          { name: 'base', description: 'Root button container.' },
          { name: 'control', description: 'Native internal button element.' },
        ],
        cssProperties: [{ name: '--mth-button-bg', description: 'Background color override.' }],
      },
    ],
  },
  {
    kind: 'javascript-module',
    path: 'src/components/checkbox/mth-checkbox.ts',
    declarations: [
      {
        kind: 'class',
        name: 'MthCheckbox',
        tagName: 'mth-checkbox',
        customElement: true,
        formAssociated: true,
        description: 'Tri-state form-associated checkbox control.',
        members: [
          {
            kind: 'field',
            name: 'checked',
            attribute: 'checked',
            reflect: true,
            type: { text: 'boolean' },
            default: 'false',
            description: 'Checked state.',
          },
          {
            kind: 'field',
            name: 'indeterminate',
            attribute: 'indeterminate',
            type: { text: 'boolean' },
            default: 'false',
            description: 'Mixed visual and ARIA state.',
          },
          {
            kind: 'field',
            name: 'value',
            attribute: 'value',
            type: { text: 'string' },
            default: "'on'",
            description: 'Submitted form value when checked.',
          },
          {
            kind: 'field',
            name: 'disabled',
            attribute: 'disabled',
            reflect: true,
            type: { text: 'boolean' },
            default: 'false',
            description: 'Disables checkbox interaction.',
          },
        ],
        attributes: [
          { name: 'checked', fieldName: 'checked', type: { text: 'boolean' }, default: 'false' },
          { name: 'indeterminate', fieldName: 'indeterminate', type: { text: 'boolean' }, default: 'false' },
          { name: 'value', fieldName: 'value', type: { text: 'string' }, default: "'on'" },
          { name: 'disabled', fieldName: 'disabled', type: { text: 'boolean' }, default: 'false' },
        ],
        events: [
          {
            name: 'mth-change',
            type: { text: 'CustomEvent<{ checked: boolean; indeterminate: boolean }>' },
            description: 'Emitted when checked state toggles.',
          },
        ],
        slots: [{ name: '', description: 'Checkbox label content.' }],
        cssParts: [
          { name: 'base', description: 'Wrapper label.' },
          { name: 'control', description: 'Checkbox indicator box.' },
        ],
      },
    ],
  },
  {
    kind: 'javascript-module',
    path: 'src/components/switch/mth-switch.ts',
    declarations: [
      {
        kind: 'class',
        name: 'MthSwitch',
        tagName: 'mth-switch',
        customElement: true,
        formAssociated: true,
        description: 'Accessible binary toggle switch.',
        members: [
          {
            kind: 'field',
            name: 'checked',
            attribute: 'checked',
            reflect: true,
            type: { text: 'boolean' },
            default: 'false',
            description: 'Toggle state.',
          },
          {
            kind: 'field',
            name: 'disabled',
            attribute: 'disabled',
            reflect: true,
            type: { text: 'boolean' },
            default: 'false',
            description: 'Disables the switch.',
          },
        ],
        attributes: [
          { name: 'checked', fieldName: 'checked', type: { text: 'boolean' }, default: 'false' },
          { name: 'disabled', fieldName: 'disabled', type: { text: 'boolean' }, default: 'false' },
        ],
        events: [
          {
            name: 'mth-change',
            type: { text: 'CustomEvent<{ checked: boolean }>' },
            description: 'Emitted on toggle.',
          },
        ],
        slots: [{ name: '', description: 'Switch label.' }],
        cssParts: [
          { name: 'base', description: 'Root container.' },
          { name: 'control', description: 'Switch track and thumb.' },
        ],
      },
    ],
  },
];
