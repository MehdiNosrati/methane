# Methane Component & Layout Reference

## Pure CSS Layouts & Form Classes (`@methane/css`)

Import `@methane/css/index.css` for everything, or granular stylesheets (`layers.css`, `reset.css`, `defined-guard.css`, `layout.css`, `prose.css`, `marketing.css`, `forms.css`).

- **Layout (`layout.css`)**: `.mth-stack` / `<mth-stack>`, `.mth-grid` / `<mth-grid>`, `.mth-flex` / `<mth-flex>`, `.mth-container` / `<mth-container>`, `.mth-aspect-ratio`, `.mth-sticky`, `.mth-divider`, `.mth-spacer` / `<mth-spacer>`, `.mth-app-shell` (`.mth-app-shell-header`, `.mth-app-shell-sidebar`, `.mth-app-shell-main`, `.mth-app-shell-footer`), `.mth-sidebar-layout`, `.mth-bento-grid`.
- **Typography (`prose.css`)**: `.mth-prose`, `.mth-dl`.
- **Marketing (`marketing.css`)**: `.mth-hero`, `.mth-feature-grid`, `.mth-testimonial`, `.mth-logo-cloud`, `.mth-footer`, `.mth-faq`, `.mth-article-layout`, `.mth-pricing-table`, `.mth-cta`, `.mth-announcement-bar`.
- **Native Form Controls (`forms.css`)**: `.mth-btn` (with `.mth-btn-soft`, `.mth-btn-outline`, `.mth-btn-ghost`, `.mth-btn-danger`), `.mth-input`, `.mth-select`.

## Core UI (`@methane/ui/<slug>`)

Import individual subpaths (e.g. `@methane/ui/button`, `@methane/ui/dialog`) instead of the `@methane/ui` barrel in production apps:

- **Actions**: `mth-button`, `mth-button-group`, `mth-copy-button`, `mth-fab`, `mth-icon-button`, `mth-share-button`, `mth-speed-dial`, `mth-split-button`, `mth-toggle-button`, `mth-toggle-group`
- **Forms & Inputs**: `mth-checkbox`, `mth-color-picker`, `mth-combobox`, `mth-creatable-select`, `mth-credit-card-input`, `mth-currency-input`, `mth-dropzone`, `mth-field`, `mth-fieldset`, `mth-file-upload`, `mth-form`, `mth-form-repeater`, `mth-form-wizard`, `mth-inline-edit`, `mth-input`, `mth-masked-input`, `mth-multi-select`, `mth-number-input`, `mth-option`, `mth-option-group`, `mth-otp-input`, `mth-password-input`, `mth-phone-input`, `mth-radio`, `mth-radio-group`, `mth-range-slider`, `mth-rating`, `mth-schema-form`, `mth-search-input`, `mth-segmented-control`, `mth-select`, `mth-slider`, `mth-switch`, `mth-tag-input`, `mth-textarea`, `mth-transfer-list`
- **Date & Time**: `mth-calendar`, `mth-date-picker`, `mth-date-range-calendar`, `mth-date-range-picker`, `mth-datetime-picker`, `mth-month-picker`, `mth-time-picker`, `mth-timezone-picker`
- **Navigation**: `mth-accordion`, `mth-accordion-item`, `mth-bottom-nav`, `mth-breadcrumbs`, `mth-breadcrumb-item`, `mth-link`, `mth-mega-menu`, `mth-menubar`, `mth-navbar`, `mth-pagination`, `mth-resizable-group`, `mth-scroll-area`, `mth-sidebar-nav`, `mth-split-pane`, `mth-stepper`, `mth-tabs`, `mth-tab`, `mth-tab-panel`, `mth-toc`, `mth-tree`, `mth-tree-item`, `mth-tree-nav`
- **Overlays**: `mth-bottom-sheet`, `mth-coachmark`, `mth-command-palette`, `mth-context-menu`, `mth-dialog`, `mth-drawer`, `mth-dropdown-menu`, `mth-floating-panel`, `mth-hover-card`, `mth-lightbox`, `mth-menu-item`, `mth-popover`, `mth-tooltip`, `mth-tour`
- **Data & Feedback**: `mth-alert`, `mth-avatar`, `mth-badge`, `mth-banner`, `mth-callout`, `mth-card`, `mth-carousel`, `mth-code-tabs`, `mth-empty-state`, `mth-error-summary`, `mth-icon`, `mth-image`, `mth-key-value`, `mth-list`, `mth-progress-bar`, `mth-progress-ring`, `mth-skeleton`, `mth-spinner`, `mth-stat-card`, `mth-table`, `mth-tag`, `mth-timeline`, `mth-toast`

## Domain Kits (`@methane/{ai,auth,admin,chat,commerce}`)

- `@methane/ai`: `mth-prompt-input`, `mth-ai-message`, `mth-thinking-indicator`, `mth-tool-call`, `mth-citation-list`, `mth-artifact-pane`, `mth-suggestion-chips`, `mth-ai-feedback`
- `@methane/auth`: `mth-auth-form`, `mth-mfa-challenge`, `mth-passkey-prompt`, `mth-sso-buttons`, `mth-session-list`, `mth-role-matrix`, `mth-profile-menu`
- `@methane/admin`: `mth-kanban`, `mth-audit-log`, `mth-filter-builder`, `mth-query-builder`, `mth-csv-importer`, `mth-file-explorer`, `mth-event-calendar`, `mth-settings-shell`, `mth-saved-views`, `mth-bulk-action-bar`, `mth-column-chooser`
- `@methane/chat`: `mth-chat-thread`, `mth-comment-thread`, `mth-message-composer`, `mth-notification-bell`, `mth-reaction-bar`, `mth-typing-indicator`, `mth-presence-badge`, `mth-collab-cursors`
- `@methane/commerce`: `mth-product-card`, `mth-cart`, `mth-checkout-steps`, `mth-payment-form`, `mth-plan-picker`, `mth-price-display`, `mth-quantity-selector`, `mth-facet-filters`, `mth-review-summary`, `mth-invoice`

## Heavy Satellites (Lazy Client Engines)

- `@methane/charts`: `mth-chart`, `mth-chart-series` (Apache ECharts)
- `@methane/datagrid`: `mth-datagrid`, `mth-pivot-table`, `mth-tree-table`, `mth-scheduler`, `mth-gantt` (TanStack Table/Virtual)
- `@methane/editor`: `mth-rich-editor`, `mth-markdown`, `mth-markdown-editor`, `mth-math-editor` (ProseMirror + KaTeX)
- `@methane/code`: `mth-code-editor`, `mth-code-block`, `mth-diff-viewer`, `mth-json-editor` (CodeMirror 6)
- `@methane/maps`: `mth-map`, `mth-map-route`, `mth-map-draw`, `mth-map-cluster`, `mth-location-picker`, `mth-floor-plan`, `mth-seat-map` (MapLibre GL)
- `@methane/pdf`: `mth-pdf-viewer` (`pdfjs-dist`)
- `@methane/3d`: `mth-model-viewer` (Three.js)
- `@methane/flow`: `mth-flow-editor`, `mth-org-chart` (`@dagrejs/dagre`)
- `@methane/media`: `mth-lottie`, `mth-waveform`, `mth-image-annotator`
- `@methane/rtc`: `mth-audio-recorder`, `mth-camera-capture`, `mth-screen-recorder`, `mth-video-grid`
- `@methane/spreadsheet`: `mth-spreadsheet`, `mth-formula-bar`
