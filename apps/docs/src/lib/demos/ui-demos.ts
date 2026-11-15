import type { DemoNode, DemoSetupContext, DemoSpec } from './types.js';

type EventTargetElement = HTMLElement & Record<string, unknown>;

const METHANE_PACKAGES: ReadonlyArray<{
  readonly id: string;
  readonly value: string;
  readonly label: string;
  readonly category: string;
}> = [
  { id: 'pkg-core', value: '@methane-ui/core', label: '@methane-ui/core — Lit base & runtime', category: 'Foundation' },
  { id: 'pkg-tokens', value: '@methane-ui/tokens', label: '@methane-ui/tokens — OKLCH DTCG tokens', category: 'Foundation' },
  { id: 'pkg-css', value: '@methane-ui/css', label: '@methane-ui/css — Logical CSS primitives', category: 'Foundation' },
  { id: 'pkg-primitives', value: '@methane-ui/primitives', label: '@methane-ui/primitives — Behavior controllers', category: 'Primitives' },
  { id: 'pkg-ui', value: '@methane-ui/ui', label: '@methane-ui/ui — 167 core Web Components', category: 'Components' },
  { id: 'pkg-ssr', value: '@methane-ui/ssr', label: '@methane-ui/ssr — DSD server renderer', category: 'SSR' },
  { id: 'pkg-react', value: '@methane-ui/react', label: '@methane-ui/react — React 19 wrappers', category: 'Frameworks' },
  { id: 'pkg-vue', value: '@methane-ui/vue', label: '@methane-ui/vue — Vue 3 wrappers', category: 'Frameworks' },
  { id: 'pkg-svelte', value: '@methane-ui/svelte', label: '@methane-ui/svelte — Svelte 5 wrappers', category: 'Frameworks' },
  { id: 'pkg-angular', value: '@methane-ui/angular', label: '@methane-ui/angular — Angular standalone wrappers', category: 'Frameworks' },
];

const FRAMEWORK_SELECT_OPTIONS: ReadonlyArray<{
  readonly value: string;
  readonly label: string;
  readonly group: string;
}> = [
  { value: 'astro', label: 'Astro SSR (DSD)', group: 'Meta-Frameworks' },
  { value: 'next', label: 'Next.js 15 RSC', group: 'Meta-Frameworks' },
  { value: 'nuxt', label: 'Nuxt 3 Nitro', group: 'Meta-Frameworks' },
  { value: 'sveltekit', label: 'SvelteKit 2', group: 'Meta-Frameworks' },
  { value: 'react', label: 'React 19 Wrapper', group: 'Client Wrappers' },
  { value: 'vue', label: 'Vue 3 Wrapper', group: 'Client Wrappers' },
  { value: 'angular', label: 'Angular 19 Standalone', group: 'Client Wrappers' },
  { value: 'svelte', label: 'Svelte 5 Runes', group: 'Client Wrappers' },
];

const STANDARD_EVENTS: ReadonlyArray<string> = [
  'mth-input',
  'mth-change',
  'mth-select',
  'mth-press',
  'mth-toggle',
  'mth-open',
  'mth-after-open',
  'mth-close',
  'mth-after-close',
  'mth-clear',
  'mth-search',
  'mth-dismiss',
  'mth-remove',
  'mth-copy',
  'mth-share',
  'mth-confirm',
  'mth-cancel',
  'mth-complete',
  'mth-reorder',
  'mth-resize',
  'mth-layout',
  'mth-sort',
  'mth-selection-change',
  'mth-row-click',
  'mth-expand',
  'mth-collapse',
  'mth-collapse-change',
  'mth-navigate',
  'mth-step-change',
  'mth-create',
  'mth-mention-select',
  'mth-query-change',
  'mth-select-plan',
  'mth-condition-change',
  'mth-consent',
  'mth-tick',
  'mth-detent-change',
  'mth-focus-date',
  'mth-focus-field',
  'mth-reveal-change',
  'mth-country-change',
  'mth-range-change',
  'mth-active-change',
  'mth-scroll-top',
  'mth-start',
  'mth-pause',
  'mth-resume',
  'mth-retry',
  'mth-lap',
  'mth-reset',
  'mth-submit',
  'mth-invalid',
  'mth-add',
  'mth-crop',
  'mth-load-more',
  'mth-edit-start',
  'mth-action',
  'mth-tag-add',
  'mth-tag-remove',
  'mth-lightbox-open',
  'mth-lightbox-close',
  'mth-status-change',
  'mth-verify',
  'mth-expire',
  'mth-error',
  'mth-drop',
  'mth-reject',
];

function wireReadoutEvents(
  el: HTMLElement,
  tag: string,
  setReadout: (msg: string) => void,
  events: ReadonlyArray<string> = STANDARD_EVENTS,
): void {
  for (const evName of events) {
    el.addEventListener(evName, (ev) => {
      const detail = (ev as CustomEvent<unknown>).detail;
      const suffix = detail !== undefined ? `: ${JSON.stringify(detail)}` : '';
      setReadout(`<${tag}> ${evName}${suffix}`);
    });
  }
}

function wireValueControlSync(
  el: HTMLElement,
  tag: string,
  ctx: DemoSetupContext,
  attr = 'value',
): void {
  el.addEventListener('mth-change', (ev) => {
    const detail = (ev as CustomEvent<Record<string, unknown> | undefined>).detail;
    const rawVal = detail?.[attr] ?? detail?.['value'];
    if (typeof rawVal === 'string' || typeof rawVal === 'boolean') {
      ctx.syncControlValue(attr, rawVal);
    } else if (typeof rawVal === 'number') {
      ctx.syncControlValue(attr, String(rawVal));
    }
    ctx.setReadout(`<${tag}> mth-change: ${JSON.stringify(detail ?? {})}`);
  });
}

function defaultSetup(tag: string): (ctx: DemoSetupContext) => void {
  return (ctx) => {
    wireReadoutEvents(ctx.target, tag, ctx.setReadout);
  };
}

