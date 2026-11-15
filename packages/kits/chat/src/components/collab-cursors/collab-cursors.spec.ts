import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { collabCursorsMessages } from './collab-cursors.messages.js';

export const collabCursorsSpec: ComponentBehaviorSpec = {
  tag: 'mth-collab-cursors',
  package: '@methane/chat',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: [],
  keyboard: [],
  props: [
    { name: 'cursors', attr: false, type: 'ReadonlyArray<CollabCursor>' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [],
  parts: [
    { name: 'base', description: 'Overlay surface containing collaborator cursors and selections.' },
    { name: 'selection', description: 'Remote collaborator selection highlight rectangle.' },
    { name: 'cursor', description: 'Positioned remote collaborator cursor container.' },
    { name: 'pointer', description: 'Cursor pointer glyph.' },
    { name: 'name', description: 'Sanitized collaborator label pill.' },
  ],
  messages: { ...collabCursorsMessages },
};

export const CEM_METADATA = {
  description:
    'Multiplayer live cursor and selection overlay using CSP-safe adopted CSSStyleSheet rules with strict numeric and label sanitization.',
  propDescriptions: {
    cursors: 'Array of collaborator cursor positions, sanitized names, and optional selection boxes.',
    label: 'Accessible region label for the cursor overlay.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Default fallback cursor accent color.' },
    { name: '--mth-z-index-overlay', description: 'Overlay stacking context z-index.' },
  ],
};
