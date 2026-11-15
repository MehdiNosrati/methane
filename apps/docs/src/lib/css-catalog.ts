import {
  MTH_CSS_PRIMITIVES,
  MTH_LAYOUT_PRIMITIVES,
  MTH_MARKETING_PRIMITIVES,
  MTH_TYPOGRAPHY_PRIMITIVES,
  MTH_UNUPGRADED_TAG_PRIMITIVES,
} from '@methane-ui/css';

export interface CssPrimitiveDocEntry {
  readonly id: (typeof MTH_CSS_PRIMITIVES)[number];
  readonly title: string;
  readonly category: 'Layout' | 'Typography & Surface' | 'Content & Marketing';
  readonly subpath: '@methane-ui/css/layout.css' | '@methane-ui/css/prose.css' | '@methane-ui/css/marketing.css';
  readonly selector: string;
  readonly hasCustomTag: boolean;
  readonly description: string;
  readonly whenNotToUse: string;
  readonly previewHtml: string;
  readonly snippets: {
    readonly html: string;
    readonly react: string;
    readonly vue: string;
    readonly angular: string;
    readonly svelte: string;
  };
}

interface RawSpec {
  readonly id: (typeof MTH_CSS_PRIMITIVES)[number];
  readonly title: string;
  readonly description: string;
  readonly whenNotToUse: string;
  readonly previewHtml: string;
  readonly htmlSnippet: string;
}

const UNUPGRADED_SET = new Set<string>(MTH_UNUPGRADED_TAG_PRIMITIVES);
const LAYOUT_SET = new Set<string>(MTH_LAYOUT_PRIMITIVES);
const TYPO_SET = new Set<string>(MTH_TYPOGRAPHY_PRIMITIVES);
const MARKETING_SET = new Set<string>(MTH_MARKETING_PRIMITIVES);

function makeFrameworkSnippets(htmlSnippet: string, subpath: string) {
  const reactJsx = htmlSnippet.replaceAll('class=', 'className=');
  return {
    html: `<link rel="stylesheet" href="${subpath}" />\n${htmlSnippet}`,
    react: `import '${subpath}';\n\nexport function Example() {\n  return (\n${reactJsx
      .split('\n')
      .map((l) => `    ${l}`)
      .join('\n')}\n  );\n}`,
    vue: `<script setup lang="ts">\nimport '${subpath}';\n</script>\n\n<template>\n${htmlSnippet
      .split('\n')
      .map((l) => `  ${l}`)
      .join('\n')}\n</template>`,
    angular: `import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';\n// styles.css: @import '${subpath}';\n@Component({\n  standalone: true,\n  schemas: [CUSTOM_ELEMENTS_SCHEMA],\n  template: \`\n${htmlSnippet
      .split('\n')
      .map((l) => `    ${l}`)
      .join('\n')}\n  \`,\n})\nexport class ExampleComponent {}`,
    svelte: `<script lang="ts">\n  import '${subpath}';\n</script>\n\n${htmlSnippet}`,
  };
}

