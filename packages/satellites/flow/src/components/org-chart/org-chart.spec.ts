import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { orgChartMessages } from './org-chart.messages.js';

export const orgChartSpec: ComponentBehaviorSpec = {
  tag: 'mth-org-chart',
  package: '@methane-ui/flow',
  conformance: ['satellite', 'roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['empty'],
  keyboard: [
    {
      key: 'ArrowRight',
      dir: 'ltr',
      when: 'Focus is on a member card',
      expect: 'Moves focus to the next visible member card',
    },
    {
      key: 'ArrowLeft',
      dir: 'ltr',
      when: 'Focus is on a member card after the first card',
      expect: 'Moves focus to the previous visible member card',
    },
    {
      key: 'Enter',
      when: 'Focus is on a member card',
      expect: 'Selects the member card and emits mth-node-select',
    },
  ],
  props: [
    {
      name: 'nodes',
      attr: false,
      type: 'ReadonlyArray<OrgChartNode>',
    },
    {
      name: 'direction',
      type: "'TB' | 'LR' | 'RL' | 'auto'",
      default: 'TB',
    },
    {
      name: 'query',
      type: 'string',
      default: '',
    },
    {
      name: 'selectedId',
      attr: 'selected-id',
      type: 'string',
      default: '',
    },
    {
      name: 'collapsedIds',
      attr: false,
      type: 'ReadonlyArray<string>',
    },
    {
      name: 'label',
      type: 'string',
      default: '',
    },
  ],
  events: [
    {
      name: 'mth-node-select',
      cancelable: false,
      detailType: '{ nodeId: string }',
    },
    {
      name: 'mth-node-toggle',
      cancelable: false,
      detailType: '{ nodeId: string; collapsed: boolean }',
    },
  ],
  slots: [
    {
      name: 'fallback',
      description: 'Static SSR or accessible org hierarchy fallback content.',
    },
  ],
  parts: [
    {
      name: 'base',
      description: 'Outer org chart region.',
    },
    {
      name: 'search',
      description: 'Member filter search input.',
    },
    {
      name: 'canvas',
      description: 'Dagre-positioned org hierarchy surface.',
    },
    {
      name: 'card',
      description: 'Individual organization member card.',
    },
  ],
  messages: { ...orgChartMessages },
};

export const CEM_METADATA = {
  description: 'Accessible hierarchical org-chart wrapping @dagrejs/dagre with subtree collapse/expand and member search.',
  propDescriptions: {
    nodes: 'Organization hierarchy nodes with parentId links or nested children.',
    direction: 'Chart layout direction (TB, LR, RL, or auto).',
    query: 'Case-insensitive search filter across member names, titles, and departments.',
    selectedId: 'Currently focused or selected member ID.',
    collapsedIds: 'IDs of collapsed manager nodes.',
    label: 'Accessible region label.',
  },
  eventDescriptions: {
    'mth-node-select': 'Fired when a member card is selected.',
    'mth-node-toggle': 'Fired when a branch node is expanded or collapsed.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Org chart surface background' },
    { name: '--mth-color-accent', description: 'Search match and selected card highlight color' },
  ],
} as const;
