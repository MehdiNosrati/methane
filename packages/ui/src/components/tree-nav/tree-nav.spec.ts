import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { treeNavMessages } from './tree-nav.messages.js';

export interface TreeNavItem {
  readonly value: string;
  readonly label: string;
  readonly href?: string;
  readonly badge?: string;
  readonly disabled?: boolean;
  readonly children?: ReadonlyArray<TreeNavItem>;
}

export const EMPTY_TREE_NAV_ITEMS: ReadonlyArray<TreeNavItem> = Object.freeze([]);
export const EMPTY_TREE_EXPANDED: ReadonlyArray<string> = Object.freeze([]);

export const treeNavSpec: ComponentBehaviorSpec = {
  tag: 'mth-tree-nav',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: [],
  keyboard: [
    { key: 'ArrowDown', when: 'treeitem focused', expect: 'moves focus to next visible enabled treeitem' },
    { key: 'ArrowUp', when: 'treeitem focused', expect: 'moves focus to previous visible enabled treeitem' },
    { key: 'ArrowRight', dir: 'ltr', when: 'branch treeitem focused', expect: 'expands collapsed branch or enters first child' },
    { key: 'ArrowLeft', dir: 'ltr', when: 'branch or child treeitem focused', expect: 'collapses expanded branch or focuses parent' },
    { key: 'Home', when: 'treeitem focused', expect: 'moves focus to first visible enabled treeitem' },
    { key: 'End', when: 'treeitem focused', expect: 'moves focus to last visible enabled treeitem' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'activeValue', attr: 'active-value', type: 'string', default: '' },
    { name: 'activeHref', attr: 'active-href', type: 'string', default: '' },
    {
      name: 'expandedValues',
      attr: false,
      type: 'ReadonlyArray<string>',
      default: EMPTY_TREE_EXPANDED,
    },
    {
      name: 'items',
      attr: false,
      type: 'ReadonlyArray<TreeNavItem>',
      default: EMPTY_TREE_NAV_ITEMS,
    },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ value: string; label: string; href?: string }',
    },
    {
      name: 'mth-toggle',
      cancelable: false,
      detailType: '{ value: string; expanded: boolean }',
    },
  ],
  slots: [{ name: 'header', description: 'Optional heading above the tree.' }],
  parts: [
    { name: 'nav', description: 'Semantic `<nav>` landmark.' },
    { name: 'tree', description: 'Root `role="tree"` list.' },
    { name: 'group', description: 'Nested `role="group"` branch list.' },
    { name: 'item', description: 'Interactive `role="treeitem"` link or button.' },
    { name: 'chevron', description: 'Expand/collapse indicator.' },
    { name: 'badge', description: 'Optional trailing item badge.' },
  ],
  messages: { ...treeNavMessages },
};

export const CEM_METADATA = {
  description:
    'Hierarchical collapsible navigation tree with WAI-ARIA `tree`/`treeitem` keyboard navigation, LTR/RTL branch expand/collapse, roving focus, and safe URL validation.',
  propDescriptions: {
    label: 'Accessible label for the `<nav>` landmark and tree.',
    activeValue: 'Value of the currently active node marked `aria-current="page"`.',
    activeHref: 'Href of the currently active node marked `aria-current="page"`.',
    expandedValues: 'Values of currently expanded branch nodes.',
    items: 'Nested tree structure of navigation nodes.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when a tree navigation node is activated.',
    'mth-toggle': 'Fired when a branch node expands or collapses.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Tree container background.' },
    { name: '--mth-color-fg', description: 'Primary item text color.' },
    { name: '--mth-color-fg-muted', description: 'Chevron and subtle text color.' },
    { name: '--mth-color-accent-subtle', description: 'Active node background fill.' },
    { name: '--mth-color-accent', description: 'Active node highlight and focus outline color.' },
    { name: '--mth-radius-md', description: 'Node item corner radius.' },
    { name: '--mth-font-size-sm', description: 'Item font size.' },
  ],
};