const RAW_ENTRIES: ReadonlyArray<RawSpec> = [
  {
    id: 'mth-stack',
    title: 'Stack',
    description: 'Vertical or horizontal flex stack with token-driven gap, alignment, and justification.',
    whenNotToUse:
      'Do not use for 2D grid tracks or asymmetric dashboards; use .mth-grid or .mth-bento-grid instead.',
    previewHtml: `<mth-stack data-gap="2" style="padding:0.75rem;border:1px dashed var(--mth-color-border-strong);border-radius:var(--mth-radius-md)">
  <div style="padding:0.5rem;background:var(--mth-color-accent-subtle);border-radius:var(--mth-radius-sm)">Item A</div>
  <div style="padding:0.5rem;background:var(--mth-color-accent-subtle);border-radius:var(--mth-radius-sm)">Item B</div>
</mth-stack>`,
    htmlSnippet: `<mth-stack data-gap="4">\n  <div>First</div>\n  <div>Second</div>\n</mth-stack>`,
  },
  {
    id: 'mth-grid',
    title: 'Grid',
    description: 'Auto-fit responsive CSS Grid with explicit column presets and subgrid row alignment.',
    whenNotToUse:
      'Do not use when you need drag-and-drop column resizing or virtualized scrolling; use <mth-table> or @methane-ui/datagrid.',
    previewHtml: `<mth-grid data-columns="3" data-gap="2">
  <div style="padding:0.5rem;background:var(--mth-color-bg-subtle);border-radius:var(--mth-radius-sm)">1</div>
  <div style="padding:0.5rem;background:var(--mth-color-bg-subtle);border-radius:var(--mth-radius-sm)">2</div>
  <div style="padding:0.5rem;background:var(--mth-color-bg-subtle);border-radius:var(--mth-radius-sm)">3</div>
</mth-grid>`,
    htmlSnippet: `<mth-grid data-columns="3" data-gap="4">\n  <div>Cell 1</div>\n  <div>Cell 2</div>\n  <div>Cell 3</div>\n</mth-grid>`,
  },
  {
    id: 'mth-flex',
    title: 'Flex',
    description: 'Wrapping inline cluster or row layout for toolbars, badges, and action groups.',
    whenNotToUse:
      'Do not use for keyboard-roving toolbar navigation; pair with <mth-button-group> when arrow-key roving focus is required.',
    previewHtml: `<mth-flex data-gap="2" data-justify="between" style="padding:0.5rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)">
  <span>Cluster Start</span>
  <span>Cluster End</span>
</mth-flex>`,
    htmlSnippet: `<mth-flex data-gap="3" data-justify="between">\n  <span>Title</span>\n  <button type="button">Action</button>\n</mth-flex>`,
  },
  {
    id: 'mth-container',
    title: 'Container',
    description: 'Centered inline-size container establishing container-type: inline-size for child queries.',
    whenNotToUse:
      'Do not nest multiple .mth-container elements with inline padding unless you explicitly reset --mth-container-padding.',
    previewHtml: `<mth-container data-size="sm" style="background:var(--mth-color-bg-subtle);padding-block:0.5rem;border-radius:var(--mth-radius-sm)">Centered container (max 40rem)</mth-container>`,
    htmlSnippet: `<mth-container data-size="lg">\n  <p>Content bounded to 75rem.</p>\n</mth-container>`,
  },
  {
    id: 'mth-aspect-ratio',
    title: 'Aspect Ratio',
    description: 'Intrinsic aspect-ratio frame (1/1, 4/3, 16/9, 21/9) sizing child media cleanly.',
    whenNotToUse:
      'Do not use for interactive zoom/pan or cropping workflows; use <mth-image-cropper> or <mth-zoom-pan>.',
    previewHtml: `<div class="mth-aspect-ratio" data-ratio="21/9" style="max-inline-size:16rem;background:var(--mth-color-accent-subtle);border-radius:var(--mth-radius-md);display:grid;place-items:center;font-size:var(--mth-font-size-xs)">21:9 Frame</div>`,
    htmlSnippet: `<div class="mth-aspect-ratio" data-ratio="16/9">\n  <img src="/poster.jpg" alt="Preview" />\n</div>`,
  },
  {
    id: 'mth-sticky',
    title: 'Sticky',
    description: 'Logical inset-block-start / inset-block-end sticky positioning using --mth-z-index-sticky.',
    whenNotToUse:
      'Do not use for modal dialogs, drawers, or popovers that require top-layer Escape handling; use <mth-dialog> or <mth-popover>.',
    previewHtml: `<div class="mth-sticky" style="padding:0.5rem;background:var(--mth-color-surface-raised);border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-sm)">Sticky bar (inset-block-start: 0)</div>`,
    htmlSnippet: `<header class="mth-sticky">\n  <nav>Sticky header</nav>\n</header>`,
  },
  {
    id: 'mth-divider',
    title: 'Divider',
    description: 'Horizontal or vertical hairline separator with optional centered inline label.',
    whenNotToUse:
      'Do not use inside a Shadow DOM listbox or menu where an explicit semantic <hr> / role="separator" item is managed by ListboxController.',
    previewHtml: `<div class="mth-divider">OR</div>`,
    htmlSnippet: `<div class="mth-divider" role="separator">OR</div>`,
  },
  {
    id: 'mth-spacer',
    title: 'Spacer',
    description: 'Flexible or token-sized empty spacer for flex and stack layouts.',
    whenNotToUse:
      'Do not use spacers for uniform sibling gaps; set data-gap on .mth-stack or .mth-flex instead.',
    previewHtml: `<mth-flex style="border:1px dashed var(--mth-color-border);padding:0.5rem"><span>Left</span><mth-spacer></mth-spacer><span>Right</span></mth-flex>`,
    htmlSnippet: `<mth-flex>\n  <span>Brand</span>\n  <mth-spacer></mth-spacer>\n  <a href="/login">Sign in</a>\n</mth-flex>`,
  },
  {
    id: 'mth-app-shell',
    title: 'App Shell',
    description: 'Container-responsive 5-region application shell (header, sidebar, main, aside, footer).',
    whenNotToUse:
      'Do not use when the user needs drag-resizable split panes; use <mth-split-pane> or <mth-resizable-group>.',
    previewHtml: `<div class="mth-app-shell" style="min-block-size:9rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-md)">
  <div class="mth-app-shell-header" style="padding:0.35rem 0.75rem">Header</div>
  <div class="mth-app-shell-sidebar" style="padding:0.35rem 0.75rem">Sidebar</div>
  <div class="mth-app-shell-main" style="padding:0.35rem 0.75rem">Main</div>
</div>`,
    htmlSnippet: `<div class="mth-app-shell">\n  <header class="mth-app-shell-header">Header</header>\n  <nav class="mth-app-shell-sidebar">Nav</nav>\n  <main class="mth-app-shell-main">Content</main>\n  <footer class="mth-app-shell-footer">Footer</footer>\n</div>`,
  },
  {
    id: 'mth-sidebar-layout',
    title: 'Sidebar Layout',
    description: 'Intrinsic wrapping sidebar + fluid main panel that collapses without media queries.',
    whenNotToUse:
      'Do not use for mobile slide-over navigation drawers; pair with <mth-drawer> for off-canvas menus.',
    previewHtml: `<div class="mth-sidebar-layout" style="--mth-sidebar-width:9rem">
  <div style="padding:0.5rem;background:var(--mth-color-bg-subtle);border-radius:var(--mth-radius-sm)">Sidebar</div>
  <div style="padding:0.5rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-sm)">Main Content</div>
</div>`,
    htmlSnippet: `<div class="mth-sidebar-layout">\n  <aside>Filters</aside>\n  <section>Results</section>\n</div>`,
  },
  {
    id: 'mth-bento-grid',
    title: 'Bento Grid',
    description: 'Dense asymmetric CSS Grid with container-responsive span attributes and surface cards.',
    whenNotToUse:
      'Do not use for variable-height Pinterest masonry; use <mth-masonry> when strict column packing is required.',
    previewHtml: `<div class="mth-bento-grid" style="--mth-bento-min:8rem;--mth-bento-row:3.5rem">
  <div class="mth-bento-item" data-span="2">Featured Cell</div>
  <div class="mth-bento-item">Cell</div>
</div>`,
    htmlSnippet: `<div class="mth-bento-grid">\n  <article class="mth-bento-item" data-span="2">Highlight</article>\n  <article class="mth-bento-item">Metric</article>\n</div>`,
  },
  {
    id: 'mth-prose',
    title: 'Prose',
    description: 'Long-form editorial typography rhythm for headings, lists, blockquotes, code, and tables.',
    whenNotToUse:
      'Do not inject untrusted HTML into .mth-prose without sanitizing first via @methane-ui/sanitize.',
    previewHtml: `<div class="mth-prose" style="font-size:var(--mth-font-size-sm)">
  <p>Clean editorial rhythm with <code>inline code</code> and <strong>logical spacing</strong>.</p>
</div>`,
    htmlSnippet: `<article class="mth-prose">\n  <h1>Article Title</h1>\n  <p>Readable 65ch measure with logical spacing.</p>\n</article>`,
  },
  {
    id: 'mth-dl',
    title: 'Description List',
    description: 'Container-responsive key-value <dl> with stacked and bordered variants.',
    whenNotToUse:
      'Do not use for sortable or selectable multi-column datasets; use <mth-table> or @methane-ui/datagrid.',
    previewHtml: `<dl class="mth-dl" data-variant="bordered">
  <dt>License</dt><dd>MIT</dd>
  <dt>JS Runtime</dt><dd>0 bytes</dd>
</dl>`,
    htmlSnippet: `<dl class="mth-dl" data-variant="bordered">\n  <dt>Status</dt>\n  <dd>Operational</dd>\n</dl>`,
  },
  {
    id: 'mth-hero',
    title: 'Hero',
    description: 'Container-responsive marketing hero supporting centered and split layouts.',
    whenNotToUse:
      'Do not use inside dense admin dashboards; reserve .mth-hero for landing and product pages.',
    previewHtml: `<section class="mth-hero" style="padding-block:1rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-lg)">
  <div class="mth-hero-content">
    <span class="mth-hero-eyebrow">Pure CSS Hero</span>
    <h3 class="mth-hero-title" style="font-size:var(--mth-font-size-xl)">Zero-JS Hero Block</h3>
    <p class="mth-hero-lead" style="font-size:var(--mth-font-size-sm)">Instant SSR with container-query scale.</p>
  </div>
</section>`,
    htmlSnippet: `<section class="mth-hero" data-align="center">\n  <div class="mth-hero-content">\n    <span class="mth-hero-eyebrow">Methane UI</span>\n    <h1 class="mth-hero-title">Build Fast</h1>\n    <p class="mth-hero-lead">Pure CSS layouts and typography.</p>\n  </div>\n</section>`,
  },
  {
    id: 'mth-feature-grid',
    title: 'Feature Grid',
    description: 'Auto-fit grid of feature cards with semantic icon tiles and forced-colors safety.',
    whenNotToUse:
      'Do not use for interactive selectable option cards in forms; use <mth-radio-group> or <mth-toggle-group>.',
    previewHtml: `<div class="mth-feature-grid" style="--mth-feature-min:10rem">
  <div class="mth-feature-card" style="padding:0.75rem"><span class="mth-feature-icon">★</span><strong>Zero FOUC</strong></div>
  <div class="mth-feature-card" style="padding:0.75rem"><span class="mth-feature-icon">⚡</span><strong>Logical CSS</strong></div>
</div>`,
    htmlSnippet: `<div class="mth-feature-grid">\n  <article class="mth-feature-card">\n    <span class="mth-feature-icon">★</span>\n    <h3>Accessible</h3>\n    <p>Same-root ARIA & forced-colors safe.</p>\n  </article>\n</div>`,
  },
  {
    id: 'mth-testimonial',
    title: 'Testimonial',
    description: 'Accessible <figure> quote block with logical inline-start accent border and attribution.',
    whenNotToUse:
      'Do not use for live interactive chat/comment threads; use @methane-ui/chat <mth-chat-thread>.',
    previewHtml: `<figure class="mth-testimonial" style="padding:0.75rem">
  <blockquote>“Zero hydration overhead on static content.”</blockquote>
  <figcaption class="mth-testimonial-author">— Platform Team</figcaption>
</figure>`,
    htmlSnippet: `<figure class="mth-testimonial">\n  <blockquote>“Cleanest SSR story we have shipped.”</blockquote>\n  <figcaption class="mth-testimonial-author">— Engineering Lead</figcaption>\n</figure>`,
  },
  {
    id: 'mth-logo-cloud',
    title: 'Logo Cloud',
    description: 'Uniform partner logo grid with smooth hover emphasis and reduced-motion/forced-colors support.',
    whenNotToUse:
      'Do not use for interactive image carousels; use <mth-carousel> when pagination controls are needed.',
    previewHtml: `<div class="mth-logo-cloud" style="padding-block:0.5rem">
  <span>Acme</span><span>Globex</span><span>Initech</span>
</div>`,
    htmlSnippet: `<div class="mth-logo-cloud">\n  <img src="/logo-a.svg" alt="Partner A" />\n  <img src="/logo-b.svg" alt="Partner B" />\n</div>`,
  },
  {
    id: 'mth-footer',
    title: 'Footer',
    description: 'Multi-column site footer with brand column, link lists, and bottom legal bar.',
    whenNotToUse:
      'Do not use as a sticky mobile bottom tab bar; use <mth-bottom-nav> for app navigation.',
    previewHtml: `<footer class="mth-footer" style="padding-block:0.75rem;border-radius:var(--mth-radius-md)">
  <div class="mth-footer-bottom" style="margin-block-start:0;padding-block-start:0;border-block-start:0">
    <span>© Methane UI</span><span>MIT License</span>
  </div>
</footer>`,
    htmlSnippet: `<footer class="mth-footer">\n  <div class="mth-footer-grid">\n    <div class="mth-footer-brand">Methane</div>\n    <ul class="mth-footer-links"><li><a href="/docs">Docs</a></li></ul>\n  </div>\n</footer>`,
  },
  {
    id: 'mth-faq',
    title: 'FAQ Accordion',
    description: 'Progressive zero-JS exclusive accordion powered by native <details name="...">.',
    whenNotToUse:
      'Do not use when programmatic expand-all, custom ARIA tree/accordion keyboard arrow navigation, or form state is required; use <mth-accordion>.',
    previewHtml: `<div class="mth-faq">
  <details name="preview-faq" open>
    <summary>Does .mth-faq require JavaScript?</summary>
    <p>No — native &lt;details name="..."&gt; handles exclusive toggling natively.</p>
  </details>
  <details name="preview-faq">
    <summary>Is it forced-colors safe?</summary>
    <p>Yes — uses Canvas, CanvasText, and ButtonBorder in high-contrast mode.</p>
  </details>
</div>`,
    htmlSnippet: `<div class="mth-faq">\n  <details name="faq">\n    <summary>Question 1</summary>\n    <p>Answer 1</p>\n  </details>\n  <details name="faq">\n    <summary>Question 2</summary>\n    <p>Answer 2</p>\n  </details>\n</div>`,
  },
  {
    id: 'mth-article-layout',
    title: 'Article Layout',
    description: 'Two-column editorial grid with sticky table-of-contents aside at wide container widths.',
    whenNotToUse:
      'Do not use for multi-pane IDE/workspace layouts; use .mth-app-shell or <mth-split-pane>.',
    previewHtml: `<div class="mth-article-layout" style="gap:0.75rem">
  <div class="mth-article-body" style="padding:0.5rem;border:1px solid var(--mth-color-border);border-radius:var(--mth-radius-sm)">Article Body</div>
  <aside class="mth-article-aside" style="padding:0.5rem">Sticky TOC</aside>
</div>`,
    htmlSnippet: `<div class="mth-article-layout">\n  <header class="mth-article-header"><h1>Title</h1></header>\n  <article class="mth-article-body mth-prose"><p>Body</p></article>\n  <aside class="mth-article-aside">On this page</aside>\n</div>`,
  },
  {
    id: 'mth-pricing-table',
    title: 'Pricing Table',
    description: 'Responsive pricing tier grid with featured tier highlight and forced-colors outline.',
    whenNotToUse:
      'Do not use for interactive plan-selection forms or billing checkout steps; use @methane-ui/commerce <mth-plan-picker>.',
    previewHtml: `<div class="mth-pricing-table" style="--mth-pricing-min:10rem;gap:0.75rem">
  <div class="mth-pricing-tier" style="padding:0.75rem"><strong>Free</strong><div class="mth-pricing-price" style="font-size:var(--mth-font-size-xl)">$0</div></div>
  <div class="mth-pricing-tier mth-pricing-featured" style="padding:0.75rem"><strong>Pro</strong><div class="mth-pricing-price" style="font-size:var(--mth-font-size-xl)">$29</div></div>
</div>`,
    htmlSnippet: `<div class="mth-pricing-table">\n  <section class="mth-pricing-tier">...</section>\n  <section class="mth-pricing-tier mth-pricing-featured">...</section>\n</div>`,
  },
  {
    id: 'mth-cta',
    title: 'Call to Action',
    description: 'High-impact call-to-action banner with subtle and accent variants.',
    whenNotToUse:
      'Do not use for dismissible system alerts or inline validation errors; use <mth-alert> or <mth-callout>.',
    previewHtml: `<div class="mth-cta" data-variant="accent" style="padding:0.75rem 1rem">
  <strong>Ready to ship Methane?</strong>
  <span class="mth-cta-actions">Get Started →</span>
</div>`,
    htmlSnippet: `<section class="mth-cta" data-variant="accent">\n  <div><h2>Start building</h2><p>Zero runtime CSS primitives.</p></div>\n  <div class="mth-cta-actions"><a href="/quickstart">Get Started</a></div>\n</section>`,
  },
  {
    id: 'mth-announcement-bar',
    title: 'Announcement Bar',
    description: 'Compact top-of-page announcement strip with accent and warning variants.',
    whenNotToUse:
      'Do not use for transient notifications or dismissible banners with ARIA live announcements; use <mth-toast> or <mth-banner>.',
    previewHtml: `<div class="mth-announcement-bar" style="border-radius:var(--mth-radius-sm)">New: Methane v1.0 Foundation is live!</div>`,
    htmlSnippet: `<div class="mth-announcement-bar" data-variant="accent">\n  <span>Methane v1.0 released — read the guide.</span>\n</div>`,
  },
];

export const CSS_PRIMITIVE_CATALOG: ReadonlyArray<CssPrimitiveDocEntry> = RAW_ENTRIES.map((raw) => {
  const category = LAYOUT_SET.has(raw.id)
    ? 'Layout'
    : TYPO_SET.has(raw.id)
      ? 'Typography & Surface'
      : MARKETING_SET.has(raw.id)
        ? 'Content & Marketing'
        : 'Layout';

  const subpath =
    category === 'Layout'
      ? '@methane-ui/css/layout.css'
      : category === 'Typography & Surface'
        ? '@methane-ui/css/prose.css'
        : '@methane-ui/css/marketing.css';

  const hasCustomTag = UNUPGRADED_SET.has(raw.id);

  return {
    id: raw.id,
    title: raw.title,
    category,
    subpath,
    selector: hasCustomTag ? `.${raw.id}, ${raw.id}` : `.${raw.id}`,
    hasCustomTag,
    description: raw.description,
    whenNotToUse: raw.whenNotToUse,
    previewHtml: raw.previewHtml,
    snippets: makeFrameworkSnippets(raw.htmlSnippet, subpath),
  };
});