function buildHeatmapValues(): ReadonlyArray<{ readonly date: string; readonly count: number }> {
  const entries: Array<{ date: string; count: number }> = [];
  const base = new Date('2026-11-15T00:00:00Z');
  for (let i = 0; i < 84; i += 1) {
    const d = new Date(base.getTime() - i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const count = (i * 7 + 3) % 11;
    entries.push({ date: iso, count });
  }
  return entries;
}

function buildSvgDataUri(title: string, accent: string, bg: string): string {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">',
    `<rect width="640" height="360" rx="16" fill="${bg}"/>`,
    `<circle cx="140" cy="140" r="88" fill="${accent}" fill-opacity="0.28"/>`,
    `<circle cx="480" cy="220" r="110" fill="${accent}" fill-opacity="0.18"/>`,
    `<rect x="64" y="256" width="240" height="16" rx="8" fill="${accent}" fill-opacity="0.6"/>`,
    `<text x="64" y="190" fill="#ffffff" font-family="system-ui,sans-serif" font-size="32" font-weight="700">${title}</text>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildSvgBlobUrl(title: string, accent: string, bg: string): string {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">',
    `<rect width="800" height="500" rx="20" fill="${bg}"/>`,
    `<circle cx="220" cy="190" r="110" fill="${accent}" fill-opacity="0.32"/>`,
    `<circle cx="590" cy="310" r="135" fill="${accent}" fill-opacity="0.22"/>`,
    `<text x="80" y="260" fill="#ffffff" font-family="system-ui,sans-serif" font-size="40" font-weight="700">${title}</text>`,
    '</svg>',
  ].join('');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

function createTriggerOverlaySetup(
  tag: string,
  triggerSelector: string,
  openFn?: (target: EventTargetElement, trigger: HTMLElement) => void | Promise<void>,
): (ctx: DemoSetupContext) => void {
  return (ctx) => {
    wireReadoutEvents(ctx.target, tag, ctx.setReadout);
    const trigger = ctx.canvas.querySelector<HTMLElement>(triggerSelector);
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const targetEl = ctx.target as EventTargetElement;
      if (openFn) {
        void openFn(targetEl, trigger);
        return;
      }
      const show = targetEl['show'];
      if (typeof show === 'function') {
        void (show as (t?: HTMLElement) => Promise<boolean>).call(targetEl, trigger);
      } else {
        targetEl.setAttribute('open', '');
      }
    });
  };
}

function buildAccordionChildren(): ReadonlyArray<DemoNode> {
  return [
    {
      tag: 'mth-accordion-item',
      attrs: { value: 'tokens', heading: 'Adaptive OKLCH Tokens', expanded: true },
      text: 'Compiled from W3C DTCG JSON into light-dark() and forced-colors rules.',
    },
    {
      tag: 'mth-accordion-item',
      attrs: { value: 'ssr', heading: 'Declarative Shadow DOM SSR' },
      text: 'Streams zero-FOUC SSR templates across Astro, Next, Nuxt, SvelteKit, and Angular.',
    },
    {
      tag: 'mth-accordion-item',
      attrs: { value: 'a11y', heading: 'Same-Root ARIA & Roving Focus' },
      text: 'Built-in keyboard navigation and screen-reader semantics with zero config.',
    },
  ];
}

function buildTabNodes(): ReadonlyArray<DemoNode> {
  return [
    { tag: 'mth-tab', attrs: { slot: 'tab', value: 'overview' }, text: 'Overview' },
    { tag: 'mth-tab', attrs: { slot: 'tab', value: 'tokens' }, text: 'Tokens' },
    { tag: 'mth-tab', attrs: { slot: 'tab', value: 'a11y' }, text: 'Accessibility' },
    {
      tag: 'mth-tab-panel',
      attrs: { value: 'overview' },
      text: 'Spec-first Web Components with progressive enhancement and native top-layer overlays.',
    },
    {
      tag: 'mth-tab-panel',
      attrs: { value: 'tokens' },
      text: 'Precision Atmospheric OKLCH ramps with automatic light, dark, and high-contrast modes.',
    },
    {
      tag: 'mth-tab-panel',
      attrs: { value: 'a11y' },
      text: 'Same-root ARIA relationships, roving tabindex, and logical CSS direction flipping.',
    },
  ];
}

function buildOptionChildren(): ReadonlyArray<DemoNode> {
  return [
    { tag: 'mth-option', attrs: { value: 'astro', label: 'Astro SSR (DSD)' }, text: 'Astro SSR (DSD)' },
    { tag: 'mth-option', attrs: { value: 'next', label: 'Next.js 15 RSC' }, text: 'Next.js 15 RSC' },
    { tag: 'mth-option', attrs: { value: 'nuxt', label: 'Nuxt 3 Nitro' }, text: 'Nuxt 3 Nitro' },
    { tag: 'mth-option', attrs: { value: 'sveltekit', label: 'SvelteKit 2' }, text: 'SvelteKit 2' },
    { tag: 'mth-option', attrs: { value: 'angular', label: 'Angular 19' }, text: 'Angular 19' },
  ];
}

function buildTableColumns(): ReadonlyArray<DemoNode> {
  return [
    { tag: 'mth-column', attrs: { field: 'pkg', header: 'Package', sortable: true } },
    { tag: 'mth-column', attrs: { field: 'layer', header: 'Layer', sortable: true } },
    { tag: 'mth-column', attrs: { field: 'size', header: 'Budget', align: 'end' } },
  ];
}

const TABLE_ROWS: ReadonlyArray<Record<string, unknown>> = [
  { id: '1', pkg: '@methane-ui/tokens', layer: 'Foundation', size: '1.8 KB' },
  { id: '2', pkg: '@methane-ui/css', layer: 'Primitives', size: '3.1 KB' },
  { id: '3', pkg: '@methane-ui/primitives', layer: 'Controllers', size: '4.6 KB' },
  { id: '4', pkg: '@methane-ui/ui', layer: 'Components', size: '8.4 KB' },
];

export const UI_DEMO_SPECS: Readonly<Record<string, DemoSpec>> = {
  'mth-accordion': {
    attrs: { multiple: true, collapsible: true },
    style: 'inline-size:min(100%,30rem)',
    children: buildAccordionChildren(),
    setup: defaultSetup('mth-accordion'),
  },

  'mth-accordion-item': {
    tree: {
      tag: 'mth-accordion',
      attrs: { multiple: true, collapsible: true, style: 'inline-size:min(100%,30rem)' },
      children: [
        {
          tag: 'mth-accordion-item',
          attrs: {
            'data-preview-target': true,
            value: 'tokens',
            heading: 'Adaptive OKLCH Tokens (Target)',
            expanded: true,
          },
          text: 'Compiled from W3C DTCG JSON into light-dark() and forced-colors rules.',
        },
        {
          tag: 'mth-accordion-item',
          attrs: { value: 'ssr', heading: 'Declarative Shadow DOM SSR' },
          text: 'Streams zero-FOUC SSR templates across Astro, Next, Nuxt, SvelteKit, and Angular.',
        },
      ],
    },
    setup: defaultSetup('mth-accordion-item'),
  },

  'mth-activity-feed': {
    attrs: { label: 'Workspace release stream', 'relative-time': true },
    style: 'inline-size:min(100%,32rem)',
    props: {
      items: [
        {
          id: 'act-1',
          title: 'Published @methane-ui/ui@0.1.0',
          actor: 'release-bot',
          description: 'Sigstore provenance verified across 35 public packages.',
          timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
        },
        {
          id: 'act-2',
          title: 'Updated OKLCH surface tokens',
          actor: 'design-systems',
          description: 'Adjusted dark-mode contrast for high-contrast media queries.',
          timestamp: new Date(Date.now() - 95 * 60_000).toISOString(),
        },
        {
          id: 'act-3',
          title: 'Completed WebKit E2E matrix',
          actor: 'ci-runner',
          description: '121 conformance & hydration assertions passed.',
          timestamp: new Date(Date.now() - 4 * 3_600_000).toISOString(),
        },
      ],
    },
    setup: defaultSetup('mth-activity-feed'),
  },

  'mth-address-input': {
    attrs: {
      name: 'shipping-address',
      label: 'Headquarters address',
      'include-line2': true,
      hint: 'Structured postal address with optional apartment/suite line',
    },
    style: 'inline-size:min(100%,28rem)',
    setup: defaultSetup('mth-address-input'),
  },

  'mth-alert': {
    attrs: {
      variant: 'info',
      title: 'Precision Atmospheric Tokens',
      closable: true,
      open: true,
    },
    style: 'inline-size:min(100%,30rem)',
    text: 'Automatically adapts to light, dark, density, and forced-colors preferences.',
    setup: defaultSetup('mth-alert'),
  },

  'mth-async-search': {
    attrs: {
      name: 'package-search',
      label: 'Search Methane packages',
      placeholder: 'Type e.g. ssr, tokens, react...',
      hint: 'Backed by async DataSource with abortable debounced queries',
      'debounce-ms': 80,
    },
    style: 'inline-size:min(100%,28rem)',
    props: {
      options: METHANE_PACKAGES,
      dataSource: {
        async query(request: { filter?: string; signal: AbortSignal }) {
          await new Promise<void>((resolve) => setTimeout(resolve, 25));
          if (request.signal.aborted) {
            return { items: [], total: 0 };
          }
          const q = (request.filter ?? '').trim().toLowerCase();
          const filtered = q
            ? METHANE_PACKAGES.filter(
                (item) =>
                  item.label.toLowerCase().includes(q) ||
                  item.value.toLowerCase().includes(q) ||
                  item.category.toLowerCase().includes(q),
              )
            : METHANE_PACKAGES;
          return { items: filtered, total: filtered.length };
        },
      },
    },
    setup: (ctx) => {
      wireReadoutEvents(ctx.target, 'mth-async-search', ctx.setReadout);
      const searchEl = ctx.target as EventTargetElement & {
        query?: (text: string) => Promise<void>;
      };
      void searchEl.query?.('');
    },
  },

  'mth-audio-player': {
    attrs: {
      title: 'Precision Atmospheric Synth',
      artist: 'Methane Audio Lab',
      label: 'Release walkthrough audio',
      'playback-rate': 1,
    },
    style: 'inline-size:min(100%,30rem)',
    setup: defaultSetup('mth-audio-player'),
  },

  'mth-avatar': {
    attrs: {
      name: 'Methane Studio',
      size: 'lg',
      status: 'online',
      shape: 'circle',
    },
  },

  'mth-avatar-group': {
    attrs: { max: 3, size: 'md', label: 'Active contributors' },
    children: [
      { tag: 'mth-avatar', attrs: { name: 'Ada Lovelace', status: 'online' } },
      { tag: 'mth-avatar', attrs: { name: 'Grace Hopper', status: 'busy' } },
      { tag: 'mth-avatar', attrs: { name: 'Alan Turing', status: 'away' } },
      { tag: 'mth-avatar', attrs: { name: 'Margaret Hamilton' } },
      { tag: 'mth-avatar', attrs: { name: 'Linus Torvalds' } },
    ],
  },

  'mth-back-to-top': {
    attrs: {
      'always-visible': true,
      visible: true,
      label: 'Back to top',
    },
    style: 'position:static;inset:auto',
    setup: (ctx) => {
      wireReadoutEvents(ctx.target, 'mth-back-to-top', ctx.setReadout, ['mth-scroll-top']);
    },
  },

  'mth-badge': {
    attrs: { variant: 'accent', pill: true },
    text: 'v0.1.0 Ready',
  },

  'mth-banner': {
    attrs: {
      variant: 'info',
      heading: 'Methane 0.1.0 is published on npm with Sigstore provenance',
      dismissible: true,
    },
    style: 'inline-size:min(100%,34rem)',
    children: [
      'Upgrade with pnpm add @methane-ui/ui@latest.',
      {
        tag: 'mth-button',
        attrs: { slot: 'actions', variant: 'outline', size: 'sm' },
        text: 'Release Notes',
      },
    ],
    setup: defaultSetup('mth-banner'),
  },

  'mth-barcode': {
    attrs: {
      value: 'MTH-2026-0194',
      label: 'Asset barcode MTH-2026-0194',
      height: 64,
      'show-value': true,
    },
  },

  'mth-before-after': {
    attrs: {
      position: 52,
      label: 'Theme comparison slider',
      'before-label': 'Light Tokens',
      'after-label': 'Dark Tokens',
    },
    style: 'inline-size:min(100%,28rem);min-block-size:11rem',
    children: [
      {
        tag: 'div',
        attrs: {
          slot: 'before',
          style:
            'display:grid;place-items:center;inline-size:100%;block-size:11rem;background:oklch(0.96 0.01 250);color:oklch(0.22 0.02 250);font-weight:600',
        },
        text: 'Light Surface · OKLCH 0.96',
      },
      {
        tag: 'div',
        attrs: {
          slot: 'after',
          style:
            'display:grid;place-items:center;inline-size:100%;block-size:11rem;background:oklch(0.2 0.03 255);color:oklch(0.94 0.01 250);font-weight:600',
        },
        text: 'Dark Surface · OKLCH 0.20',
      },
    ],
    setup: defaultSetup('mth-before-after'),
  },

  'mth-bottom-nav': {
    attrs: {
      label: 'Mobile workspace navigation',
      'active-value': 'components',
    },
    style: 'inline-size:min(100%,30rem)',
    props: {
      fixed: false,
      items: [
        { value: 'overview', label: 'Overview' },
        { value: 'components', label: 'Components', badge: '167' },
        { value: 'tokens', label: 'Tokens' },
        { value: 'settings', label: 'Settings' },
      ],
    },
    setup: defaultSetup('mth-bottom-nav'),
  },

  'mth-bottom-sheet': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'solid', 'data-demo-open': true },
          text: 'Open Bottom Sheet',
        },
        {
          tag: 'mth-bottom-sheet',
          attrs: {
            'data-preview-target': true,
            label: 'Deployment Target',
            detent: 'half',
            closable: true,
          },
          children: [
            { tag: 'strong', attrs: { slot: 'header' }, text: 'Select Deployment Region' },
            {
              tag: 'p',
              attrs: { style: 'margin-block:0' },
              text: 'Supports half, full, and collapsed detents with swipe & Escape dismissal.',
            },
            {
              tag: 'mth-button',
              attrs: { slot: 'footer', variant: 'outline', size: 'sm', 'data-sheet-close': true },
              text: 'Done',
            },
          ],
        },
      ],
    },
    setup: (ctx) => {
      createTriggerOverlaySetup('mth-bottom-sheet', '[data-demo-open]')(ctx);
      const closeBtn = ctx.canvas.querySelector<HTMLElement>('[data-sheet-close]');
      closeBtn?.addEventListener('click', () => {
        const sheet = ctx.target as EventTargetElement & { hide?: () => Promise<boolean> };
        void sheet.hide?.();
      });
    },
  },

  'mth-breadcrumb-item': {
    tree: {
      tag: 'mth-breadcrumbs',
      attrs: { label: 'Documentation path' },
      children: [
        { tag: 'mth-breadcrumb-item', attrs: { href: '#home' }, text: 'Home' },
        {
          tag: 'mth-breadcrumb-item',
          attrs: { 'data-preview-target': true, href: '#components' },
          text: 'Components (Target)',
        },
        { tag: 'mth-breadcrumb-item', attrs: { current: true }, text: 'Breadcrumb Item' },
      ],
    },
  },

  'mth-breadcrumb-path': {
    attrs: { label: 'Repository file path', 'max-items': 4 },
    style: 'inline-size:min(100%,30rem)',
    props: {
      items: [
        { label: 'methane', href: '#root', value: 'root' },
        { label: 'packages', href: '#packages', value: 'packages' },
        { label: 'ui', href: '#ui', value: 'ui' },
        { label: 'src', href: '#src', value: 'src' },
        { label: 'components', href: '#components', value: 'components' },
        { label: 'breadcrumb-path.ts', current: true, value: 'file' },
      ],
    },
    setup: defaultSetup('mth-breadcrumb-path'),
  },

  'mth-breadcrumbs': {
    attrs: { label: 'Documentation path' },
    children: [
      { tag: 'mth-breadcrumb-item', attrs: { href: '#home' }, text: 'Home' },
      { tag: 'mth-breadcrumb-item', attrs: { href: '#components' }, text: 'Components' },
      { tag: 'mth-breadcrumb-item', attrs: { current: true }, text: 'Breadcrumbs' },
    ],
  },

  'mth-button': {
    attrs: { variant: 'solid', size: 'md' },
    text: 'Continue Action',
    setup: defaultSetup('mth-button'),
  },

  'mth-button-group': {
    attrs: { attached: true, label: 'Text alignment', 'role-mode': 'toolbar' },
    children: [
      { tag: 'mth-button', attrs: { variant: 'outline', size: 'sm' }, text: 'Start' },
      { tag: 'mth-button', attrs: { variant: 'outline', size: 'sm' }, text: 'Center' },
      { tag: 'mth-button', attrs: { variant: 'outline', size: 'sm' }, text: 'End' },
    ],
    setup: defaultSetup('mth-button-group'),
  },

  'mth-calendar': {
    attrs: { value: '2026-11-15', locale: 'en-US' },
    style: 'inline-size:min(100%,22rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-calendar', ctx),
  },

  'mth-calendar-heatmap': {
    attrs: {
      label: 'Commit activity',
      weeks: 12,
      'end-date': '2026-11-15',
      'selected-date': '2026-11-15',
    },
    style: 'inline-size:min(100%,30rem)',
    props: { values: buildHeatmapValues() },
    setup: defaultSetup('mth-calendar-heatmap'),
  },

  'mth-callout': {
    attrs: {
      variant: 'tip',
      heading: 'Declarative Shadow DOM Ready',
      collapsible: true,
      open: true,
    },
    style: 'inline-size:min(100%,32rem)',
    text: 'All Methane components stream server-rendered shadow roots before client hydration.',
    setup: defaultSetup('mth-callout'),
  },

  'mth-captcha-slot': {
    attrs: {
      name: 'human-verification',
      label: 'Security challenge',
      hint: 'Provider-agnostic Light-DOM slot bridged to FormData validity',
      provider: 'turnstile',
    },
    style: 'inline-size:min(100%,26rem)',
    children: [
      {
        tag: 'mth-button',
        attrs: { slot: 'fallback', variant: 'outline', size: 'sm', 'data-captcha-verify': true },
        text: 'Simulate Verification Token',
      },
    ],
    setup: (ctx) => {
      wireReadoutEvents(ctx.target, 'mth-captcha-slot', ctx.setReadout);
      const btn = ctx.canvas.querySelector<HTMLElement>('[data-captcha-verify]');
      btn?.addEventListener('click', () => {
        const slotEl = ctx.target as EventTargetElement & {
          setToken?: (token: string) => void;
          value?: string;
        };
        if (typeof slotEl.setToken === 'function') {
          slotEl.setToken('verified-demo-token');
        } else {
          slotEl.value = 'verified-demo-token';
          slotEl.dispatchEvent(
            new CustomEvent('mth-verify', {
              bubbles: true,
              composed: true,
              detail: { token: 'verified-demo-token' },
            }),
          );
        }
      });
    },
  },

  'mth-card': {
    attrs: { variant: 'elevated' },
    style: 'inline-size:min(100%,24rem)',
    children: [
      { tag: 'strong', attrs: { slot: 'header' }, text: 'Precision Studio Surface' },
      {
        tag: 'p',
        attrs: { style: 'margin-block:0' },
        text: 'Layered key-light and ambient elevation with crisp OKLCH border contrast.',
      },
      {
        tag: 'mth-flex',
        attrs: { slot: 'footer', 'data-gap': '2', 'data-justify': 'end' },
        children: [
          { tag: 'mth-button', attrs: { variant: 'ghost', size: 'sm' }, text: 'Cancel' },
          { tag: 'mth-button', attrs: { variant: 'solid', size: 'sm' }, text: 'Deploy' },
        ],
      },
    ],
  },

  'mth-carousel': {
    attrs: {
      label: 'Architecture highlights',
      'show-controls': true,
      'show-indicators': true,
      loop: true,
    },
    style: 'inline-size:min(100%,30rem)',
    children: [
      {
        tag: 'mth-carousel-item',
        attrs: { label: 'OKLCH Tokens' },
        children: [
          {
            tag: 'mth-card',
            attrs: { variant: 'subtle', style: 'inline-size:100%' },
            children: [
              { tag: 'strong', attrs: { slot: 'header' }, text: '1. OKLCH Color System' },
              'Perceptually uniform ramps compiled from W3C DTCG JSON.',
            ],
          },
        ],
      },
      {
        tag: 'mth-carousel-item',
        attrs: { label: 'DSD Hydration' },
        children: [
          {
            tag: 'mth-card',
            attrs: { variant: 'subtle', style: 'inline-size:100%' },
            children: [
              { tag: 'strong', attrs: { slot: 'header' }, text: '2. Declarative Shadow DOM' },
              'Zero-FOUC streaming SSR for Next, Nuxt, Astro, and SvelteKit.',
            ],
          },
        ],
      },
      {
        tag: 'mth-carousel-item',
        attrs: { label: 'Same-Root ARIA' },
        children: [
          {
            tag: 'mth-card',
            attrs: { variant: 'subtle', style: 'inline-size:100%' },
            children: [
              { tag: 'strong', attrs: { slot: 'header' }, text: '3. Same-Root ARIA' },
              'Built-in keyboard roving focus and constraint validation.',
            ],
          },
        ],
      },
    ],
    setup: defaultSetup('mth-carousel'),
  },

  'mth-carousel-item': {
    tree: {
      tag: 'mth-carousel',
      attrs: {
        label: 'Slide preview',
        'show-controls': true,
        'show-indicators': true,
        style: 'inline-size:min(100%,28rem)',
      },
      children: [
        {
          tag: 'mth-carousel-item',
          attrs: { 'data-preview-target': true, label: 'Target Slide', active: true },
          children: [
            {
              tag: 'mth-card',
              attrs: { variant: 'outlined', style: 'inline-size:100%' },
              children: [
                { tag: 'strong', attrs: { slot: 'header' }, text: 'Active <mth-carousel-item>' },
                'Snap-aligned slide item inside <mth-carousel>.',
              ],
            },
          ],
        },
        {
          tag: 'mth-carousel-item',
          attrs: { label: 'Second Slide' },
          children: [
            {
              tag: 'mth-card',
              attrs: { variant: 'subtle', style: 'inline-size:100%' },
              children: [
                { tag: 'strong', attrs: { slot: 'header' }, text: 'Second Slide' },
                'Navigate using prev/next buttons or indicator dots.',
              ],
            },
          ],
        },
      ],
    },
  },

  'mth-cascader': {
    attrs: {
      name: 'region-path',
      label: 'Deployment region',
      placeholder: 'Select cloud / region / zone...',
      clearable: true,
    },
    style: 'inline-size:min(100%,26rem)',
    props: {
      options: [
        {
          value: 'us',
          label: 'United States',
          children: [
            {
              value: 'us-west',
              label: 'US West (Oregon)',
              children: [
                { value: 'us-west-2a', label: 'Zone 2A' },
                { value: 'us-west-2b', label: 'Zone 2B' },
              ],
            },
            {
              value: 'us-east',
              label: 'US East (Virginia)',
              children: [{ value: 'us-east-1a', label: 'Zone 1A' }],
            },
          ],
        },
        {
          value: 'eu',
          label: 'Europe',
          children: [
            {
              value: 'eu-central',
              label: 'Frankfurt',
              children: [{ value: 'eu-central-1a', label: 'Zone 1A' }],
            },
          ],
        },
      ],
    },
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-cascader', ctx),
  },

  'mth-checkbox': {
    attrs: { name: 'terms' },
    text: 'Accept Methane Design System terms',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-checkbox', ctx, 'checked'),
  },

  'mth-clock': {
    attrs: {
      variant: 'both',
      'time-zone': 'UTC',
      'show-seconds': true,
      live: true,
    },
    children: [{ tag: 'span', attrs: { slot: 'label' }, text: 'UTC Telemetry Clock' }],
  },

  'mth-coachmark': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { id: 'demo-coachmark-anchor', variant: 'outline', 'data-demo-open': true },
          text: 'Inspect Coachmark Anchor',
        },
        {
          tag: 'mth-coachmark',
          attrs: {
            'data-preview-target': true,
            target: '#demo-coachmark-anchor',
            heading: 'Keyboard Shortcut Enabled',
            placement: 'bottom',
            beacon: true,
            closable: true,
            step: 1,
            total: 3,
          },
          text: 'Press Cmd+K anywhere to jump between Methane component specs.',
        },
      ],
    },
    setup: createTriggerOverlaySetup('mth-coachmark', '[data-demo-open]'),
  },

  'mth-code-tabs': {
    attrs: { label: 'Package installation', 'show-copy': true, value: 'pnpm' },
    style: 'inline-size:min(100%,32rem)',
    props: {
      tabs: [
        { value: 'pnpm', label: 'pnpm', language: 'bash', code: 'pnpm add @methane-ui/ui @methane-ui/tokens' },
        { value: 'npm', label: 'npm', language: 'bash', code: 'npm install @methane-ui/ui @methane-ui/tokens' },
        {
          value: 'esm',
          label: 'ESM Import',
          language: 'ts',
          code: "import '@methane-ui/ui/button';\nimport '@methane-ui/tokens/tokens.css';",
        },
      ],
    },
    setup: defaultSetup('mth-code-tabs'),
  },

  'mth-color-picker': {
    attrs: {
      name: 'brand-seed',
      label: 'Primary OKLCH accent',
      value: '#3b82f6',
    },
    style: 'inline-size:min(100%,20rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-color-picker', ctx),
  },

  'mth-column': {
    tree: {
      tag: 'mth-table',
      attrs: { caption: 'Package Matrix', striped: true, style: 'inline-size:min(100%,32rem)' },
      children: [
        {
          tag: 'mth-column',
          attrs: { 'data-preview-target': true, field: 'pkg', header: 'Package (Target)', sortable: true },
        },
        { tag: 'mth-column', attrs: { field: 'layer', header: 'Layer', sortable: true } },
        { tag: 'mth-column', attrs: { field: 'size', header: 'Budget', align: 'end' } },
      ],
    },
    setup: (ctx) => {
      const table = ctx.canvas.querySelector<EventTargetElement>('mth-table');
      if (table) {
        table['rows'] = TABLE_ROWS;
        wireReadoutEvents(table, 'mth-table', ctx.setReadout);
      }
    },
  },

  'mth-combobox': {
    attrs: {
      label: 'Framework wrapper',
      placeholder: 'Filter frameworks...',
      clearable: true,
    },
    style: 'inline-size:min(100%,24rem)',
    props: { options: FRAMEWORK_SELECT_OPTIONS },
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-combobox', ctx),
  },

  'mth-command-palette': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'solid', 'data-demo-open': true },
          text: 'Open Command Palette (Cmd+K)',
        },
        {
          tag: 'mth-command-palette',
          attrs: {
            'data-preview-target': true,
            label: 'Workspace commands',
            placeholder: 'Search components, tokens, or actions...',
            'register-global-shortcut': false,
          },
        },
      ],
    },
    props: {
      commands: [
        { id: 'cmd-tokens', label: 'Open Token Builder', group: 'Studio', shortcut: 'G T' },
        { id: 'cmd-ssr', label: 'Inspect SSR Hydration Guide', group: 'Docs', shortcut: 'G S' },
        { id: 'cmd-theme', label: 'Toggle Dark Theme', group: 'Appearance', shortcut: 'T D' },
        { id: 'cmd-rtl', label: 'Toggle RTL Direction', group: 'Appearance', shortcut: 'T R' },
        { id: 'cmd-a11y', label: 'Run Conformance Audit', group: 'Quality', shortcut: 'A C' },
      ],
    },
    setup: createTriggerOverlaySetup('mth-command-palette', '[data-demo-open]'),
  },

  'mth-comparison-table': {
    attrs: { caption: 'Methane Package Tier Matrix', 'sticky-header': true },
    style: 'inline-size:min(100%,36rem)',
    props: {
      plans: [
        { id: 'core', name: 'Core', price: '0 KB JS', actionLabel: 'Use CSS' },
        { id: 'ui', name: 'Standard UI', price: '8.4 KB', badge: 'Recommended', highlighted: true, actionLabel: 'Install UI' },
        { id: 'enterprise', name: 'Full Suite', price: '18 Kits', actionLabel: 'Explore All' },
      ],
      rows: [
        { feature: 'OKLCH Tokens & Logical CSS', values: [true, true, true] },
        { feature: 'Same-Root ARIA Controllers', values: [false, true, true] },
        { feature: 'Declarative Shadow DOM SSR', values: [true, true, true] },
        { feature: 'Domain Kits & Satellites', values: [false, false, true] },
      ],
    },
    setup: defaultSetup('mth-comparison-table'),
  },

  'mth-conditional-field': {
    tree: {
      tag: 'form',
      attrs: { style: 'display:grid;gap:var(--mth-space-3);inline-size:min(100%,26rem)' },
      children: [
        {
          tag: 'mth-select',
          attrs: {
            name: 'deployMode',
            label: 'Deployment mode',
            value: 'edge',
            'data-cond-select': true,
          },
          children: [
            { tag: 'mth-option', attrs: { value: 'edge', label: 'Edge SSR' }, text: 'Edge SSR' },
            { tag: 'mth-option', attrs: { value: 'static', label: 'Static Export' }, text: 'Static Export' },
          ],
        },
        {
          tag: 'mth-conditional-field',
          attrs: {
            'data-preview-target': true,
            field: 'deployMode',
            equals: 'edge',
            mode: 'disable',
          },
          children: [
            {
              tag: 'mth-input',
              attrs: {
                name: 'edgeRegion',
                label: 'Edge runtime region (enabled when Edge SSR selected)',
                value: 'iad1',
              },
            },
          ],
        },
      ],
    },
    setup: (ctx) => {
      wireReadoutEvents(ctx.target, 'mth-conditional-field', ctx.setReadout);
      const select = ctx.canvas.querySelector<EventTargetElement>('[data-cond-select]');
      const cond = ctx.target as EventTargetElement;
      cond['values'] = { deployMode: 'edge' };
      select?.addEventListener('mth-change', (ev) => {
        const val = (ev as CustomEvent<{ value?: string }>).detail?.value ?? 'edge';
        cond['values'] = { deployMode: val };
      });
    },
  },

  'mth-context-menu': {
    tree: {
      tag: 'mth-context-menu',
      attrs: { 'data-preview-target': true, label: 'Canvas context actions' },
      children: [
        {
          tag: 'div',
          attrs: {
            'data-ctx-surface': true,
            style:
              'display:grid;place-items:center;gap:var(--mth-space-2);padding:var(--mth-space-6);border:1px dashed var(--mth-color-border-strong);border-radius:var(--mth-radius-md);inline-size:min(100%,26rem);text-align:center',
          },
          children: [
            { tag: 'strong', text: 'Right-click anywhere in this box' },
            {
              tag: 'mth-button',
              attrs: { variant: 'outline', size: 'sm', 'data-ctx-btn': true },
              text: 'Or click to open Context Menu',
            },
          ],
        },
      ],
    },
    props: {
      items: [
        { value: 'inspect', label: 'Inspect Shadow DOM', shortcut: '⌘I' },
        { value: 'copy-tag', label: 'Copy Tag Markup', shortcut: '⌘C' },
        { value: 'sep-1', label: '', separator: true },
        {
          value: 'theme',
          label: 'Switch Surface',
          children: [
            { value: 'light', label: 'Light Mode' },
            { value: 'dark', label: 'Dark Mode' },
          ],
        },
        { value: 'reset', label: 'Reset Stage' },
      ],
    },
    setup: (ctx) => {
      wireReadoutEvents(ctx.target, 'mth-context-menu', ctx.setReadout);
      const btn = ctx.canvas.querySelector<HTMLElement>('[data-ctx-btn]');
      btn?.addEventListener('click', () => {
        const rect = btn.getBoundingClientRect();
        const menu = ctx.target as EventTargetElement & { openAt?: (x: number, y: number) => Promise<boolean> };
        void menu.openAt?.(rect.left + rect.width / 2, rect.bottom + 4);
      });
    },
  },

  'mth-cookie-banner': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'outline', 'data-demo-open': true },
          text: 'Show Cookie Preferences Banner',
        },
        {
          tag: 'mth-cookie-banner',
          attrs: {
            'data-preview-target': true,
            heading: 'Privacy & Telemetry Preferences',
            position: 'bottom',
            'show-preferences': true,
          },
          text: 'We use essential session storage and optional product analytics.',
        },
      ],
    },
    setup: createTriggerOverlaySetup('mth-cookie-banner', '[data-demo-open]'),
  },

  'mth-copy-button': {
    attrs: {
      value: 'pnpm add @methane-ui/ui @methane-ui/tokens',
      label: 'Copy install command',
      'copied-label': 'Copied!',
      variant: 'outline',
    },
    setup: defaultSetup('mth-copy-button'),
  },

  'mth-countdown': {
    attrs: {
      duration: 86_400,
      format: 'dhms',
      precision: 'seconds',
      running: true,
    },
    children: [{ tag: 'span', attrs: { slot: 'prefix' }, text: 'Next release window: ' }],
    setup: defaultSetup('mth-countdown'),
  },

  'mth-creatable-select': {
    attrs: {
      name: 'labels',
      label: 'Issue labels',
      placeholder: 'Select or type a new label...',
      multiple: true,
      'allow-create': true,
      value: 'tokens',
    },
    style: 'inline-size:min(100%,26rem)',
    props: {
      options: [
        { value: 'tokens', label: 'tokens' },
        { value: 'accessibility', label: 'accessibility' },
        { value: 'ssr', label: 'ssr' },
        { value: 'performance', label: 'performance' },
      ],
    },
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-creatable-select', ctx),
  },

  'mth-credit-card-input': {
    attrs: {
      name: 'card',
      label: 'Billing card number',
      placeholder: '4242 4242 4242 4242',
      hint: 'Auto-formats PAN & detects card network locally',
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-credit-card-input'),
  },

  'mth-cron-builder': {
    attrs: {
      name: 'schedule',
      label: 'Automation cron schedule',
      value: '0 9 * * 1-5',
    },
    style: 'inline-size:min(100%,30rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-cron-builder', ctx),
  },

  'mth-currency-input': {
    attrs: {
      name: 'budget',
      label: 'Monthly cloud budget',
      currency: 'USD',
      locale: 'en-US',
      value: '2500.00',
      hint: 'Locale-formatted decimal currency input',
    },
    style: 'inline-size:min(100%,22rem)',
    setup: defaultSetup('mth-currency-input'),
  },

  'mth-date-picker': {
    attrs: {
      name: 'release-date',
      label: 'Target release date',
      value: '2026-11-15',
    },
    style: 'inline-size:min(100%,22rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-date-picker', ctx),
  },

  'mth-date-range-calendar': {
    attrs: {
      start: '2026-11-10',
      end: '2026-11-18',
      months: 1,
      locale: 'en-US',
    },
    style: 'inline-size:min(100%,22rem)',
    setup: defaultSetup('mth-date-range-calendar'),
  },

  'mth-date-range-picker': {
    attrs: {
      name: 'sprint-window',
      label: 'Sprint window',
      'start-date': '2026-11-10',
      'end-date': '2026-11-18',
    },
    style: 'inline-size:min(100%,26rem)',
    setup: defaultSetup('mth-date-range-picker'),
  },

  'mth-datetime-picker': {
    attrs: {
      name: 'maintenance',
      label: 'Maintenance window',
      value: '2026-11-15T16:30',
    },
    style: 'inline-size:min(100%,24rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-datetime-picker', ctx),
  },

  'mth-dialog': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'solid', 'data-demo-open': true },
          text: 'Open Live <mth-dialog>',
        },
        {
          tag: 'mth-dialog',
          attrs: {
            'data-preview-target': true,
            label: 'Confirm Release Action',
            description: 'Top-layer modal focus trap and Escape dismissal.',
            variant: 'confirm',
          },
          children: [
            {
              tag: 'p',
              attrs: { style: 'margin-block:0' },
              text: 'Publish @methane-ui/ui release artifacts with Sigstore provenance?',
            },
          ],
        },
      ],
    },
    setup: createTriggerOverlaySetup('mth-dialog', '[data-demo-open]'),
  },

  'mth-drawer': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'outline', 'data-demo-open': true },
          text: 'Open Live <mth-drawer>',
        },
        {
          tag: 'mth-drawer',
          attrs: {
            'data-preview-target': true,
            label: 'Token Inspector',
            placement: 'end',
            size: 'sm',
          },
          children: [
            {
              tag: 'p',
              attrs: { style: 'margin-block:0' },
              text: 'Slide-over drawer supporting start, end, top, and bottom logical placements.',
            },
          ],
        },
      ],
    },
    setup: createTriggerOverlaySetup('mth-drawer', '[data-demo-open]', (targetEl) => {
      targetEl['open'] = true;
    }),
  },

  'mth-drawing-pad': {
    attrs: {
      label: 'Sketch canvas',
      tool: 'pen',
      'stroke-width': 3,
    },
    style: 'inline-size:min(100%,28rem)',
    setup: defaultSetup('mth-drawing-pad'),
  },

  'mth-dropdown-menu': {
    attrs: { label: 'Document actions' },
    children: [
      { tag: 'mth-button', attrs: { slot: 'trigger', variant: 'outline' }, text: 'Actions' },
      { tag: 'mth-menu-item', attrs: { value: 'edit', shortcut: '⌘E' }, text: 'Edit Spec' },
      { tag: 'mth-menu-item', attrs: { value: 'duplicate', shortcut: '⌘D' }, text: 'Duplicate' },
      { tag: 'mth-menu-item', attrs: { value: 'archive' }, text: 'Archive' },
    ],
    setup: defaultSetup('mth-dropdown-menu'),
  },

  'mth-dropzone': {
    attrs: {
      label: 'Upload design tokens or assets',
      accept: '.json,.svg,.png',
      multiple: true,
    },
    style: 'inline-size:min(100%,28rem)',
    text: 'Drop tokens.json or SVG files here, or click to browse.',
    setup: defaultSetup('mth-dropzone'),
  },

  'mth-duration-input': {
    attrs: {
      name: 'ttl',
      label: 'Cache TTL duration',
      value: '01:30:00',
      'show-seconds': true,
    },
    style: 'inline-size:min(100%,20rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-duration-input', ctx),
  },

  'mth-emoji-picker': {
    attrs: {
      label: 'Reaction emoji',
      inline: true,
      columns: 6,
    },
    style: 'inline-size:min(100%,22rem)',
    setup: defaultSetup('mth-emoji-picker'),
  },

  'mth-empty-state': {
    attrs: {
      heading: 'No matching components',
      description: 'Adjust your package filter or reset the active tokens query.',
      variant: 'card',
      tone: 'neutral',
    },
    style: 'inline-size:min(100%,28rem)',
    children: [
      { tag: 'mth-icon', attrs: { slot: 'icon', name: 'search', size: 'xl' } },
      {
        tag: 'mth-button',
        attrs: { slot: 'actions', variant: 'outline', size: 'sm' },
        text: 'Clear Filters',
      },
    ],
  },

  'mth-error-boundary': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'inline-size:min(100%,26rem)' },
      children: [
        {
          tag: 'mth-flex',
          attrs: { 'data-gap': '2' },
          children: [
            {
              tag: 'mth-button',
              attrs: { variant: 'danger', size: 'sm', 'data-eb-trigger': true },
              text: 'Simulate Error',
            },
            {
              tag: 'mth-button',
              attrs: { variant: 'outline', size: 'sm', 'data-eb-reset': true },
              text: 'Reset',
            },
          ],
        },
        {
          tag: 'mth-error-boundary',
          attrs: {
            'data-preview-target': true,
            'fallback-message': 'Recovered cleanly from subtree failure.',
          },
          children: [
            {
              tag: 'div',
              attrs: { class: 'docs-card', 'data-eb-child': true },
              text: 'Protected subtree healthy — click Simulate Error to test declarative fallback.',
            },
          ],
        },
      ],
    },
    setup: (ctx) => {
      const errBtn = ctx.canvas.querySelector<HTMLElement>('[data-eb-trigger]');
      const resetBtn = ctx.canvas.querySelector<HTMLElement>('[data-eb-reset]');
      const child = ctx.canvas.querySelector<HTMLElement>('[data-eb-child]');
      errBtn?.addEventListener('click', () => {
        (child ?? ctx.target).dispatchEvent(
          new CustomEvent('mth-error', {
            bubbles: true,
            detail: { error: new Error('Simulated preview subtree error') },
          }),
        );
      });
      resetBtn?.addEventListener('click', () => {
        const eb = ctx.target as EventTargetElement & { reset?: () => void };
        eb.reset?.();
      });
      wireReadoutEvents(ctx.target, 'mth-error-boundary', ctx.setReadout, [
        'mth-error-captured',
        'mth-reset',
      ]);
    },
  },

  'mth-error-summary': {
    attrs: { heading: 'Please resolve 3 form issues' },
    style: 'inline-size:min(100%,30rem)',
    props: {
      errors: [
        { id: 'err-email', fieldId: 'email', label: 'Email address', message: 'Enter a valid work email address.' },
        { id: 'err-slug', fieldId: 'slug', label: 'Workspace slug', message: 'Slug must be at least 3 lowercase characters.' },
        { id: 'err-terms', fieldId: 'terms', label: 'Terms', message: 'Accept the service agreement to continue.' },
      ],
    },
    setup: defaultSetup('mth-error-summary'),
  },

  'mth-fab': {
    attrs: {
      label: 'New Component',
      variant: 'primary',
      size: 'md',
      extended: true,
      fixed: false,
    },
    children: [
      { tag: 'mth-icon', attrs: { slot: 'icon', name: 'plus' } },
      'Create Spec',
    ],
    setup: defaultSetup('mth-fab'),
  },

  'mth-field': {
    attrs: {
      label: 'Workspace slug',
      hint: 'Used in public documentation URLs',
      required: true,
    },
    style: 'inline-size:min(100%,24rem)',
    children: [{ tag: 'mth-input', attrs: { value: 'methane-ui' } }],
    setup: (ctx) => wireReadoutEvents(ctx.canvas, 'mth-field', ctx.setReadout, ['mth-input', 'mth-change']),
  },

  'mth-fieldset': {
    attrs: {
      legend: 'Notification Preferences',
      hint: 'Choose how workspace events are delivered',
    },
    style: 'inline-size:min(100%,26rem)',
    children: [
      { tag: 'mth-checkbox', attrs: { checked: true }, text: 'Release status alerts' },
      { tag: 'mth-checkbox', text: 'Weekly bundle budget digest' },
    ],
  },

  'mth-file-upload': {
    attrs: {
      name: 'attachments',
      label: 'Attach release artifacts',
      accept: '.json,.md,.png',
      multiple: true,
    },
    style: 'inline-size:min(100%,28rem)',
    setup: defaultSetup('mth-file-upload'),
  },

  'mth-floating-panel': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'outline', 'data-demo-open': true },
          text: 'Open Floating Panel',
        },
        {
          tag: 'mth-floating-panel',
          attrs: {
            'data-preview-target': true,
            label: 'Token Telemetry',
            closable: true,
            minimizable: true,
            dockable: true,
            x: 32,
            y: 96,
          },
          children: [
            { tag: 'strong', attrs: { slot: 'header' }, text: 'Live Token Inspector' },
            'Drag header, minimize, or dock to viewport edges.',
          ],
        },
      ],
    },
    setup: createTriggerOverlaySetup('mth-floating-panel', '[data-demo-open]'),
  },

  'mth-form': {
    style: 'inline-size:min(100%,26rem)',
    children: [
      {
        tag: 'mth-stack',
        attrs: { 'data-gap': '3' },
        children: [
          {
            tag: 'mth-input',
            attrs: { name: 'project', label: 'Project name', value: 'methane-ui', required: true },
          },
          {
            tag: 'mth-select',
            attrs: { name: 'framework', label: 'Target runtime', value: 'astro' },
            children: buildOptionChildren(),
          },
          {
            tag: 'mth-button',
            attrs: { type: 'submit', variant: 'solid' },
            text: 'Save Configuration',
          },
        ],
      },
    ],
    setup: (ctx) => {
      wireReadoutEvents(ctx.target, 'mth-form', ctx.setReadout);
      ctx.target.addEventListener('submit', (ev) => {
        ev.preventDefault();
      });
    },
  },

  'mth-form-repeater': {
    attrs: {
      name: 'webhooks',
      label: 'Webhook endpoints',
      'add-label': 'Add endpoint',
      reorderable: true,
      value: JSON.stringify([
        { label: 'Production', url: 'https://hooks.methane.dev/prod' },
        { label: 'Staging', url: 'https://hooks.methane.dev/stage' },
      ]),
    },
    style: 'inline-size:min(100%,30rem)',
    props: {
      fields: [
        { name: 'label', label: 'Label', type: 'text', placeholder: 'Environment' },
        { name: 'url', label: 'Endpoint URL', type: 'url', placeholder: 'https://...' },
      ],
    },
    setup: defaultSetup('mth-form-repeater'),
  },

  'mth-form-wizard': {
    attrs: { label: 'Workspace setup wizard', 'active-step': 0 },
    style: 'inline-size:min(100%,30rem)',
    children: [
      {
        tag: 'div',
        attrs: { 'data-step': 'account', 'data-title': 'Workspace' },
        children: [
          {
            tag: 'mth-input',
            attrs: { name: 'workspace', label: 'Workspace name', value: 'Methane Core' },
          },
        ],
      },
      {
        tag: 'div',
        attrs: { 'data-step': 'theme', 'data-title': 'Theme' },
        children: [
          {
            tag: 'mth-switch',
            attrs: { checked: true },
            text: 'Enable automatic OKLCH dark mode',
          },
        ],
      },
      {
        tag: 'div',
        attrs: { 'data-step': 'review', 'data-title': 'Review' },
        text: 'Ready to provision workspace with Declarative Shadow DOM.',
      },
    ],
    setup: defaultSetup('mth-form-wizard'),
  },

  'mth-fullscreen-overlay': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'solid', 'data-demo-open': true },
          text: 'Launch Fullscreen Overlay',
        },
        {
          tag: 'mth-fullscreen-overlay',
          attrs: {
            'data-preview-target': true,
            label: 'Fullscreen Spec Canvas',
            closable: true,
          },
          children: [
            { tag: 'strong', attrs: { slot: 'header' }, text: 'Fullscreen Workspace View' },
            {
              tag: 'p',
              text: 'Uses native top-layer <dialog> with focus trap and Escape dismissal.',
            },
            {
              tag: 'mth-button',
              attrs: { slot: 'footer', variant: 'outline', 'data-overlay-close': true },
              text: 'Close Overlay',
            },
          ],
        },
      ],
    },
    setup: (ctx) => {
      createTriggerOverlaySetup('mth-fullscreen-overlay', '[data-demo-open]')(ctx);
      const closeBtn = ctx.canvas.querySelector<HTMLElement>('[data-overlay-close]');
      closeBtn?.addEventListener('click', () => {
        const overlay = ctx.target as EventTargetElement & { hide?: () => Promise<boolean> };
        void overlay.hide?.();
      });
    },
  },

  'mth-gallery': {
    attrs: { label: 'Component showcase gallery', 'show-thumbnails': true },
    style:
      'inline-size:min(100%,28rem);min-block-size:7rem;padding:var(--mth-space-4);border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)',
    setup: defaultSetup('mth-gallery'),
  },

  'mth-hover-card': {
    attrs: { label: 'Package details card', placement: 'bottom' },
    children: [
      {
        tag: 'mth-button',
        attrs: { slot: 'trigger', variant: 'outline', size: 'sm' },
        text: 'Hover or focus @methane-ui/ui',
      },
      {
        tag: 'div',
        attrs: { style: 'padding:var(--mth-space-2);max-inline-size:17rem' },
        children: [
          { tag: 'strong', text: '@methane-ui/ui@0.1.0' },
          {
            tag: 'p',
            attrs: { style: 'margin-block:var(--mth-space-1) 0;font-size:var(--mth-font-size-sm)' },
            text: '167 accessible Web Components with OKLCH tokens and SSR hydration.',
          },
        ],
      },
    ],
    setup: defaultSetup('mth-hover-card'),
  },

  'mth-iban-input': {
    attrs: {
      name: 'iban',
      label: 'SEPA IBAN',
      value: 'DE89 3704 0044 0532 0130 00',
      hint: 'Validates MOD-97 checksum and country length',
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-iban-input'),
  },

  'mth-icon': {
    attrs: { name: 'check', size: 'lg', label: 'Verified' },
  },

  'mth-icon-button': {
    attrs: { variant: 'outline', label: 'Bookmark component' },
    children: [{ tag: 'mth-icon', attrs: { name: 'plus' } }],
    setup: defaultSetup('mth-icon-button'),
  },

  'mth-image': {
    attrs: {
      alt: 'Precision Atmospheric Surface',
      'aspect-ratio': '16 / 9',
      rounded: true,
    },
    style: 'inline-size:min(100%,22rem)',
    children: [
      {
        tag: 'div',
        attrs: {
          slot: 'fallback',
          style:
            'display:grid;place-items:center;inline-size:100%;block-size:100%;min-block-size:9rem;background:var(--mth-color-bg-subtle);color:var(--mth-color-fg);padding:var(--mth-space-4);text-align:center',
        },
        text: 'Methane UI · 16:9 Responsive Image Frame',
      },
    ],
  },

  'mth-image-cropper': {
    attrs: {
      src: buildSvgDataUri('Methane Avatar', '#3b82f6', '#0f172a'),
      alt: 'Sample studio artwork',
      'aspect-ratio': 1.5,
      zoom: 1.1,
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-image-cropper'),
  },

  'mth-infinite-scroll': {
    attrs: { 'auto-load': true },
    style: 'inline-size:min(100%,28rem);max-block-size:16rem;overflow:auto',
    props: {
      renderItem: (item: { readonly name: string; readonly layer: string }) =>
        `${item.name} · ${item.layer}`,
      dataSource: {
        async query(req: { cursor?: string }) {
          const offset = Number(req.cursor ?? '0');
          const batch = METHANE_PACKAGES.slice(offset, offset + 4).map((p) => ({
            name: p.value,
            layer: p.category,
          }));
          const next = offset + 4 < METHANE_PACKAGES.length ? String(offset + 4) : null;
          return { items: batch, total: METHANE_PACKAGES.length, nextCursor: next };
        },
      },
    },
    setup: defaultSetup('mth-infinite-scroll'),
  },

  'mth-inline-edit': {
    attrs: {
      name: 'title',
      label: 'Component title',
      value: 'Precision Atmospheric Design System',
    },
    style: 'inline-size:min(100%,26rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-inline-edit', ctx),
  },

  'mth-inline-status': {
    attrs: { variant: 'success', label: 'Build status' },
    text: 'All 121 browser E2E checks passing',
  },

  'mth-input': {
    attrs: {
      label: 'Email address',
      placeholder: 'you@methane.dev',
      hint: 'Work or personal email',
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-input'),
  },

  'mth-key-value': {
    attrs: {
      label: 'Registry Package',
      value: '@methane-ui/ui@0.1.0',
      copyable: true,
      monospace: true,
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-key-value'),
  },

  'mth-lightbox': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'solid', 'data-demo-open': true },
          text: 'Open Media Lightbox (3 Slides)',
        },
        {
          tag: 'mth-lightbox',
          attrs: {
            'data-preview-target': true,
            label: 'Architecture slides',
            closable: true,
            zoomable: true,
            loop: true,
          },
        },
      ],
    },
    setup: (ctx) => {
      const lb = ctx.target as EventTargetElement;
      lb['items'] = [
        {
          src: buildSvgBlobUrl('OKLCH Color Tokens', '#38bdf8', '#0f172a'),
          alt: 'OKLCH Color Tokens',
          caption: '1 / 3 · Perceptual OKLCH color scale',
        },
        {
          src: buildSvgBlobUrl('Declarative Shadow DOM', '#818cf8', '#111827'),
          alt: 'Declarative Shadow DOM',
          caption: '2 / 3 · Zero-FOUC SSR hydration',
        },
        {
          src: buildSvgBlobUrl('Same-Root ARIA', '#34d399', '#064e3b'),
          alt: 'Same-Root ARIA',
          caption: '3 / 3 · Built-in roving focus & validation',
        },
      ];
      createTriggerOverlaySetup('mth-lightbox', '[data-demo-open]')(ctx);
    },
  },

  'mth-link': {
    attrs: { href: '#components', underline: 'hover' },
    text: 'Explore Component Specs',
    children: [{ tag: 'mth-icon', attrs: { slot: 'suffix', name: 'external', size: 'sm' } }],
    setup: (ctx) => {
      wireReadoutEvents(ctx.target, 'mth-link', ctx.setReadout, ['mth-press']);
    },
  },

  'mth-list': {
    attrs: {
      'selection-mode': 'single',
      value: 'tokens',
      dividers: true,
      label: 'Architecture layers',
    },
    style: 'inline-size:min(100%,26rem)',
    children: [
      { tag: 'mth-list-item', attrs: { value: 'tokens', description: 'W3C DTCG OKLCH ramps' }, text: '@methane-ui/tokens' },
      { tag: 'mth-list-item', attrs: { value: 'css', description: 'Logical CSS layout primitives' }, text: '@methane-ui/css' },
      { tag: 'mth-list-item', attrs: { value: 'ui', description: '167 core Web Components' }, text: '@methane-ui/ui' },
    ],
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-list', ctx),
  },

  'mth-list-item': {
    tree: {
      tag: 'mth-list',
      attrs: { 'selection-mode': 'single', value: 'target', dividers: true, style: 'inline-size:min(100%,26rem)' },
      children: [
        {
          tag: 'mth-list-item',
          attrs: {
            'data-preview-target': true,
            value: 'target',
            description: 'Selected interactive item',
            selected: true,
            interactive: true,
          },
          text: '@methane-ui/ui (Target)',
        },
        {
          tag: 'mth-list-item',
          attrs: { value: 'primitives', description: 'Reactive controllers', interactive: true },
          text: '@methane-ui/primitives',
        },
      ],
    },
  },

  'mth-load-more': {
    style: 'inline-size:min(100%,26rem)',
    props: {
      renderItem: (item: { readonly label: string }) => item.label,
      dataSource: {
        async query(req: { cursor?: string }) {
          const offset = Number(req.cursor ?? '0');
          const batch = METHANE_PACKAGES.slice(offset, offset + 3);
          const next = offset + 3 < METHANE_PACKAGES.length ? String(offset + 3) : null;
          return { items: batch, total: METHANE_PACKAGES.length, nextCursor: next };
        },
      },
    },
    setup: defaultSetup('mth-load-more'),
  },

  'mth-loading-overlay': {
    attrs: { active: true, label: 'Hydrating Shadow DOM...' },
    style: 'inline-size:min(100%,26rem)',
    children: [
      {
        tag: 'mth-card',
        attrs: { variant: 'outlined', style: 'inline-size:100%' },
        children: [
          { tag: 'strong', attrs: { slot: 'header' }, text: 'Protected Workspace Card' },
          'Content beneath the accessible status scrim.',
        ],
      },
    ],
    setup: defaultSetup('mth-loading-overlay'),
  },

  'mth-masked-input': {
    attrs: {
      name: 'license-key',
      label: 'License key',
      mask: 'AAAA-9999-AAAA',
      placeholder: 'MTHN-2026-CORE',
      hint: 'Pattern mask: AAAA-9999-AAAA',
    },
    style: 'inline-size:min(100%,22rem)',
    setup: defaultSetup('mth-masked-input'),
  },

  'mth-masonry': {
    attrs: { columns: 2, gap: '0.75rem' },
    style: 'inline-size:min(100%,30rem)',
    children: [
      {
        tag: 'mth-card',
        attrs: { variant: 'subtle', style: 'inline-size:100%' },
        children: [
          { tag: 'strong', attrs: { slot: 'header' }, text: 'Tokens' },
          'OKLCH color ramps & semantic aliases.',
        ],
      },
      {
        tag: 'mth-card',
        attrs: { variant: 'subtle', style: 'inline-size:100%' },
        children: [
          { tag: 'strong', attrs: { slot: 'header' }, text: 'Primitives' },
          'Shared FormControl, Listbox, Overlay, Positioning, and Virtualizer controllers.',
        ],
      },
      {
        tag: 'mth-card',
        attrs: { variant: 'subtle', style: 'inline-size:100%' },
        children: [
          { tag: 'strong', attrs: { slot: 'header' }, text: 'SSR Adapters' },
          'Next.js, Nuxt, Astro, SvelteKit, and Angular Declarative Shadow DOM renderers.',
        ],
      },
      {
        tag: 'mth-card',
        attrs: { variant: 'subtle', style: 'inline-size:100%' },
        children: [
          { tag: 'strong', attrs: { slot: 'header' }, text: 'Conformance' },
          'Vitest + Playwright Chromium & WebKit suites.',
        ],
      },
    ],
  },

  'mth-mega-menu': {
    attrs: { label: 'Platform navigation' },
    style: 'inline-size:min(100%,32rem)',
    props: {
      sections: [
        {
          id: 'foundations',
          label: 'Foundations',
          columns: [
            {
              title: 'Design System',
              links: [
                { label: 'OKLCH Tokens', href: '#tokens', description: 'Perceptual color ramps' },
                { label: 'Logical CSS', href: '#css', description: 'RTL-ready layout utilities' },
              ],
            },
            {
              title: 'Architecture',
              links: [
                { label: 'Shadow DOM SSR', href: '#ssr', description: 'Zero-FOUC hydration' },
                { label: 'Same-Root ARIA', href: '#a11y', description: 'Roving focus & validation' },
              ],
            },
          ],
        },
        {
          id: 'kits',
          label: 'Domain Kits',
          columns: [
            {
              title: 'Packages',
              links: [
                { label: '@methane-ui/admin', href: '#admin' },
                { label: '@methane-ui/ai', href: '#ai' },
                { label: '@methane-ui/commerce', href: '#commerce' },
              ],
            },
          ],
        },
        { id: 'docs', label: 'Changelog', href: '#changelog' },
      ],
    },
    setup: defaultSetup('mth-mega-menu'),
  },

  'mth-mention-input': {
    attrs: {
      name: 'comment',
      label: 'Release comment',
      placeholder: 'Type @ to mention a package or teammate...',
      hint: 'Trigger character: @',
      multiline: true,
      rows: 3,
    },
    style: 'inline-size:min(100%,28rem)',
    props: {
      options: [
        { value: 'ada', label: 'Ada Lovelace', description: 'Tokens Lead' },
        { value: 'grace', label: 'Grace Hopper', description: 'Compiler Architect' },
        { value: 'core', label: '@methane-ui/core', description: 'Base runtime' },
        { value: 'ui', label: '@methane-ui/ui', description: 'Component suite' },
      ],
    },
    setup: defaultSetup('mth-mention-input'),
  },

  'mth-menu-item': {
    tree: {
      tag: 'mth-dropdown-menu',
      attrs: { label: 'File menu' },
      children: [
        { tag: 'mth-button', attrs: { slot: 'trigger', variant: 'outline' }, text: 'Menu Items' },
        {
          tag: 'mth-menu-item',
          attrs: { 'data-preview-target': true, value: 'format', shortcut: '⇧⌥F' },
          text: 'Format Spec (Target)',
        },
        {
          tag: 'mth-menu-item',
          attrs: { value: 'autosave', type: 'checkbox', checked: true },
          text: 'Auto-Save',
        },
        { tag: 'mth-menu-item', attrs: { value: 'export' }, text: 'Export CEM JSON' },
      ],
    },
    setup: defaultSetup('mth-menu-item'),
  },

  'mth-menubar': {
    attrs: { label: 'Workspace menu bar', orientation: 'horizontal' },
    style: 'inline-size:min(100%,28rem)',
    props: {
      items: [
        {
          value: 'file',
          label: 'File',
          children: [
            { value: 'new', label: 'New Component', shortcut: '⌘N' },
            { value: 'save', label: 'Save Spec', shortcut: '⌘S' },
          ],
        },
        {
          value: 'view',
          label: 'View',
          children: [
            { value: 'tokens', label: 'Token Inspector' },
            { value: 'rtl', label: 'RTL Preview' },
          ],
        },
        { value: 'help', label: 'Docs', href: '#docs' },
      ],
    },
    setup: defaultSetup('mth-menubar'),
  },

  'mth-month-picker': {
    attrs: {
      name: 'billing-month',
      label: 'Billing period',
      value: '2026-11',
    },
    style: 'inline-size:min(100%,20rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-month-picker', ctx),
  },

  'mth-multi-select': {
    attrs: {
      name: 'targets',
      label: 'SSR targets',
      placeholder: 'Select frameworks...',
      value: 'astro,next',
    },
    style: 'inline-size:min(100%,26rem)',
    props: { options: FRAMEWORK_SELECT_OPTIONS },
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-multi-select', ctx),
  },

  'mth-navbar': {
    attrs: { label: 'Primary navigation' },
    style: 'inline-size:min(100%,34rem)',
    children: [
      { tag: 'strong', attrs: { slot: 'brand' }, text: 'Methane UI' },
      { tag: 'mth-link', attrs: { href: '#docs' }, text: 'Docs' },
      { tag: 'mth-link', attrs: { href: '#tokens' }, text: 'Tokens' },
      { tag: 'mth-link', attrs: { href: '#kits' }, text: 'Kits' },
      {
        tag: 'mth-button',
        attrs: { slot: 'actions', variant: 'solid', size: 'sm' },
        text: 'Get Started',
      },
    ],
    setup: defaultSetup('mth-navbar'),
  },

  'mth-network-status': {
    attrs: {
      online: true,
      'show-when-online': true,
      'online-label': 'Connected to Methane Registry',
      'offline-label': 'Offline — cached local specs active',
      retryable: true,
    },
    setup: defaultSetup('mth-network-status'),
  },

  'mth-newsletter-form': {
    attrs: {
      name: 'email',
      heading: 'Subscribe to Methane release notes',
      placeholder: 'engineer@company.dev',
      'submit-label': 'Subscribe',
    },
    style: 'inline-size:min(100%,28rem)',
    setup: defaultSetup('mth-newsletter-form'),
  },

  'mth-notification-center': {
    attrs: {
      inline: true,
      open: true,
      heading: 'Workspace Notifications',
    },
    style: 'inline-size:min(100%,28rem)',
    setup: (ctx) => {
      const center = ctx.target as EventTargetElement & {
        notify?: (opts: { title?: string; message: string; tone?: string }) => void;
      };
      center.notify?.({
        title: 'Release v0.1.0 live',
        message: 'All 35 public packages published to npm.',
        tone: 'success',
      });
      center.notify?.({
        title: 'E2E Matrix Passed',
        message: 'Chromium & WebKit hydration verified.',
        tone: 'info',
      });
      wireReadoutEvents(ctx.target, 'mth-notification-center', ctx.setReadout);
    },
  },

  'mth-number-input': {
    attrs: {
      label: 'Concurrency limit',
      value: '4',
      min: 1,
      max: 32,
      step: 1,
      hint: '1 to 32 workers',
    },
    style: 'inline-size:min(100%,20rem)',
    setup: defaultSetup('mth-number-input'),
  },

  'mth-option': {
    tree: {
      tag: 'div',
      attrs: { class: 'mth-preview-listbox', role: 'listbox', 'aria-label': 'Architecture options' },
      children: [
        {
          tag: 'mth-option-group',
          attrs: { label: 'Architecture Pillars' },
          children: [
            {
              tag: 'mth-option',
              attrs: {
                'data-preview-target': true,
                value: 'oklch',
                label: 'OKLCH Perceptual Ramp',
                selected: true,
              },
              text: 'OKLCH Perceptual Ramp',
            },
            {
              tag: 'mth-option',
              attrs: { value: 'logical', label: 'CSS Logical Properties' },
              text: 'CSS Logical Properties',
            },
            {
              tag: 'mth-option',
              attrs: { value: 'dsd', label: 'Declarative Shadow DOM' },
              text: 'Declarative Shadow DOM',
            },
          ],
        },
      ],
    },
    setup: (ctx) => {
      const options = ctx.canvas.querySelectorAll<HTMLElement>('mth-option');
      for (const opt of options) {
        opt.addEventListener('click', () => {
          if (opt.hasAttribute('disabled')) return;
          for (const sibling of options) sibling.removeAttribute('selected');
          opt.setAttribute('selected', '');
          ctx.setReadout(`Selected <mth-option value="${opt.getAttribute('value') ?? ''}">`);
        });
      }
    },
  },

  'mth-option-group': {
    tree: {
      tag: 'div',
      attrs: { class: 'mth-preview-listbox', role: 'listbox', 'aria-label': 'Architecture options' },
      children: [
        {
          tag: 'mth-option-group',
          attrs: { 'data-preview-target': true, label: 'Architecture Pillars' },
          children: [
            {
              tag: 'mth-option',
              attrs: { value: 'oklch', label: 'OKLCH Perceptual Ramp', selected: true },
              text: 'OKLCH Perceptual Ramp',
            },
            {
              tag: 'mth-option',
              attrs: { value: 'logical', label: 'CSS Logical Properties' },
              text: 'CSS Logical Properties',
            },
            {
              tag: 'mth-option',
              attrs: { value: 'dsd', label: 'Declarative Shadow DOM' },
              text: 'Declarative Shadow DOM',
            },
          ],
        },
      ],
    },
    setup: (ctx) => {
      const options = ctx.canvas.querySelectorAll<HTMLElement>('mth-option');
      for (const opt of options) {
        opt.addEventListener('click', () => {
          if (opt.hasAttribute('disabled')) return;
          for (const sibling of options) sibling.removeAttribute('selected');
          opt.setAttribute('selected', '');
          ctx.setReadout(`Selected <mth-option value="${opt.getAttribute('value') ?? ''}">`);
        });
      }
    },
  },

  'mth-otp-input': {
    attrs: {
      name: 'otp',
      label: 'Verification code',
      length: 6,
      hint: 'Enter the 6-digit authenticator code',
    },
    setup: defaultSetup('mth-otp-input'),
  },

  'mth-pagination': {
    attrs: {
      page: 3,
      'total-pages': 12,
      label: 'Results pagination',
    },
    setup: defaultSetup('mth-pagination'),
  },

  'mth-password-input': {
    attrs: {
      name: 'api-secret',
      label: 'Signing passphrase',
      placeholder: 'Enter passphrase...',
      toggleable: true,
      'show-strength': true,
      value: 'MethaneOKLCH!2026',
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-password-input'),
  },

  'mth-phone-input': {
    attrs: {
      name: 'phone',
      label: 'On-call phone',
      country: 'US',
      'dial-code': '+1',
      placeholder: '(555) 234-5678',
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-phone-input'),
  },

  'mth-popover': {
    attrs: { label: 'Workspace telemetry' },
    children: [
      { tag: 'mth-button', attrs: { slot: 'trigger', variant: 'outline' }, text: 'Toggle Popover' },
      {
        tag: 'div',
        attrs: { style: 'padding:var(--mth-space-2);max-inline-size:16rem' },
        children: [
          { tag: 'strong', text: 'Anchored Popover' },
          {
            tag: 'p',
            attrs: {
              style:
                'margin-block:var(--mth-space-1) 0;font-size:var(--mth-font-size-sm);color:var(--mth-color-fg-muted)',
            },
            text: 'Uses native Popover + CSS Anchor Positioning with automatic viewport fallback.',
          },
        ],
      },
    ],
    setup: defaultSetup('mth-popover'),
  },

  'mth-progress-bar': {
    attrs: {
      value: 68,
      max: 100,
      label: 'Bundle optimization progress',
    },
    style: 'inline-size:min(100%,24rem)',
  },

  'mth-progress-ring': {
    attrs: {
      value: 74,
      max: 100,
      'show-value': true,
      label: 'Test coverage',
    },
    setup: defaultSetup('mth-progress-ring'),
  },

  'mth-qr-code': {
    attrs: {
      value: 'https://mahdins.dev/methane/',
      label: 'Methane UI Docs QR Code',
      size: 160,
      'error-correction': 'M',
    },
  },

  'mth-radio': {
    tree: {
      tag: 'mth-radio-group',
      attrs: { label: 'Release channel', value: 'stable' },
      children: [
        {
          tag: 'mth-radio',
          attrs: { 'data-preview-target': true, value: 'stable', checked: true },
          text: 'Stable (Target)',
        },
        { tag: 'mth-radio', attrs: { value: 'rc' }, text: 'Release Candidate' },
        { tag: 'mth-radio', attrs: { value: 'canary' }, text: 'Canary' },
      ],
    },
    setup: defaultSetup('mth-radio'),
  },

  'mth-radio-group': {
    attrs: { label: 'Release channel', value: 'stable' },
    children: [
      { tag: 'mth-radio', attrs: { value: 'stable' }, text: 'Stable' },
      { tag: 'mth-radio', attrs: { value: 'rc' }, text: 'Release Candidate' },
      { tag: 'mth-radio', attrs: { value: 'canary' }, text: 'Canary' },
    ],
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-radio-group', ctx),
  },

  'mth-range-slider': {
    attrs: {
      label: 'OKLCH lightness window',
      min: 0,
      max: 100,
      start: 20,
      end: 78,
      'show-value': true,
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-range-slider'),
  },

  'mth-rating': {
    attrs: {
      label: 'Developer experience rating',
      value: '4.5',
      max: 5,
      precision: 0.5,
      clearable: true,
    },
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-rating', ctx),
  },

  'mth-resizable-group': {
    attrs: { orientation: 'horizontal' },
    style: 'inline-size:min(100%,32rem);block-size:12rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)',
    children: [
      {
        tag: 'mth-resizable-panel',
        attrs: { size: 42, 'min-size': 20, 'max-size': 75 },
        children: [
          {
            tag: 'div',
            attrs: { style: 'padding:var(--mth-space-3)' },
            text: 'Explorer Sidebar (42%)',
          },
        ],
      },
      { tag: 'mth-resizable-handle', attrs: { label: 'Resize panels' } },
      {
        tag: 'mth-resizable-panel',
        attrs: { size: 58, 'min-size': 25, 'max-size': 80 },
        children: [
          {
            tag: 'div',
            attrs: { style: 'padding:var(--mth-space-3)' },
            text: 'Component Canvas (58%)',
          },
        ],
      },
    ],
    setup: defaultSetup('mth-resizable-group'),
  },

  'mth-resizable-handle': {
    tree: {
      tag: 'mth-resizable-group',
      attrs: {
        orientation: 'horizontal',
        style:
          'inline-size:min(100%,32rem);block-size:12rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)',
      },
      children: [
        {
          tag: 'mth-resizable-panel',
          attrs: { size: 45, 'min-size': 20 },
          children: [{ tag: 'div', attrs: { style: 'padding:var(--mth-space-3)' }, text: 'Start Pane' }],
        },
        {
          tag: 'mth-resizable-handle',
          attrs: { 'data-preview-target': true, label: 'Drag or press arrow keys' },
        },
        {
          tag: 'mth-resizable-panel',
          attrs: { size: 55, 'min-size': 20 },
          children: [{ tag: 'div', attrs: { style: 'padding:var(--mth-space-3)' }, text: 'End Pane' }],
        },
      ],
    },
    setup: defaultSetup('mth-resizable-handle'),
  },

  'mth-resizable-panel': {
    tree: {
      tag: 'mth-resizable-group',
      attrs: {
        orientation: 'horizontal',
        style:
          'inline-size:min(100%,32rem);block-size:12rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)',
      },
      children: [
        {
          tag: 'mth-resizable-panel',
          attrs: { 'data-preview-target': true, size: 45, 'min-size': 20, collapsible: true },
          children: [
            { tag: 'div', attrs: { style: 'padding:var(--mth-space-3)' }, text: 'Target Resizable Panel (45%)' },
          ],
        },
        { tag: 'mth-resizable-handle', attrs: { label: 'Resize divider' } },
        {
          tag: 'mth-resizable-panel',
          attrs: { size: 55, 'min-size': 20 },
          children: [{ tag: 'div', attrs: { style: 'padding:var(--mth-space-3)' }, text: 'Detail Panel (55%)' }],
        },
      ],
    },
    setup: defaultSetup('mth-resizable-panel'),
  },

  'mth-rrule-editor': {
    attrs: {
      name: 'recurrence',
      label: 'Release cadence',
      value: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TH;COUNT=8',
      dtstart: '2026-11-15',
    },
    style: 'inline-size:min(100%,30rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-rrule-editor', ctx),
  },

  'mth-schema-form': {
    attrs: {
      'submit-label': 'Create Package',
      'show-reset': true,
    },
    style: 'inline-size:min(100%,28rem)',
    props: {
      schema: {
        title: 'Package Manifest',
        description: 'Generated automatically from JSON Schema',
        required: ['name', 'maintainerEmail'],
        properties: {
          name: { type: 'string', title: 'Package name', minLength: 3, placeholder: '@methane-ui/custom' },
          maintainerEmail: { type: 'string', format: 'email', title: 'Maintainer email', placeholder: 'dev@methane.dev' },
          framework: { type: 'string', title: 'Target adapter', enum: ['astro', 'next', 'nuxt', 'sveltekit'] },
          prerelease: { type: 'boolean', title: 'Publish as prerelease', default: false },
        },
      },
      value: { name: '@methane-ui/custom', maintainerEmail: 'team@methane.dev', framework: 'astro' },
    },
    setup: defaultSetup('mth-schema-form'),
  },

  'mth-scroll-area': {
    attrs: { type: 'always', orientation: 'vertical', label: 'Changelog scroll region' },
    style:
      'inline-size:min(100%,26rem);block-size:11rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)',
    children: [
      {
        tag: 'div',
        attrs: { style: 'display:grid;gap:var(--mth-space-2);padding:var(--mth-space-3)' },
        children: METHANE_PACKAGES.map((pkg) => ({
          tag: 'div',
          attrs: { class: 'docs-card' },
          text: pkg.label,
        })),
      },
    ],
    setup: defaultSetup('mth-scroll-area'),
  },

  'mth-search-input': {
    attrs: {
      label: 'Search workspace',
      placeholder: 'Search tokens or components...',
      shortcut: '⌘K',
      clearable: true,
    },
    style: 'inline-size:min(100%,24rem)',
    setup: defaultSetup('mth-search-input'),
  },

  'mth-segmented-control': {
    attrs: {
      name: 'density',
      label: 'UI density',
      value: 'default',
    },
    props: {
      options: [
        { value: 'compact', label: 'Compact' },
        { value: 'default', label: 'Default' },
        { value: 'comfortable', label: 'Comfortable' },
      ],
    },
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-segmented-control', ctx),
  },

  'mth-select': {
    attrs: {
      label: 'SSR Adapter',
      placeholder: 'Choose a framework...',
      clearable: true,
    },
    style: 'inline-size:min(100%,24rem)',
    children: buildOptionChildren(),
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-select', ctx),
  },

  'mth-share-button': {
    attrs: {
      'share-title': 'Methane UI',
      text: 'Spec-first Web Components with OKLCH tokens',
      url: 'https://mahdins.dev/methane/',
      label: 'Share Methane Docs',
      variant: 'outline',
    },
    setup: defaultSetup('mth-share-button'),
  },

  'mth-sidebar-nav': {
    attrs: {
      label: 'Documentation sidebar',
      'active-value': 'tokens',
      collapsible: true,
    },
    style: 'inline-size:min(100%,18rem)',
    children: [{ tag: 'strong', attrs: { slot: 'header' }, text: 'Methane Docs' }],
    props: {
      items: [
        { value: 'quickstart', label: 'Quickstart', href: '#quickstart', group: 'Getting Started' },
        { value: 'tokens', label: 'OKLCH Tokens', href: '#tokens', badge: 'DTCG', group: 'Foundation' },
        { value: 'css', label: 'Logical CSS', href: '#css', group: 'Foundation' },
        { value: 'ssr', label: 'SSR Hydration', href: '#ssr', group: 'Guides' },
      ],
    },
    setup: defaultSetup('mth-sidebar-nav'),
  },

  'mth-signature-pad': {
    attrs: {
      name: 'approval-signature',
      label: 'Release sign-off signature',
      'pen-width': 2,
    },
    style: 'inline-size:min(100%,28rem)',
    setup: defaultSetup('mth-signature-pad'),
  },

  'mth-site-search': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'outline', 'data-demo-open': true },
          text: 'Open Site Search (/)',
        },
        {
          tag: 'mth-site-search',
          attrs: {
            'data-preview-target': true,
            label: 'Search documentation',
            placeholder: 'Search guides, tokens, or components...',
            'register-shortcut': false,
          },
        },
      ],
    },
    props: {
      items: [
        { id: 'doc-tokens', label: 'OKLCH Token Architecture', category: 'Tokens', snippet: 'Perceptual color ramps & modes' },
        { id: 'doc-ssr', label: 'Declarative Shadow DOM SSR', category: 'Guides', snippet: 'Next, Nuxt, Astro, SvelteKit' },
        { id: 'doc-a11y', label: 'Same-Root ARIA Guide', category: 'Accessibility', snippet: 'ElementInternals & roving focus' },
        { id: 'doc-button', label: '<mth-button>', category: 'Components', snippet: 'Primary trigger button' },
      ],
    },
    setup: createTriggerOverlaySetup('mth-site-search', '[data-demo-open]'),
  },

  'mth-skeleton': {
    attrs: { variant: 'text', lines: 3, animated: true },
    style: 'inline-size:min(100%,24rem)',
  },

  'mth-skip-link': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'outline', size: 'sm', 'data-skip-focus': true },
          text: 'Focus Skip Link',
        },
        {
          tag: 'mth-skip-link',
          attrs: { 'data-preview-target': true, href: '#preview-skip-destination' },
          text: 'Skip to preview destination',
        },
        {
          tag: 'div',
          attrs: { id: 'preview-skip-destination', class: 'docs-card', tabindex: '-1' },
          text: 'Skip link destination region',
        },
      ],
    },
    setup: (ctx) => {
      const focusBtn = ctx.canvas.querySelector<HTMLElement>('[data-skip-focus]');
      focusBtn?.addEventListener('click', () => {
        const anchor = ctx.target.shadowRoot?.querySelector('a');
        if (anchor instanceof HTMLElement) {
          anchor.focus();
          ctx.setReadout('Focused <mth-skip-link> anchor in shadow root (press Enter to jump).');
        }
      });
    },
  },

  'mth-slider': {
    attrs: {
      label: 'Token chroma',
      min: 0,
      max: 100,
      value: 55,
      'show-value': true,
    },
    style: 'inline-size:min(100%,22rem)',
    setup: defaultSetup('mth-slider'),
  },

  'mth-sortable': {
    attrs: { orientation: 'vertical', label: 'Pipeline stages' },
    style: 'inline-size:min(100%,24rem)',
    children: [
      { tag: 'div', attrs: { class: 'docs-card', 'data-id': 'tokens' }, text: '1. Compile DTCG Tokens' },
      { tag: 'div', attrs: { class: 'docs-card', 'data-id': 'build' }, text: '2. Build ESM Bundles' },
      { tag: 'div', attrs: { class: 'docs-card', 'data-id': 'e2e' }, text: '3. Run WebKit E2E' },
    ],
    setup: defaultSetup('mth-sortable'),
  },

  'mth-sparkline': {
    attrs: {
      type: 'area',
      variant: 'accent',
      label: 'Weekly bundle size trend',
      'show-points': true,
    },
    style: 'inline-size:min(100%,18rem)',
    props: { values: [18, 22, 19, 25, 29, 27, 34, 38, 36, 42] },
  },

  'mth-speed-dial': {
    attrs: { label: 'Quick actions', direction: 'up', variant: 'primary' },
    style: 'min-block-size:10rem;display:grid;place-items:end center',
    children: [
      { tag: 'mth-icon', attrs: { slot: 'icon', name: 'plus' } },
      { tag: 'button', attrs: { type: 'button', role: 'menuitem', 'data-value': 'token' }, text: 'New Token' },
      { tag: 'button', attrs: { type: 'button', role: 'menuitem', 'data-value': 'spec' }, text: 'New Spec' },
      { tag: 'button', attrs: { type: 'button', role: 'menuitem', 'data-value': 'export' }, text: 'Export CEM' },
    ],
    setup: defaultSetup('mth-speed-dial'),
  },

  'mth-spinner': {
    attrs: { size: 'lg', label: 'Loading component preview' },
  },

  'mth-split-button': {
    attrs: { variant: 'solid', label: 'Deploy Release' },
    children: [
      {
        tag: 'div',
        attrs: { slot: 'menu' },
        children: [
          { tag: 'button', attrs: { type: 'button', 'data-value': 'staging' }, text: 'Deploy Staging' },
          { tag: 'button', attrs: { type: 'button', 'data-value': 'prod' }, text: 'Deploy Production' },
        ],
      },
    ],
    setup: defaultSetup('mth-split-button'),
  },

  'mth-split-pane': {
    attrs: { orientation: 'horizontal', ratio: 45, 'min-ratio': 20, 'max-ratio': 80, label: 'Editor split pane' },
    style: 'inline-size:min(100%,32rem);block-size:11rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)',
    children: [
      { tag: 'div', attrs: { slot: 'start', style: 'padding:var(--mth-space-3)' }, text: 'Source Spec (45%)' },
      { tag: 'div', attrs: { slot: 'end', style: 'padding:var(--mth-space-3)' }, text: 'Live Preview (55%)' },
    ],
    setup: defaultSetup('mth-split-pane'),
  },

  'mth-stat-card': {
    attrs: {
      label: 'Published Packages',
      value: '35',
      format: 'number',
      delta: '+100% OIDC verified',
      trend: 'up',
      hint: 'Sigstore provenance enabled',
      variant: 'elevated',
    },
    style: 'inline-size:min(100%,18rem)',
  },

  'mth-status-indicator': {
    attrs: { status: 'online', pulse: true, size: 'md' },
    text: 'All systems operational',
  },

  'mth-step': {
    tree: {
      tag: 'mth-stepper',
      attrs: { label: 'Setup steps', 'active-step': 1, style: 'inline-size:min(100%,32rem)' },
      children: [
        { tag: 'mth-step', attrs: { value: 'install', label: 'Install', status: 'complete' } },
        {
          tag: 'mth-step',
          attrs: {
            'data-preview-target': true,
            value: 'tokens',
            label: 'Configure Tokens (Target)',
            description: 'OKLCH & density',
            status: 'current',
          },
        },
        { tag: 'mth-step', attrs: { value: 'deploy', label: 'Deploy SSR', status: 'upcoming' } },
      ],
    },
  },

  'mth-stepper': {
    attrs: { label: 'Release workflow', 'active-step': 1, orientation: 'horizontal' },
    style: 'inline-size:min(100%,32rem)',
    props: {
      steps: [
        { value: 'spec', label: 'Author Spec', description: 'Behavior & ARIA', status: 'complete' },
        { value: 'verify', label: 'Conformance', description: 'Chromium & WebKit', status: 'current' },
        { value: 'publish', label: 'Publish', description: 'Sigstore OIDC', status: 'upcoming' },
      ],
    },
    setup: defaultSetup('mth-stepper'),
  },

  'mth-stopwatch': {
    attrs: { 'show-milliseconds': true },
    setup: defaultSetup('mth-stopwatch'),
  },

  'mth-switch': {
    attrs: { name: 'dark-mode', checked: true },
    text: 'Automatic OKLCH dark mode',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-switch', ctx, 'checked'),
  },

  'mth-tab': {
    tree: {
      tag: 'mth-tabs',
      attrs: { value: 'tokens', label: 'Tab preview', style: 'inline-size:min(100%,28rem)' },
      children: [
        { tag: 'mth-tab', attrs: { slot: 'tab', value: 'overview' }, text: 'Overview' },
        {
          tag: 'mth-tab',
          attrs: { 'data-preview-target': true, slot: 'tab', value: 'tokens' },
          text: 'Tokens (Target)',
        },
        { tag: 'mth-tab', attrs: { slot: 'tab', value: 'a11y' }, text: 'Accessibility' },
        { tag: 'mth-tab-panel', attrs: { value: 'overview' }, text: 'Spec-first Web Components.' },
        { tag: 'mth-tab-panel', attrs: { value: 'tokens' }, text: 'Precision Atmospheric OKLCH tokens.' },
        { tag: 'mth-tab-panel', attrs: { value: 'a11y' }, text: 'Same-root ARIA & roving focus.' },
      ],
    },
  },

  'mth-tab-panel': {
    tree: {
      tag: 'mth-tabs',
      attrs: { value: 'overview', label: 'Tab panel preview', style: 'inline-size:min(100%,28rem)' },
      children: [
        { tag: 'mth-tab', attrs: { slot: 'tab', value: 'overview' }, text: 'Overview' },
        { tag: 'mth-tab', attrs: { slot: 'tab', value: 'tokens' }, text: 'Tokens' },
        {
          tag: 'mth-tab-panel',
          attrs: { 'data-preview-target': true, value: 'overview' },
          text: 'Target <mth-tab-panel> rendered inside <mth-tabs> with automatic ARIA tabpanel linkage.',
        },
        { tag: 'mth-tab-panel', attrs: { value: 'tokens' }, text: 'Precision Atmospheric OKLCH tokens.' },
      ],
    },
  },

  'mth-table': {
    attrs: {
      caption: 'Workspace Packages',
      label: 'Workspace Packages',
      striped: true,
      selectable: 'single',
    },
    style: 'inline-size:min(100%,34rem)',
    children: buildTableColumns(),
    props: { rows: TABLE_ROWS },
    setup: defaultSetup('mth-table'),
  },

  'mth-tabs': {
    attrs: { value: 'overview', label: 'Preview tabs' },
    style: 'inline-size:min(100%,30rem)',
    children: buildTabNodes(),
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-tabs', ctx),
  },

  'mth-tag': {
    attrs: {
      variant: 'accent',
      pill: true,
      removable: true,
      interactive: true,
      label: 'Remove OKLCH tag',
    },
    text: 'OKLCH Tokens',
    setup: defaultSetup('mth-tag'),
  },

  'mth-tag-input': {
    attrs: {
      name: 'keywords',
      label: 'Package keywords',
      value: 'web-components,oklch,ssr',
      placeholder: 'Add keyword and press Enter...',
      hint: 'Press Enter or comma to add tags',
    },
    style: 'inline-size:min(100%,26rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-tag-input', ctx),
  },

  'mth-textarea': {
    attrs: {
      label: 'Release notes',
      placeholder: 'Describe architectural changes...',
      hint: 'Supports auto-resize',
      rows: 3,
    },
    style: 'inline-size:min(100%,26rem)',
    setup: defaultSetup('mth-textarea'),
  },

  'mth-time-picker': {
    attrs: {
      name: 'deploy-time',
      label: 'Deployment window',
      value: '14:30',
      'step-minutes': 15,
    },
    style: 'inline-size:min(100%,20rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-time-picker', ctx),
  },

  'mth-timeline': {
    attrs: { orientation: 'vertical', label: 'Release timeline' },
    style: 'inline-size:min(100%,28rem)',
    children: [
      {
        tag: 'mth-timeline-item',
        attrs: { heading: 'Spec Approved', timestamp: '09:30 UTC', variant: 'success' },
        text: 'BehaviorSpec and CEM metadata validated.',
      },
      {
        tag: 'mth-timeline-item',
        attrs: { heading: 'WebKit & Chromium E2E', timestamp: '11:15 UTC', variant: 'accent', active: true },
        text: '121 cross-browser tests passing.',
      },
      {
        tag: 'mth-timeline-item',
        attrs: { heading: 'npm OIDC Publish', timestamp: '15:40 UTC', variant: 'neutral' },
        text: '35 public packages published with provenance.',
      },
    ],
  },

  'mth-timeline-item': {
    tree: {
      tag: 'mth-timeline',
      attrs: { orientation: 'vertical', label: 'Release timeline', style: 'inline-size:min(100%,28rem)' },
      children: [
        {
          tag: 'mth-timeline-item',
          attrs: { heading: 'Spec Approved', timestamp: '09:30 UTC', variant: 'success' },
          text: 'BehaviorSpec validated.',
        },
        {
          tag: 'mth-timeline-item',
          attrs: {
            'data-preview-target': true,
            heading: 'Active Milestone (Target)',
            timestamp: '11:15 UTC',
            variant: 'accent',
            active: true,
          },
          text: 'Target <mth-timeline-item> rendered inside <mth-timeline>.',
        },
      ],
    },
  },

  'mth-timezone-picker': {
    attrs: {
      name: 'timezone',
      label: 'Workspace timezone',
      value: 'UTC',
    },
    style: 'inline-size:min(100%,24rem)',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-timezone-picker', ctx),
  },

  'mth-toast': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-button',
          attrs: { variant: 'solid', 'data-demo-open': true },
          text: 'Show Live Toast',
        },
        {
          tag: 'mth-toast',
          attrs: {
            'data-preview-target': true,
            variant: 'success',
            heading: 'Changes Published',
            message: 'All component specs synced to registry.',
            placement: 'bottom-end',
            closable: true,
            duration: 5000,
          },
        },
      ],
    },
    setup: createTriggerOverlaySetup('mth-toast', '[data-demo-open]'),
  },

  'mth-toc': {
    attrs: { heading: 'On This Page', 'active-id': 'tokens', label: 'Table of contents' },
    style: 'inline-size:min(100%,20rem)',
    props: {
      items: [
        { id: 'overview', label: 'Overview', level: 2, href: '#overview' },
        { id: 'tokens', label: 'OKLCH Tokens', level: 2, href: '#tokens' },
        { id: 'contrast', label: 'Forced Colors', level: 3, href: '#contrast' },
        { id: 'ssr', label: 'Declarative Shadow DOM', level: 2, href: '#ssr' },
      ],
    },
    setup: defaultSetup('mth-toc'),
  },

  'mth-toggle-button': {
    attrs: { variant: 'outline', value: 'pin', pressed: true },
    text: 'Pin Workspace',
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-toggle-button', ctx, 'pressed'),
  },

  'mth-toggle-group': {
    attrs: {
      name: 'formatting',
      label: 'Formatting options',
      multiple: true,
      value: 'bold',
    },
    props: {
      options: [
        { value: 'bold', label: 'Bold' },
        { value: 'italic', label: 'Italic' },
        { value: 'code', label: 'Monospace' },
      ],
    },
    setup: (ctx) => wireValueControlSync(ctx.target, 'mth-toggle-group', ctx),
  },

  'mth-tooltip': {
    attrs: { content: 'Keyboard shortcut: Cmd+K', placement: 'top' },
    children: [
      { tag: 'mth-button', attrs: { variant: 'outline' }, text: 'Hover or focus trigger' },
    ],
    setup: defaultSetup('mth-tooltip'),
  },

  'mth-tour': {
    tree: {
      tag: 'mth-stack',
      attrs: { 'data-gap': '3', style: 'align-items:center' },
      children: [
        {
          tag: 'mth-flex',
          attrs: { 'data-gap': '2' },
          children: [
            {
              tag: 'mth-button',
              attrs: { id: 'tour-step-one', variant: 'solid', 'data-demo-open': true },
              text: 'Start Guided Tour',
            },
            {
              tag: 'mth-button',
              attrs: { id: 'tour-step-two', variant: 'outline' },
              text: 'Token Step Target',
            },
          ],
        },
        {
          tag: 'mth-tour',
          attrs: { 'data-preview-target': true, label: 'Methane UI Tour' },
          children: [
            {
              tag: 'mth-tour-step',
              attrs: { 'step-id': 'welcome', target: '#tour-step-one', heading: '1. Interactive Stage', placement: 'bottom' },
              text: 'Every component renders live with real Shadow DOM & keyboard support.',
            },
            {
              tag: 'mth-tour-step',
              attrs: { 'step-id': 'tokens', target: '#tour-step-two', heading: '2. Adaptive Themes', placement: 'bottom' },
              text: 'Switch light, dark, high-contrast, and RTL direction right in the toolbar.',
            },
          ],
        },
      ],
    },
    setup: createTriggerOverlaySetup('mth-tour', '[data-demo-open]'),
  },

  'mth-tour-step': {
    tree: {
      tag: 'mth-tour-step',
      attrs: {
        'data-preview-target': true,
        'step-id': 'welcome',
        heading: '1. Interactive Stage',
        placement: 'bottom',
        active: true,
        style: 'inline-size:min(100%,24rem)',
      },
      text: 'Declarative step definition used inside <mth-tour> with anchor target and media slot.',
    },
  },

  'mth-transfer-list': {
    attrs: {
      name: 'enabled-packages',
      label: 'Enabled workspace packages',
      'source-title': 'Available',
      'target-title': 'Active',
      searchable: true,
      value: '@methane-ui/tokens,@methane-ui/ui',
    },
    style: 'inline-size:min(100%,34rem)',
    props: {
      options: [
        { key: '@methane-ui/tokens', label: '@methane-ui/tokens', description: 'OKLCH DTCG tokens' },
        { key: '@methane-ui/css', label: '@methane-ui/css', description: 'Logical CSS classes' },
        { key: '@methane-ui/primitives', label: '@methane-ui/primitives', description: 'Behavior controllers' },
        { key: '@methane-ui/ui', label: '@methane-ui/ui', description: '167 core components' },
        { key: '@methane-ui/ssr', label: '@methane-ui/ssr', description: 'DSD server renderer' },
      ],
    },
    setup: defaultSetup('mth-transfer-list'),
  },

  'mth-tree': {
    attrs: {
      'selection-mode': 'single',
      label: 'Monorepo explorer',
      value: 'button',
    },
    style: 'inline-size:min(100%,24rem)',
    props: {
      expandedValues: ['packages', 'ui'],
      items: [
        {
          id: 'packages',
          value: 'packages',
          label: 'packages',
          children: [
            { id: 'core', value: 'core', label: 'core' },
            {
              id: 'ui',
              value: 'ui',
              label: 'ui',
              children: [
                { id: 'button', value: 'button', label: 'button.ts' },
                { id: 'dialog', value: 'dialog', label: 'dialog.ts' },
              ],
            },
          ],
        },
        { id: 'apps', value: 'apps', label: 'apps' },
      ],
    },
    setup: defaultSetup('mth-tree'),
  },

  'mth-tree-item': {
    tree: {
      tag: 'mth-tree',
      attrs: { 'selection-mode': 'single', label: 'Monorepo explorer', style: 'inline-size:min(100%,24rem)' },
      children: [
        {
          tag: 'mth-tree-item',
          attrs: { value: 'packages', label: 'packages', expanded: true },
          children: [
            {
              tag: 'mth-tree-item',
              attrs: {
                'data-preview-target': true,
                value: 'button',
                label: 'button.ts (Target)',
                selected: true,
              },
            },
            { tag: 'mth-tree-item', attrs: { value: 'dialog', label: 'dialog.ts' } },
          ],
        },
      ],
    },
    setup: defaultSetup('mth-tree-item'),
  },

  'mth-tree-nav': {
    attrs: { label: 'Documentation tree', 'active-value': 'tokens' },
    style: 'inline-size:min(100%,20rem)',
    children: [{ tag: 'strong', attrs: { slot: 'header' }, text: 'Documentation' }],
    props: {
      expandedValues: ['foundations'],
      items: [
        {
          value: 'foundations',
          label: 'Foundations',
          children: [
            { value: 'tokens', label: 'OKLCH Tokens', href: '#tokens', badge: 'New' },
            { value: 'css', label: 'Logical CSS', href: '#css' },
          ],
        },
        {
          value: 'guides',
          label: 'Guides',
          children: [
            { value: 'ssr', label: 'SSR Hydration', href: '#ssr' },
            { value: 'theming', label: 'Theming', href: '#theming' },
          ],
        },
      ],
    },
    setup: defaultSetup('mth-tree-nav'),
  },

  'mth-upload-progress': {
    attrs: {
      filename: 'methane-ui-0.1.0.tgz',
      value: 72,
      size: 482_304,
      status: 'uploading',
      pausable: true,
      cancellable: true,
    },
    style: 'inline-size:min(100%,28rem)',
    setup: defaultSetup('mth-upload-progress'),
  },

  'mth-video-player': {
    attrs: {
      label: 'Methane UI walkthrough video',
      preload: 'metadata',
      'playback-rate': 1,
    },
    style: 'inline-size:min(100%,30rem)',
    setup: defaultSetup('mth-video-player'),
  },

  'mth-virtual-scroller': {
    attrs: {
      label: 'Virtual component registry',
      'estimate-size': 40,
      'viewport-height': 220,
      overscan: 4,
    },
    style: 'inline-size:min(100%,26rem);border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)',
    props: {
      items: Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        label: `Row #${i + 1} · @methane-ui/component-${i + 1}`,
      })),
      renderItem: (item: { readonly label: string }) => item.label,
    },
    setup: defaultSetup('mth-virtual-scroller'),
  },

  'mth-visually-hidden': {
    tree: {
      tag: 'mth-button',
      attrs: { variant: 'outline', 'data-vh-trigger': true },
      children: [
        '★ Bookmark',
        {
          tag: 'mth-visually-hidden',
          attrs: { 'data-preview-target': true },
          text: 'Save Methane component documentation bookmark',
        },
      ],
    },
    setup: (ctx) => {
      const trigger = ctx.canvas.querySelector<HTMLElement>('[data-vh-trigger]');
      trigger?.addEventListener('click', () => {
        ctx.setReadout(
          `Screen-reader text inside <mth-visually-hidden>: "${ctx.target.textContent?.trim() ?? ''}"`,
        );
      });
    },
  },

  'mth-zoom-pan': {
    attrs: {
      scale: 1,
      'min-scale': 0.5,
      'max-scale': 3,
      step: 0.25,
      'show-controls': true,
      label: 'Token diagram viewport',
    },
    style: 'inline-size:min(100%,28rem);block-size:13rem',
    children: [
      {
        tag: 'mth-card',
        attrs: { variant: 'elevated', style: 'inline-size:16rem' },
        children: [
          { tag: 'strong', attrs: { slot: 'header' }, text: 'Zoomable Diagram' },
          'Use +/- controls, scroll wheel, or drag to pan.',
        ],
      },
    ],
    setup: defaultSetup('mth-zoom-pan'),
  },
};
