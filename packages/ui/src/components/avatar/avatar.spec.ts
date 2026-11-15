import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { avatarMessages } from './avatar.messages.js';

export const avatarSpec: ComponentBehaviorSpec = {
  tag: 'mth-avatar',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['loaded', 'error'],
  keyboard: [],
  props: [
    { name: 'src', attr: 'src', type: 'string', default: '' },
    { name: 'alt', attr: 'alt', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    {
      name: 'size',
      attr: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: 'md',
    },
    {
      name: 'shape',
      attr: 'shape',
      type: "'circle' | 'square'",
      default: 'circle',
    },
    {
      name: 'status',
      attr: 'status',
      type: "'' | 'online' | 'busy' | 'away' | 'offline'",
      default: '',
    },
  ],
  events: [],
  slots: [
    { name: '', description: 'Optional custom avatar graphic overriding image/initials fallback.' },
  ],
  parts: [
    { name: 'base', description: 'Root avatar frame.' },
    { name: 'image', description: 'Rendered `<img>` element when `src` is valid.' },
    { name: 'initials', description: 'Computed initials fallback from `name`.' },
    { name: 'fallback', description: 'Default user silhouette SVG fallback.' },
    { name: 'status', description: 'Presence indicator dot.' },
  ],
  messages: { ...avatarMessages },
};

export const CEM_METADATA = {
  description:
    'User or entity avatar supporting image loading with error fallback to computed initials or default silhouette, shape presets, and presence status.',
  propDescriptions: {
    src: 'Image URL for the avatar.',
    alt: 'Alternative text describing the avatar image.',
    name: 'Full name used to compute initials fallback and accessible label.',
    size: 'Avatar dimension preset (`xs | sm | md | lg | xl`).',
    shape: 'Avatar frame geometry (`circle | square`).',
    status: 'Optional presence status indicator (`online | busy | away | offline`).',
  },
  cssProperties: [
    { name: '--mth-avatar-size', description: 'Override avatar inline and block size.' },
    { name: '--mth-color-bg-subtle', description: 'Fallback avatar background.' },
    { name: '--mth-color-fg', description: 'Initials foreground color.' },
    { name: '--mth-radius-md', description: 'Square shape corner radius.' },
    { name: '--mth-radius-full', description: 'Circle shape corner radius.' },
  ],
};
