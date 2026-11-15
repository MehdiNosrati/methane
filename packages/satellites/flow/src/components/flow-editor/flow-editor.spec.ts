import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { flowEditorMessages } from './flow-editor.messages.js';

export const flowEditorSpec: ComponentBehaviorSpec = {
  tag: 'mth-flow-editor',
  package: '@methane-ui/flow',
  conformance: ['satellite', 'roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['empty'],
  keyboard: [
    {
      key: 'ArrowRight',
      dir: 'ltr',
      when: 'Focus is on a node inside the flow editor',
      expect: 'Moves focus to the next node',
    },
    {
      key: 'ArrowLeft',
      dir: 'ltr',
      when: 'Focus is on a node after the first node',
      expect: 'Moves focus to the previous node',
    },
    {
      key: 'Enter',
      when: 'Focus is on a node',
      expect: 'Selects the node and emits mth-node-select',
    },
  ],
  props: [
    {
      name: 'nodes',
      attr: false,
      type: 'ReadonlyArray<FlowNode>',
    },
    {
      name: 'edges',
      attr: false,
      type: 'ReadonlyArray<FlowEdge>',
    },
    {
      name: 'direction',
      type: "'TB' | 'LR' | 'RL' | 'BT' | 'auto'",
      default: 'auto',
    },
    {
      name: 'edgeStyle',
      attr: 'edge-style',
      type: "'bezier' | 'orthogonal'",
      default: 'bezier',
    },
    {
      name: 'zoom',
      type: 'number',
      default: 1,
    },
    {
      name: 'panX',
      attr: 'pan-x',
      type: 'number',
      default: 0,
    },
    {
      name: 'panY',
      attr: 'pan-y',
      type: 'number',
      default: 0,
    },
    {
      name: 'selectedId',
      attr: 'selected-id',
      type: 'string',
      default: '',
    },
    {
      name: 'autoLayout',
      attr: 'auto-layout',
      type: 'boolean',
      default: true,
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
      name: 'mth-viewport-change',
      cancelable: false,
      detailType: '{ zoom: number; panX: number; panY: number }',
    },
    {
      name: 'mth-layout-complete',
      cancelable: false,
      detailType: '{ nodeCount: number; edgeCount: number }',
    },
  ],
  slots: [
    {
      name: 'fallback',
      description: 'Static SSR or accessible graph outline fallback content.',
    },
  ],
  parts: [
    {
      name: 'base',
      description: 'Outer flow editor container.',
    },
    {
      name: 'toolbar',
      description: 'Zoom, reset, and auto-layout toolbar.',
    },
    {
      name: 'canvas',
      description: 'Pan/zoom viewport surface.',
    },
    {
      name: 'edges',
      description: 'SVG edge layer.',
    },
    {
      name: 'node',
      description: 'Interactive flow node button.',
    },
  ],
  messages: { ...flowEditorMessages },
};

export const CEM_METADATA = {
  description: 'Accessible node/DAG flow editor wrapping @dagrejs/dagre with pan/zoom plane and keyboard node traversal.',
  propDescriptions: {
    nodes: 'Flow node definitions.',
    edges: 'Directed edges connecting source and target node IDs.',
    direction: 'DAG layout rank direction (auto resolves LR/RL from document direction).',
    edgeStyle: 'Connector routing geometry (bezier or orthogonal).',
    zoom: 'Viewport scale factor.',
    panX: 'Horizontal pan offset in pixels.',
    panY: 'Vertical pan offset in pixels.',
    selectedId: 'Currently selected node ID.',
    autoLayout: 'Runs Dagre DAG auto-layout automatically when nodes/edges update.',
    label: 'Accessible region label.',
  },
  eventDescriptions: {
    'mth-node-select': 'Fired when a flow node is selected.',
    'mth-viewport-change': 'Fired when pan or zoom changes.',
    'mth-layout-complete': 'Fired after Dagre layout computes coordinates.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Flow canvas background' },
    { name: '--mth-color-accent', description: 'Selected node and edge highlight color' },
    { name: '--mth-color-border', description: 'Node and edge border color' },
  ],
} as const;
