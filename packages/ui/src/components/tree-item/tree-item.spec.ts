import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const treeItemSpec: ComponentBehaviorSpec = {
  tag: 'mth-tree-item',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'host',
  role: 'treeitem',
  states: ['expanded', 'selected', 'disabled', 'branch'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'expanded', attr: 'expanded', type: 'boolean', default: false },
    { name: 'selected', attr: 'selected', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'lazy', attr: 'lazy', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-toggle',
      cancelable: false,
      detailType: '{ value: string; expanded: boolean }',
    },
  ],
  slots: [
    { name: 'icon', description: 'Optional leading node icon.' },
    { name: 'label', description: 'Explicit node label slot.' },
    { name: 'suffix', description: 'Optional trailing count, badge, or action.' },
    { name: '', description: 'Nested child `<mth-tree-item>` elements or inline label text.' },
  ],
  parts: [
    { name: 'base', description: 'Outer treeitem container.' },
    { name: 'row', description: 'Interactive node row.' },
    { name: 'toggle', description: 'Expand/collapse disclosure chevron.' },
    { name: 'icon', description: 'Icon slot wrapper.' },
    { name: 'label', description: 'Node label wrapper.' },
    { name: 'suffix', description: 'Trailing slot wrapper.' },
    { name: 'children', description: 'Child `role="group"` subtree container.' },
  ],
  messages: {
    toggleBranch: 'Toggle {label}',
    loadingChildren: 'Loading…',
  },
};

export const CEM_METADATA = {
  description: 'Hierarchical treeview node (`role="treeitem"`) supporting nested `<mth-tree-item>` subtrees, expand/collapse disclosure, and selection states.',
  propDescriptions: {
    value: 'Unique node value identifier.',
    label: 'Node display text when `label` slot is not provided.',
    expanded: 'Whether child `<mth-tree-item>` nodes are expanded and visible.',
    selected: 'Marks the node as selected.',
    disabled: 'Disables selection and roving focus.',
    lazy: 'Marks the leaf as expandable for asynchronous lazy child loading.',
  },
  eventDescriptions: {
    'mth-toggle': 'Emitted when the branch disclosure toggle is clicked.',
  },
  cssProperties: [
    { name: '--mth-color-accent-subtle', description: 'Selected node row background.' },
    { name: '--mth-color-border-focus', description: 'Focused node outline ring color.' },
  ],
};
