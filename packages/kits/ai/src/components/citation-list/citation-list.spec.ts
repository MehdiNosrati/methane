import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { citationListMessages } from './citation-list.messages.js';

export const citationListSpec: ComponentBehaviorSpec = {
  tag: 'mth-citation-list',
  package: '@methane/ai',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'none',
  states: [],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'citation focused', expect: 'moves focus to next citation (RTL flipped)' },
    { key: 'ArrowLeft', dir: 'ltr', when: 'citation focused', expect: 'moves focus to previous citation (RTL flipped)' },
    { key: 'Home', when: 'citation focused', expect: 'moves focus to first citation' },
    { key: 'End', when: 'citation focused', expect: 'moves focus to last citation' },
  ],
  props: [
    { name: 'citations', attr: false, type: 'CitationItem[]' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    {
      name: 'orientation',
      attr: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: 'horizontal',
    },
    { name: 'selectedId', attr: 'selected-id', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ id: string; index: number; title: string; url: string }',
    },
  ],
  slots: [{ name: '', description: 'Optional trailing light-DOM citation elements.' }],
  parts: [
    { name: 'base', description: 'Root navigation list container.' },
    { name: 'citation-item', description: 'Individual numbered source chip or link.' },
  ],
  messages: { ...citationListMessages },
};

export const CEM_METADATA = {
  description:
    'Numbered AI source citation chips with strict `https:`/`http:` URL validation (ADR-012) and RTL-aware roving focus.',
  propDescriptions: {
    citations: 'Array of `{ id?, index?, title, url, snippet?, domain? }` citations.',
    label: 'Accessible region label for the citation list.',
    orientation: 'Layout and arrow navigation orientation (`horizontal` | `vertical`).',
    selectedId: 'Currently highlighted citation ID.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when a citation item is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Citation chip background color.' },
    { name: '--mth-color-border', description: 'Citation chip border color.' },
    { name: '--mth-radius-md', description: 'Citation chip border radius.' },
  ],
};
