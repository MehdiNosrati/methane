import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { sessionListMessages } from './session-list.messages.js';

export const sessionListSpec: ComponentBehaviorSpec = {
  tag: 'mth-session-list',
  package: '@methane/auth',
  conformance: [],
  controllers: [],
  focusModel: 'host',
  states: ['disabled', 'loading'],
  keyboard: [],
  props: [
    { name: 'sessions', attr: false, type: 'ReadonlyArray<SessionListItem>' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'allowRevokeCurrent', attr: 'allow-revoke-current', type: 'boolean', default: false },
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-revoke',
      cancelable: false,
      detailType: '{ id: string; session: SessionListItem }',
    },
    {
      name: 'mth-revoke-others',
      cancelable: false,
      detailType: '{ count: number; sessionIds: ReadonlyArray<string> }',
    },
  ],
  slots: [{ name: 'default', description: 'Optional footer content.' }],
  parts: [
    { name: 'base', description: 'Outer session list section.' },
    { name: 'item', description: 'Individual session card.' },
    { name: 'revoke', description: 'Single session revoke button.' },
    { name: 'revoke-others', description: 'Bulk revoke other sessions button.' },
  ],
  messages: { ...sessionListMessages },
};

export const CEM_METADATA = {
  description:
    'Active authenticated session list displaying device metadata, current-session badge, and single/bulk revocation actions.',
  propDescriptions: {
    sessions: 'Active device sessions to display.',
    heading: 'Optional custom heading override.',
    allowRevokeCurrent: 'Allows revoking the current active session directly.',
    loading: 'Disables revocation buttons while an async revocation request is in flight.',
    disabled: 'Disables all interactive revocation buttons.',
  },
  eventDescriptions: {
    'mth-revoke': 'Emitted when a single session revoke button is clicked.',
    'mth-revoke-others': 'Emitted when bulk sign-out of non-current sessions is requested.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Session card surface background.' },
    { name: '--mth-color-danger', description: 'Revoke action accent color.' },
  ],
};
