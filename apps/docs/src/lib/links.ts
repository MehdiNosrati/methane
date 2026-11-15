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
      { label: 'Architecture', href: withBase('/architecture') },
      { label: 'Quickstart', href: withBase('/quickstart') },
      { label: 'ADRs (001–015)', href: withBase('/adrs') },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'SSR & Adapters', href: withBase('/guides/ssr') },
      { label: 'Theming & 4-Tier CSS', href: withBase('/guides/theming') },
      { label: 'Forms & Accessibility', href: withBase('/guides/forms-a11y') },
      { label: 'Security & Sanitize', href: withBase('/guides/security') },
    ],
  },
  {
    title: 'Catalogs & Tools',
    items: [
      { label: 'Design Tokens', href: withBase('/tokens') },
      { label: '23 CSS Primitives', href: withBase('/css') },
      { label: 'Component Reference', href: withBase('/components') },
      { label: 'OKLCH Theme Builder', href: withBase('/theme-builder') },
    ],
  },
];
