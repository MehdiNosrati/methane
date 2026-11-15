export const BASE_PATH = '/methane';

export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') return `${BASE_PATH}/`;
  return `${BASE_PATH}${normalized}`;
}

export interface NavSection {
  readonly title: string;
  readonly items: ReadonlyArray<{ readonly label: string; readonly href: string }>;
}

export const DOCS_NAV: ReadonlyArray<NavSection> = [
  {
    title: 'Overview',
    items: [
      { label: 'Introduction', href: withBase('/') },
      { label: 'Quickstart', href: withBase('/quickstart') },
      { label: 'Architecture', href: withBase('/architecture') },
      { label: 'Design Decisions', href: withBase('/adrs') },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Agent Skills', href: withBase('/guides/skills') },
      { label: 'Server Rendering', href: withBase('/guides/ssr') },
      { label: 'Theming & Tokens', href: withBase('/guides/theming') },
      { label: 'Forms & Accessibility', href: withBase('/guides/forms-a11y') },
      { label: 'Security', href: withBase('/guides/security') },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'Components', href: withBase('/components') },
      { label: 'CSS Layouts', href: withBase('/css') },
      { label: 'Design Tokens', href: withBase('/tokens') },
      { label: 'Theme Builder', href: withBase('/theme-builder') },
    ],
  },
];
