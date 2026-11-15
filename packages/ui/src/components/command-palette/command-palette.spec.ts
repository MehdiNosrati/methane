import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { commandPaletteMessages } from './command-palette.messages.js';

export interface CommandPaletteItem {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly shortcut?: string;
  readonly description?: string;
  readonly keywords?: ReadonlyArray<string>;
  readonly disabled?: boolean;
  readonly href?: string;
}

export const EMPTY_COMMAND_PALETTE_ITEMS: ReadonlyArray<CommandPaletteItem> = Object.freeze([]);

export const commandPaletteSpec: ComponentBehaviorSpec = {
  tag: 'mth-command-palette',
  package: '@methane/ui',
  conformance: ['overlay', 'listbox'],
  controllers: ['OverlayController', 'ListboxController', 'HotkeyController'],
  focusModel: 'delegates-focus',
  states: ['open', 'empty'],
  keyboard: [
    { key: 'ArrowDown', when: 'input focused', expect: 'activates next matching command' },
    { key: 'ArrowUp', when: 'input focused', expect: 'activates previous matching command' },
    { key: 'Enter', when: 'command active', expect: 'executes active command and closes dialog' },
    { key: 'Escape', when: 'open', expect: 'closes dialog and restores trigger focus' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'query', attr: 'query', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'shortcut', attr: 'shortcut', type: 'string', default: 'mod+k' },
    {
      name: 'registerGlobalShortcut',
      attr: 'register-global-shortcut',
      type: 'boolean',
      default: true,
    },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    {
      name: 'commands',
      attr: false,
      type: 'ReadonlyArray<CommandPaletteItem>',
      default: EMPTY_COMMAND_PALETTE_ITEMS,
    },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: 'void' },
    { name: 'mth-query-change', cancelable: false, detailType: '{ query: string }' },
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ id: string; label: string; href?: string }',
    },
  ],
  slots: [
    { name: 'header', description: 'Optional content rendered above the search input.' },
    { name: 'empty', description: 'Custom empty-state content when no commands match.' },
    { name: 'footer', description: 'Optional keyboard hints footer.' },
  ],
  parts: [
    { name: 'dialog', description: 'Top-layer modal `<dialog>` surface.' },
    { name: 'header', description: 'Search input header container.' },
    { name: 'input', description: 'Command filter `<input>` combobox element.' },
    { name: 'listbox', description: 'Filtered command `role="listbox"` container.' },
    { name: 'group-label', description: 'Command group heading.' },
    { name: 'option', description: 'Selectable `role="option"` command row.' },
    { name: 'shortcut', description: 'Optional keyboard shortcut hint badge.' },
    { name: 'empty', description: 'Empty results message container.' },
    { name: 'footer', description: 'Footer slot container.' },
  ],
  messages: { ...commandPaletteMessages },
};

export const CEM_METADATA = {
  description:
    'Modal command palette (`Cmd/Ctrl+K`) with keyword filtering, active-descendant listbox navigation, top-layer `<dialog>`, and global hotkey binding.',
  propDescriptions: {
    open: 'Controls whether the command palette dialog is visible.',
    query: 'Current search filter query string.',
    label: 'Accessible dialog label override.',
    placeholder: 'Search input placeholder override.',
    shortcut: 'Global hotkey combo used to toggle the command palette.',
    registerGlobalShortcut: 'Whether to bind the global hotkey listener on the document.',
    forceFallback: 'Forces fallback modal overlay rendering instead of native `<dialog>.showModal()`.',
    commands: 'Command entries available for filtering and selection.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event dispatched before the command palette opens.',
    'mth-close': 'Cancelable event dispatched before the command palette closes.',
    'mth-query-change': 'Dispatched when the command search input value changes.',
    'mth-select': 'Dispatched when a command option is chosen.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Dialog background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Hovered or active command background.' },
    { name: '--mth-color-fg', description: 'Primary foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Muted group heading and shortcut color.' },
    { name: '--mth-color-border', description: 'Border color.' },
    { name: '--mth-color-accent', description: 'Active focus outline color.' },
    { name: '--mth-color-backdrop', description: 'Modal dialog backdrop color.' },
    { name: '--mth-radius-lg', description: 'Dialog corner radius.' },
    { name: '--mth-radius-md', description: 'Option and shortcut badge corner radius.' },
    { name: '--mth-space-2', description: 'Compact spacing.' },
    { name: '--mth-space-3', description: 'Header and empty-state spacing.' },
    { name: '--mth-shadow-lg', description: 'Dialog elevation shadow.' },
    { name: '--mth-font-size-md', description: 'Input text size.' },
    { name: '--mth-font-size-sm', description: 'Option and heading text size.' },
    { name: '--mth-z-index-modal', description: 'Fallback modal z-index.' },
  ],
};
