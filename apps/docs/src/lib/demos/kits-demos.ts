import type { DemoSpec } from './types.js';

type DetailRecord = Readonly<Record<string, unknown>>;

function readDetail(event: Event): DetailRecord | null {
  if (!('detail' in event)) return null;
  const detail: unknown = (event as CustomEvent<unknown>).detail;
  if (typeof detail !== 'object' || detail === null) return null;
  return detail as DetailRecord;
}

function readString(record: DetailRecord | null, key: string): string {
  if (!record) return '';
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function readNumber(record: DetailRecord | null, key: string): number | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === 'number' ? value : null;
}

function readBoolean(record: DetailRecord | null, key: string): boolean | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === 'boolean' ? value : null;
}

function readArrayLength(record: DetailRecord | null, key: string): number {
  if (!record) return 0;
  const value = record[key];
  return Array.isArray(value) ? value.length : 0;
}

function countAvailabilitySlots(schedule: unknown): number {
  if (typeof schedule !== 'object' || schedule === null) return 0;
  let total = 0;
  for (const slots of Object.values(schedule as Record<string, unknown>)) {
    if (Array.isArray(slots)) {
      total += slots.length;
    }
  }
  return total;
}

const INITIAL_WEEKLY_AVAILABILITY: Readonly<Record<string, readonly string[]>> = {
  mon: ['09:00', '10:00', '14:00'],
  tue: ['10:00', '11:00'],
  wed: ['09:00', '14:00', '15:00'],
  thu: ['11:00', '15:00'],
  fri: ['09:00', '10:00'],
};

const PRODUCT_THUMBNAIL_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 280">',
  '<defs>',
  '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0%" stop-color="#1e293b"/>',
  '<stop offset="100%" stop-color="#0f172a"/>',
  '</linearGradient>',
  '<linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">',
  '<stop offset="0%" stop-color="#38bdf8"/>',
  '<stop offset="100%" stop-color="#0284c7"/>',
  '</linearGradient>',
  '</defs>',
  '<rect width="480" height="280" fill="url(#bg)"/>',
  '<rect x="52" y="72" width="376" height="136" rx="14" fill="#334155" stroke="#475569" stroke-width="2"/>',
  '<rect x="70" y="92" width="44" height="28" rx="5" fill="url(#cap)"/>',
  '<rect x="122" y="92" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="174" y="92" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="226" y="92" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="278" y="92" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="330" y="92" width="80" height="28" rx="5" fill="#94a3b8"/>',
  '<rect x="70" y="128" width="58" height="28" rx="5" fill="#94a3b8"/>',
  '<rect x="136" y="128" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="188" y="128" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="240" y="128" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="292" y="128" width="44" height="28" rx="5" fill="#cbd5e1"/>',
  '<rect x="344" y="128" width="66" height="28" rx="5" fill="url(#cap)"/>',
  '<rect x="70" y="164" width="64" height="28" rx="5" fill="#94a3b8"/>',
  '<rect x="142" y="164" width="180" height="28" rx="5" fill="#e2e8f0"/>',
  '<rect x="330" y="164" width="80" height="28" rx="5" fill="#94a3b8"/>',
  '</svg>',
].join('');

const PRODUCT_MEDIA_URI = `data:image/svg+xml,${encodeURIComponent(PRODUCT_THUMBNAIL_SVG)}`;

export const KITS_DEMO_SPECS: Readonly<Record<string, DemoSpec>> = {
  // ── @methane-ui/admin (13) ──────────────────────────────────────────────

  'mth-audit-log': {
    style: 'inline-size:100%',
    attrs: {
      severity: 'all',
      search: '',
      'row-height': 46,
    },
    props: {
      entries: [
        {
          id: 'aud-1',
          actor: 'maya.chen@acme.dev',
          action: 'api_key.rotated',
          resource: 'prod-ingest-01',
          timestamp: '2026-11-15T15:42:00Z',
          severity: 'warning',
        },
        {
          id: 'aud-2',
          actor: 'ops-bot@acme.dev',
          action: 'policy.updated',
          resource: 'sso-enforced',
          timestamp: '2026-11-15T14:18:00Z',
          severity: 'info',
        },
        {
          id: 'aud-3',
          actor: 'liam.ortiz@acme.dev',
          action: 'role.escalated',
          resource: 'billing-admin',
          timestamp: '2026-11-15T12:05:00Z',
          severity: 'critical',
        },
        {
          id: 'aud-4',
          actor: 'priya.nair@acme.dev',
          action: 'webhook.verified',
          resource: 'stripe-live',
          timestamp: '2026-11-15T10:31:00Z',
          severity: 'info',
        },
        {
          id: 'aud-5',
          actor: 'sec-scanner@acme.dev',
          action: 'token.revoked',
          resource: 'ci-runner-14',
          timestamp: '2026-11-15T09:12:00Z',
          severity: 'critical',
        },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-entry-select', (event) => {
        const detail = readDetail(event);
        const entry = detail?.['entry'] as DetailRecord | undefined;
        const action = readString(entry ?? null, 'action');
        const actor = readString(entry ?? null, 'actor');
        setReadout(`Selected ${action || 'entry'} by ${actor || 'actor'}`);
      });
      target.addEventListener('mth-filter-change', (event) => {
        const detail = readDetail(event);
        const severity = readString(detail, 'severity') || 'all';
        const search = readString(detail, 'search');
        syncControlValue('severity', severity);
        syncControlValue('search', search);
        setReadout(`Filter: severity=${severity}${search ? `, query="${search}"` : ''}`);
      });
    },
  },

  'mth-availability-picker': {
    style: 'inline-size:min(100%,38rem)',
    attrs: {
      name: 'weekly-hours',
      value: JSON.stringify(INITIAL_WEEKLY_AVAILABILITY),
    },
    setup({ target, setReadout, syncControlValue }) {
      setReadout(`${countAvailabilitySlots(INITIAL_WEEKLY_AVAILABILITY)} weekly slots selected across Mon–Fri`);
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        const count = countAvailabilitySlots(detail?.['schedule']);
        syncControlValue('value', value);
        setReadout(`mth-change · ${count} weekly ${count === 1 ? 'slot' : 'slots'} selected`);
      });
    },
  },

  'mth-booking-widget': {
    style: 'inline-size:min(100%,38rem)',
    attrs: {
      name: 'consultation-slot',
      value: '2026-11-16T10:30',
    },
    props: {
      availableSlots: [
        { date: '2026-11-15', slots: ['09:30', '11:00', '14:30'] },
        { date: '2026-11-16', slots: ['09:00', '10:30', '13:30', '16:00'] },
        { date: '2026-11-17', slots: ['10:00', '11:30', '15:00'] },
        { date: '2026-11-18', slots: ['09:00', '13:00', '14:30'] },
        { date: '2026-11-19', slots: ['10:30', '15:30'] },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        const date = readString(detail, 'date');
        const time = readString(detail, 'time');
        syncControlValue('value', value);
        setReadout(`Selected slot: ${date} ${time}`.trim());
      });
      target.addEventListener('mth-confirm', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        syncControlValue('value', value);
        setReadout(`Confirmed booking for ${value}`);
      });
    },
  },

  'mth-bulk-action-bar': {
    style: 'inline-size:min(100%,40rem)',
    attrs: {
      'selected-count': 4,
      'total-count': 28,
    },
    props: {
      actions: [
        { id: 'assign', label: 'Assign owner', tone: 'default' },
        { id: 'export', label: 'Export CSV', tone: 'default' },
        { id: 'archive', label: 'Archive', tone: 'danger' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-select-all', () => {
        const total = target.getAttribute('total-count') ?? '28';
        target.setAttribute('selected-count', total);
        syncControlValue('selected-count', total);
        setReadout(`Selected all ${total} rows`);
      });
      target.addEventListener('mth-clear-selection', () => {
        target.setAttribute('selected-count', '0');
        target.setAttribute('show-when-empty', '');
        syncControlValue('selected-count', '0');
        syncControlValue('show-when-empty', true);
        setReadout('Selection cleared (0 selected)');
      });
      target.addEventListener('mth-action', (event) => {
        const detail = readDetail(event);
        const id = readString(detail, 'id');
        const selectedCount = readNumber(detail, 'selectedCount') ?? 0;
        setReadout(`Action "${id}" triggered for ${selectedCount} items`);
      });
    },
  },

  'mth-column-chooser': {
    style: 'inline-size:min(100%,24rem)',
    attrs: {
      'allow-reorder': true,
      'allow-reset': true,
    },
    props: {
      columns: [
        { id: 'name', label: 'Account Name', visible: true, locked: true },
        { id: 'plan', label: 'Plan Tier', visible: true },
        { id: 'mrr', label: 'Monthly Revenue', visible: true },
        { id: 'owner', label: 'Account Owner', visible: true },
        { id: 'region', label: 'Region', visible: false },
        { id: 'lastSeen', label: 'Last Active', visible: false },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const cols = detail?.['columns'];
        const visibleCount = Array.isArray(cols)
          ? cols.filter((c) => typeof c === 'object' && c !== null && (c as DetailRecord)['visible'] === true).length
          : 0;
        setReadout(`${visibleCount} columns visible`);
      });
      target.addEventListener('mth-reset', () => {
        setReadout('Columns reset to defaults');
      });
    },
  },

  'mth-csv-importer': {
    style: 'inline-size:min(100%,42rem)',
    attrs: {
      'has-header': true,
      'raw-csv': [
        'full_name,work_email,department,role',
        'Maya Chen,maya@acme.dev,Platform,Admin',
        'Liam Ortiz,liam@acme.dev,Design,Editor',
        'Priya Nair,priya@acme.dev,Security,Auditor',
      ].join('\n'),
    },
    props: {
      fields: [
        { key: 'name', label: 'Full Name', required: true },
        { key: 'email', label: 'Email Address', required: true },
        { key: 'team', label: 'Team / Department' },
        { key: 'role', label: 'Workspace Role' },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-parse', (event) => {
        const detail = readDetail(event);
        const headers = readArrayLength(detail, 'headers');
        const rowCount = readNumber(detail, 'rowCount') ?? 0;
        setReadout(`Parsed ${rowCount} rows across ${headers} CSV columns`);
      });
      target.addEventListener('mth-import', (event) => {
        const detail = readDetail(event);
        const rows = readArrayLength(detail, 'rows');
        const invalidCount = readNumber(detail, 'invalidCount') ?? 0;
        setReadout(`Imported ${rows} valid rows (${invalidCount} skipped)`);
      });
    },
  },

  'mth-event-calendar': {
    style: 'inline-size:100%',
    attrs: {
      view: 'month',
      'active-date': '2026-11-15',
    },
    props: {
      events: [
        { id: 'ev-1', title: 'Design critique', date: '2026-11-15', startTime: '09:00', endTime: '10:00' },
        { id: 'ev-2', title: 'Kit API review', date: '2026-11-15', startTime: '13:00', endTime: '14:00' },
        { id: 'ev-3', title: 'Customer sync', date: '2026-11-16', startTime: '10:00', endTime: '11:00' },
        { id: 'ev-4', title: 'Security triage', date: '2026-11-18', startTime: '14:00', endTime: '15:00' },
        { id: 'ev-5', title: 'Release candidate cut', date: '2026-11-20', startTime: '15:00', endTime: '16:00' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-event-select', (event) => {
        const detail = readDetail(event);
        const item = detail?.['event'] as DetailRecord | undefined;
        const title = readString(item ?? null, 'title');
        const date = readString(item ?? null, 'date');
        setReadout(`Selected "${title}" on ${date}`);
      });
      target.addEventListener('mth-event-create', (event) => {
        const detail = readDetail(event);
        const date = readString(detail, 'date');
        const startTime = readString(detail, 'startTime');
        setReadout(`Create event at ${date}${startTime ? ` ${startTime}` : ''}`);
      });
      target.addEventListener('mth-date-change', (event) => {
        const detail = readDetail(event);
        const activeDate = readString(detail, 'activeDate');
        if (activeDate) syncControlValue('active-date', activeDate);
        setReadout(`Calendar focus: ${activeDate}`);
      });
    },
  },

  'mth-file-explorer': {
    style: 'inline-size:100%',
    attrs: {
      'view-mode': 'list',
      columns: 3,
    },
    props: {
      items: [
        { id: 'dir-design', name: 'design-tokens', kind: 'folder', updatedAt: '2h ago' },
        { id: 'dir-specs', name: 'release-specs', kind: 'folder', updatedAt: 'Yesterday' },
        { id: 'file-manifest', name: 'custom-elements.json', kind: 'file', size: '48 KB', updatedAt: '10m ago' },
        { id: 'file-theme', name: 'brand-palette.css', kind: 'file', size: '12 KB', updatedAt: '3h ago' },
        { id: 'file-sub1', name: 'oklch-scales.json', kind: 'file', parentId: 'dir-design', size: '8.4 KB', updatedAt: '1d ago' },
        { id: 'file-sub2', name: 'q4-checklist.md', kind: 'file', parentId: 'dir-specs', size: '5.1 KB', updatedAt: '2d ago' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-navigate', (event) => {
        const detail = readDetail(event);
        const folderId = readString(detail, 'folderId');
        syncControlValue('current-folder-id', folderId);
        setReadout(`Opened folder: ${folderId || 'Root'}`);
      });
      target.addEventListener('mth-file-open', (event) => {
        const detail = readDetail(event);
        const item = detail?.['item'] as DetailRecord | undefined;
        setReadout(`Opened file: ${readString(item ?? null, 'name')}`);
      });
      target.addEventListener('mth-selection-change', (event) => {
        const detail = readDetail(event);
        const count = readArrayLength(detail, 'selectedIds');
        setReadout(`${count} ${count === 1 ? 'item' : 'items'} selected`);
      });
    },
  },

  'mth-filter-builder': {
    style: 'inline-size:100%',
    attrs: {
      combinator: 'and',
    },
    props: {
      fields: [
        { id: 'status', label: 'Status', operators: ['equals', 'not_equals'] },
        { id: 'plan', label: 'Plan Tier', operators: ['equals', 'contains'] },
        { id: 'seats', label: 'Seat Count', operators: ['gt', 'lt', 'equals'] },
        { id: 'region', label: 'Region', operators: ['equals', 'starts_with'] },
      ],
      rules: [
        { id: 'r-1', field: 'status', operator: 'equals', value: 'active' },
        { id: 'r-2', field: 'plan', operator: 'equals', value: 'enterprise' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const combinator = readString(detail, 'combinator') || 'and';
        const rules = readArrayLength(detail, 'rules');
        syncControlValue('combinator', combinator);
        setReadout(`${rules} ${rules === 1 ? 'rule' : 'rules'} joined with ${combinator.toUpperCase()}`);
      });
    },
  },

  'mth-kanban': {
    style: 'inline-size:100%',
    props: {
      lanes: [
        { id: 'backlog', label: 'Backlog', wipLimit: 5 },
        { id: 'in-progress', label: 'In Progress', wipLimit: 3 },
        { id: 'review', label: 'In Review', wipLimit: 3 },
        { id: 'done', label: 'Done' },
      ],
      cards: [
        { id: 'k-1', laneId: 'backlog', title: 'Audit high-contrast tokens', assignee: 'Maya', priority: 'medium' },
        { id: 'k-2', laneId: 'backlog', title: 'Add keyboard shortcut cheatsheet', assignee: 'Sam', priority: 'low' },
        { id: 'k-3', laneId: 'in-progress', title: 'Ship SSR hydration benchmarks', assignee: 'Liam', priority: 'high' },
        { id: 'k-4', laneId: 'in-progress', title: 'Wire availability picker live demo', assignee: 'Priya', priority: 'high' },
        { id: 'k-5', laneId: 'review', title: 'Validate role matrix exports', assignee: 'Maya', priority: 'medium' },
        { id: 'k-6', laneId: 'done', title: 'Publish v2.4 domain kits', assignee: 'Alex', priority: 'low' },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-card-move', (event) => {
        const detail = readDetail(event);
        const cardId = readString(detail, 'cardId');
        const fromLane = readString(detail, 'fromLaneId');
        const toLane = readString(detail, 'toLaneId');
        setReadout(`Moved ${cardId} from ${fromLane} to ${toLane}`);
      });
      target.addEventListener('mth-card-select', (event) => {
        const detail = readDetail(event);
        const card = detail?.['card'] as DetailRecord | undefined;
        setReadout(`Selected card: ${readString(card ?? null, 'title')}`);
      });
    },
  },

  'mth-query-builder': {
    style: 'inline-size:100%',
    attrs: {
      name: 'segment-query',
      'show-preview': true,
      value: JSON.stringify({
        kind: 'group',
        id: 'root',
        combinator: 'and',
        items: [
          { kind: 'rule', id: 'q-1', field: 'plan', operator: 'equals', value: 'pro' },
          {
            kind: 'group',
            id: 'g-2',
            combinator: 'or',
            items: [
              { kind: 'rule', id: 'q-2', field: 'mrr', operator: 'gt', value: '500' },
              { kind: 'rule', id: 'q-3', field: 'seats', operator: 'gte', value: '10' },
            ],
          },
        ],
      }),
    },
    props: {
      fields: [
        { id: 'plan', label: 'Subscription Plan' },
        { id: 'mrr', label: 'Monthly Revenue ($)' },
        { id: 'seats', label: 'Active Seats' },
        { id: 'region', label: 'Cloud Region' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        syncControlValue('value', value);
        setReadout(`Updated query AST (${value.length} chars)`);
      });
    },
  },

  'mth-saved-views': {
    style: 'inline-size:100%',
    attrs: {
      'active-view-id': 'view-active',
      'allow-create': true,
      'allow-manage': true,
    },
    props: {
      views: [
        { id: 'view-all', label: 'All Accounts', pinned: true },
        { id: 'view-active', label: 'Enterprise Renewals', pinned: true },
        { id: 'view-risk', label: 'At-Risk Usage' },
        { id: 'view-trial', label: '14-Day Trials' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-view-select', (event) => {
        const detail = readDetail(event);
        const view = detail?.['view'] as DetailRecord | undefined;
        const id = readString(view ?? null, 'id') || readString(detail, 'id');
        if (id) syncControlValue('active-view-id', id);
        setReadout(`Switched view: ${readString(view ?? null, 'label') || id}`);
      });
      target.addEventListener('mth-view-create', (event) => {
        const detail = readDetail(event);
        const view = detail?.['view'] as DetailRecord | undefined;
        setReadout(`Created view: ${readString(view ?? null, 'label') || 'New view'}`);
      });
      target.addEventListener('mth-view-pin', () => {
        setReadout('Toggled pinned view');
      });
      target.addEventListener('mth-view-duplicate', () => {
        setReadout('Duplicated view');
      });
      target.addEventListener('mth-view-delete', () => {
        setReadout('Deleted view');
      });
    },
  },

  'mth-settings-shell': {
    style: 'inline-size:100%',
    attrs: {
      'active-section-id': 'general',
      dirty: true,
    },
    props: {
      sections: [
        { id: 'general', label: 'General', description: 'Workspace identity and locale' },
        { id: 'security', label: 'Security', description: 'SAML SSO, passkeys, and audit retention' },
        { id: 'billing', label: 'Billing', description: 'Plan tier and invoice recipients' },
      ],
    },
    children: [
      {
        tag: 'span',
        attrs: { slot: 'header', style: 'font-size:0.8125rem;opacity:0.75;' },
        text: 'Workspace: Methane Cloud',
      },
      {
        tag: 'div',
        attrs: { 'data-section': 'general', style: 'display:grid;gap:0.75rem;' },
        children: [
          { tag: 'strong', text: 'Workspace Profile' },
          {
            tag: 'p',
            attrs: { style: 'margin:0;opacity:0.8;' },
            text: 'Manage your organization slug, default timezone (UTC), and telemetry retention window.',
          },
        ],
      },
    ],
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-section-change', (event) => {
        const detail = readDetail(event);
        const id = readString(detail, 'id');
        if (id) syncControlValue('active-section-id', id);
        setReadout(`Viewing "${id}" settings section`);
      });
      target.addEventListener('mth-save', () => {
        target.removeAttribute('dirty');
        syncControlValue('dirty', false);
        setReadout('Settings saved');
      });
      target.addEventListener('mth-discard', () => {
        target.removeAttribute('dirty');
        syncControlValue('dirty', false);
        setReadout('Unsaved changes discarded');
      });
    },
  },

  // ── @methane-ui/ai (8) ──────────────────────────────────────────────────

  'mth-ai-feedback': {
    style: 'inline-size:min(100%,30rem)',
    attrs: {
      label: 'Rate this assistant response',
    },
    props: {
      reasons: ['Accurate & clear', 'Fast solution', 'Incomplete code', 'Wrong API usage'],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-feedback', (event) => {
        const detail = readDetail(event);
        const rating = readString(detail, 'rating');
        const submitted = readBoolean(detail, 'submitted') ?? false;
        const reasons = readArrayLength(detail, 'reasons');
        syncControlValue('rating', rating);
        syncControlValue('submitted', submitted);
        setReadout(
          submitted
            ? `Submitted "${rating || 'none'}" feedback (${reasons} tags)`
            : `Rating selected: ${rating || 'cleared'}`
        );
      });
    },
  },

  'mth-ai-message': {
    style: 'inline-size:min(100%,40rem)',
    attrs: {
      role: 'assistant',
      author: 'Methane Copilot',
      timestamp: '15:42',
      'show-actions': true,
      content: [
        'Use logical CSS properties such as `inline-size` and `padding-block` so components adapt automatically to RTL locales.',
        '',
        '```ts',
        'export const tokenScale = { spacing: "0.75rem", radius: "0.5rem" };',
        '```',
      ].join('\n'),
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-copy', () => {
        setReadout('Copied assistant message markdown');
      });
      target.addEventListener('mth-regenerate', () => {
        setReadout('Requested regenerated response');
      });
    },
  },

  'mth-artifact-pane': {
    style: 'inline-size:min(100%,42rem)',
    attrs: {
      open: true,
      title: 'pricing-calculator.ts',
      kind: 'code',
      language: 'typescript',
      'active-tab': 'code',
      'active-version': 'v2',
    },
    props: {
      versions: [
        {
          id: 'v1',
          label: 'v1',
          kind: 'code',
          language: 'typescript',
          content: 'export function total(seats: number): number {\n  return seats * 18;\n}',
        },
        {
          id: 'v2',
          label: 'v2',
          kind: 'code',
          language: 'typescript',
          content: [
            'export function calculateAnnualTotal(seats: number, discountRate = 0.2): number {',
            '  const subtotal = seats * 18 * 12;',
            '  return Math.round(subtotal * (1 - discountRate));',
            '}',
          ].join('\n'),
        },
        {
          id: 'v3',
          label: 'Spec',
          kind: 'markdown',
          content: '### Volume Tiers\n\n- **1–9 seats**: standard rate\n- **10+ seats**: 20% annual discount',
        },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-copy', () => {
        setReadout('Copied artifact contents');
      });
      target.addEventListener('mth-close', () => {
        syncControlValue('open', false);
        setReadout('Artifact pane closed (toggle "open" control to reopen)');
      });
      target.addEventListener('mth-version-change', (event) => {
        const detail = readDetail(event);
        const versionId = readString(detail, 'versionId');
        syncControlValue('active-version', versionId);
        setReadout(`Switched to artifact ${versionId}`);
      });
      target.addEventListener('mth-tab-change', (event) => {
        const detail = readDetail(event);
        const tab = readString(detail, 'tab');
        syncControlValue('active-tab', tab);
        setReadout(`Active artifact tab: ${tab}`);
      });
    },
  },

  'mth-citation-list': {
    style: 'inline-size:min(100%,40rem)',
    attrs: {
      label: 'Sources',
      orientation: 'horizontal',
      'selected-id': 'cit-1',
    },
    props: {
      citations: [
        {
          id: 'cit-1',
          index: 1,
          title: 'Declarative Shadow DOM Hydration',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components',
          domain: 'developer.mozilla.org',
          snippet: 'Native browser parsing of shadowrootmode="open" templates prior to script execution.',
        },
        {
          id: 'cit-2',
          index: 2,
          title: 'Form-Associated Custom Elements',
          url: 'https://html.spec.whatwg.org/multipage/custom-elements.html',
          domain: 'html.spec.whatwg.org',
          snippet: 'ElementInternals connects custom controls directly to Constraint Validation and FormData.',
        },
        {
          id: 'cit-3',
          index: 3,
          title: 'OKLCH Perceptual Color Spaces',
          url: 'https://www.w3.org/TR/css-color-4/',
          domain: 'w3.org',
          snippet: 'Predictable lightness contrast ramps across light, dark, and high-contrast themes.',
        },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-select', (event) => {
        const detail = readDetail(event);
        const citation = detail?.['citation'] as DetailRecord | undefined;
        const id = readString(citation ?? null, 'id');
        if (id) syncControlValue('selected-id', id);
        setReadout(`Selected citation: ${readString(citation ?? null, 'title')}`);
      });
    },
  },

  'mth-prompt-input': {
    style: 'inline-size:min(100%,40rem)',
    attrs: {
      name: 'prompt',
      label: 'Ask Methane Copilot',
      placeholder: 'Summarize audit anomalies or draft an integration test…',
      hint: 'Press Enter to send, Shift+Enter for a newline',
      'submit-on-enter': true,
      'max-rows': 6,
    },
    children: [
      {
        tag: 'span',
        attrs: { slot: 'model', style: 'font-size:0.8125rem;opacity:0.75;' },
        text: 'Model: Methane-Fast',
      },
    ],
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-input', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        syncControlValue('value', value);
        setReadout(`Draft length: ${value.length} chars`);
      });
      target.addEventListener('mth-submit', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        setReadout(`Submitted prompt: "${value}"`);
      });
      target.addEventListener('mth-stop', () => {
        syncControlValue('streaming', false);
        setReadout('Stopped streaming generation');
      });
    },
  },

  'mth-suggestion-chips': {
    style: 'inline-size:min(100%,40rem)',
    attrs: {
      label: 'Suggested prompts',
      orientation: 'horizontal',
    },
    props: {
      items: [
        { id: 'chip-audit', label: 'Explain last 24h critical events', prompt: 'Summarize critical audit events from the last 24h.' },
        { id: 'chip-tokens', label: 'Generate dark theme tokens', prompt: 'Generate OKLCH dark surface tokens.' },
        { id: 'chip-tests', label: 'Write Playwright accessibility check', prompt: 'Draft an axe-core test for mth-cart.' },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-select', (event) => {
        const detail = readDetail(event);
        const item = detail?.['item'] as DetailRecord | undefined;
        setReadout(`Picked suggestion: "${readString(item ?? null, 'label')}"`);
      });
    },
  },

  'mth-thinking-indicator': {
    style: 'inline-size:min(100%,36rem)',
    attrs: {
      open: true,
      streaming: true,
      'elapsed-seconds': 4,
      summary: 'Analyzing schema migrations & token dependencies',
      content: '1. Checked 5 domain kit manifests.\n2. Verified SSR declarative shadow templates.\n3. Validated contrast ratio >= 4.5:1.',
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-toggle', (event) => {
        const detail = readDetail(event);
        const open = readBoolean(detail, 'open') ?? false;
        syncControlValue('open', open);
        setReadout(open ? 'Expanded reasoning trace' : 'Collapsed reasoning trace');
      });
    },
  },

  'mth-tool-call': {
    style: 'inline-size:min(100%,38rem)',
    attrs: {
      name: 'query_audit_events',
      status: 'success',
      open: true,
      'duration-ms': 142,
    },
    props: {
      args: { severity: ['warning', 'critical'], limit: 10, window: '24h' },
      output: { matched: 3, newestEventId: 'aud-1', p95LatencyMs: 38 },
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-toggle', (event) => {
        const detail = readDetail(event);
        const open = readBoolean(detail, 'open') ?? false;
        syncControlValue('open', open);
        setReadout(open ? 'Expanded tool call details' : 'Collapsed tool call details');
      });
    },
  },

  // ── @methane-ui/auth (7) ────────────────────────────────────────────────

  'mth-auth-form': {
    style: 'inline-size:min(100%,26rem)',
    attrs: {
      mode: 'signin',
      email: 'maya.chen@acme.dev',
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const email = readString(detail, 'email');
        if (email) syncControlValue('email', email);
        setReadout(`Updated ${readString(detail, 'mode') || 'auth'} fields`);
      });
      target.addEventListener('mth-submit', (event) => {
        const detail = readDetail(event);
        const mode = readString(detail, 'mode');
        const email = readString(detail, 'email');
        setReadout(`Submitted ${mode} for ${email || 'account'}`);
      });
    },
  },

  'mth-mfa-challenge': {
    style: 'inline-size:min(100%,26rem)',
    attrs: {
      mode: 'totp',
      length: 6,
      'allow-resend': true,
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-input', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        syncControlValue('value', value);
        setReadout(`Entered ${value.length} chars`);
      });
      target.addEventListener('mth-complete', (event) => {
        const detail = readDetail(event);
        setReadout(`Code complete: ${readString(detail, 'value')}`);
      });
      target.addEventListener('mth-submit', (event) => {
        const detail = readDetail(event);
        setReadout(`Verified ${readString(detail, 'mode').toUpperCase()} challenge`);
      });
      target.addEventListener('mth-resend', () => {
        setReadout('Dispatched a new verification code');
      });
      target.addEventListener('mth-mode-change', (event) => {
        const detail = readDetail(event);
        const mode = readString(detail, 'mode');
        syncControlValue('mode', mode);
        setReadout(`Switched verification mode to ${mode}`);
      });
    },
  },

  'mth-passkey-prompt': {
    style: 'inline-size:min(100%,26rem)',
    attrs: {
      mode: 'signin',
      status: 'idle',
      username: 'maya.chen@acme.dev',
      'allow-fallback': true,
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-passkey-auth', (event) => {
        const detail = readDetail(event);
        const mode = readString(detail, 'mode');
        syncControlValue('status', 'success');
        target.setAttribute('status', 'success');
        setReadout(`Passkey ${mode} succeeded for ${readString(detail, 'username') || 'user'}`);
      });
      target.addEventListener('mth-fallback', () => {
        setReadout('Switched to password / OTP fallback');
      });
    },
  },

  'mth-profile-menu': {
    attrs: {
      name: 'Maya Chen',
      email: 'maya.chen@acme.dev',
      'user-role': 'Workspace Admin',
      placement: 'bottom-end',
    },
    props: {
      items: [
        { id: 'profile', label: 'Account settings', icon: 'user' },
        { id: 'security', label: 'Security & tokens', icon: 'info' },
        { id: 'invite', label: 'Invite teammates', icon: 'share' },
        { id: 'signout', label: 'Sign out', icon: 'close', danger: true, separatorBefore: true },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-open', () => {
        syncControlValue('open', true);
        setReadout('Opened profile menu');
      });
      target.addEventListener('mth-close', () => {
        syncControlValue('open', false);
        setReadout('Closed profile menu');
      });
      target.addEventListener('mth-select', (event) => {
        const detail = readDetail(event);
        const item = detail?.['item'] as DetailRecord | undefined;
        setReadout(`Selected menu item: ${readString(item ?? null, 'label')}`);
      });
    },
  },

  'mth-role-matrix': {
    style: 'inline-size:100%',
    attrs: {
      label: 'Workspace RBAC Permissions',
    },
    props: {
      roles: [
        { id: 'owner', label: 'Owner', description: 'Full organization control' },
        { id: 'admin', label: 'Admin', description: 'Manage members and keys' },
        { id: 'editor', label: 'Editor', description: 'Edit content & drafts' },
        { id: 'viewer', label: 'Viewer', description: 'Read-only access' },
      ],
      permissions: [
        { id: 'billing:manage', label: 'Manage billing', category: 'Organization' },
        { id: 'sso:configure', label: 'Configure SAML SSO', category: 'Security' },
        { id: 'keys:rotate', label: 'Rotate API keys', category: 'Security' },
        { id: 'docs:publish', label: 'Publish releases', category: 'Content' },
      ],
      grants: {
        owner: ['billing:manage', 'sso:configure', 'keys:rotate', 'docs:publish'],
        admin: ['sso:configure', 'keys:rotate', 'docs:publish'],
        editor: ['docs:publish'],
        viewer: [],
      },
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const roleId = readString(detail, 'roleId');
        const permId = readString(detail, 'permissionId');
        const granted = readBoolean(detail, 'granted');
        setReadout(`${granted ? 'Granted' : 'Revoked'} "${permId}" for ${roleId}`);
      });
    },
  },

  'mth-session-list': {
    style: 'inline-size:min(100%,40rem)',
    attrs: {
      heading: 'Active Sessions',
    },
    props: {
      sessions: [
        {
          id: 'sess-1',
          device: 'MacBook Pro 16"',
          browser: 'Chrome 131 · macOS',
          location: 'San Francisco, US',
          ip: '198.51.100.14',
          lastActive: 'Active now',
          current: true,
        },
        {
          id: 'sess-2',
          device: 'iPhone 16 Pro',
          browser: 'Safari · iOS 19',
          location: 'San Francisco, US',
          ip: '198.51.100.42',
          lastActive: '18 minutes ago',
        },
        {
          id: 'sess-3',
          device: 'ThinkPad X1 Carbon',
          browser: 'Firefox 133 · Linux',
          location: 'Berlin, DE',
          ip: '203.0.113.88',
          lastActive: '3 days ago',
        },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-revoke', (event) => {
        const detail = readDetail(event);
        const session = detail?.['session'] as DetailRecord | undefined;
        setReadout(`Revoked session on ${readString(session ?? null, 'device') || readString(detail, 'id')}`);
      });
      target.addEventListener('mth-revoke-others', () => {
        setReadout('Revoked all other active sessions');
      });
    },
  },

  'mth-sso-buttons': {
    style: 'inline-size:min(100%,24rem)',
    attrs: {
      orientation: 'vertical',
      label: 'Sign in with an enterprise provider',
    },
    props: {
      providers: [
        { id: 'google', label: 'Continue with Google' },
        { id: 'github', label: 'Continue with GitHub' },
        { id: 'microsoft', label: 'Continue with Microsoft' },
        { id: 'okta', label: 'Continue with Okta SAML' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-sso-select', (event) => {
        const detail = readDetail(event);
        const provider = readString(detail, 'provider');
        syncControlValue('loading-provider', provider);
        setReadout(`Starting OAuth redirect with ${provider}`);
      });
    },
  },

  // ── @methane-ui/chat (8) ────────────────────────────────────────────────

  'mth-chat-thread': {
    style: 'inline-size:min(100%,40rem);block-size:22rem;',
    attrs: {
      'unread-message-id': 'msg-3',
      'show-scroll-to-bottom': true,
      label: 'Design system release channel',
    },
    props: {
      messages: [
        {
          id: 'msg-1',
          author: 'Maya Chen',
          body: 'Heads up: all 5 kit custom-elements manifests passed schema validation.',
          timestamp: '10:12',
          badge: 'Maintainer',
        },
        {
          id: 'msg-2',
          author: 'Liam Ortiz',
          body: 'Awesome! Did you verify `<mth-availability-picker>` initial state in SSR?',
          timestamp: '10:14',
          self: true,
        },
        {
          id: 'msg-3',
          author: 'Priya Nair',
          body: 'Yes — 11 preset time slots render cleanly with keyboard navigation enabled.',
          timestamp: '10:15',
          badge: 'QA',
        },
        {
          id: 'msg-4',
          author: 'Maya Chen',
          body: 'Publishing preview build now. Feel free to sanity-check dark mode contrast.',
          timestamp: '10:17',
        },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-scroll-bottom', () => {
        setReadout('Scrolled to latest message');
      });
      target.addEventListener('mth-retry', (event) => {
        const detail = readDetail(event);
        setReadout(`Retrying message ${readString(detail, 'id')}`);
      });
    },
  },

  'mth-collab-cursors': {
    tree: {
      tag: 'div',
      attrs: {
        style: [
          'position:relative',
          'inline-size:min(100%,38rem)',
          'block-size:14rem',
          'padding:1.25rem',
          'border:1px solid var(--mth-color-border, #d4d4d8)',
          'border-radius:var(--mth-radius-md, 0.5rem)',
          'background:var(--mth-color-surface, #ffffff)',
          'overflow:hidden',
          'box-sizing:border-box',
        ].join(';'),
      },
      children: [
        {
          tag: 'p',
          attrs: { style: 'margin:0 0 0.5rem;font-weight:600;' },
          text: 'Q4 Architecture RFC',
        },
        {
          tag: 'p',
          attrs: { style: 'margin:0;opacity:0.8;line-height:1.5;' },
          text: 'All five domain kits share logical CSS tokens, form-associated controls, and declarative shadow hydration.',
        },
        {
          tag: 'mth-collab-cursors',
          attrs: {
            'data-preview-target': true,
            label: 'Active collaborators',
            style: 'position:absolute;inset:0;inline-size:100%;block-size:100%;',
          },
        },
      ],
    },
    props: {
      cursors: [
        {
          id: 'c-maya',
          name: 'Maya Chen',
          color: 'oklch(0.62 0.21 255)',
          x: 210,
          y: 52,
          selection: { x: 112, y: 48, width: 104, height: 22 },
        },
        {
          id: 'c-liam',
          name: 'Liam Ortiz',
          color: 'oklch(0.64 0.19 155)',
          x: 365,
          y: 118,
        },
        {
          id: 'c-priya',
          name: 'Priya Nair',
          color: 'oklch(0.66 0.2 35)',
          x: 96,
          y: 152,
        },
      ],
    },
    setup({ setReadout }) {
      setReadout('Rendering 3 live collaborator cursors over shared document');
    },
  },

  'mth-comment-thread': {
    style: 'inline-size:min(100%,38rem)',
    attrs: {
      label: 'Design review comments',
      'allow-reply': true,
      'allow-resolve': true,
    },
    props: {
      comments: [
        {
          id: 'cmt-1',
          author: 'Maya Chen',
          body: 'Should we widen the weekly grid to `38rem` on docs preview cards?',
          timestamp: '12m ago',
          resolved: false,
          replies: [
            {
              id: 'cmt-1a',
              author: 'Liam Ortiz',
              body: 'Yes! `min(100%, 38rem)` keeps all 7 day columns crisp without horizontal clipping.',
              timestamp: '6m ago',
            },
          ],
        },
        {
          id: 'cmt-2',
          author: 'Priya Nair',
          body: 'Verified keyboard focus ring contrast on selected time slots.',
          timestamp: '1h ago',
          resolved: true,
        },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-reply', (event) => {
        const detail = readDetail(event);
        setReadout(`Posted reply to ${readString(detail, 'parentId')}`);
      });
      target.addEventListener('mth-resolve-toggle', (event) => {
        const detail = readDetail(event);
        const resolved = readBoolean(detail, 'resolved') ?? false;
        setReadout(resolved ? 'Marked comment thread resolved' : 'Reopened comment thread');
      });
    },
  },

  'mth-message-composer': {
    style: 'inline-size:min(100%,38rem)',
    attrs: {
      name: 'channel-message',
      label: 'Message #design-system',
      placeholder: 'Write a message or paste release notes…',
      hint: 'Enter sends · Shift+Enter adds a newline',
      'submit-on-enter': true,
      'max-length': 500,
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-input', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        syncControlValue('value', value);
        setReadout(`Draft: ${value.length}/500 characters`);
      });
      target.addEventListener('mth-submit', (event) => {
        const detail = readDetail(event);
        setReadout(`Sent message: "${readString(detail, 'value')}"`);
      });
      target.addEventListener('mth-attach', () => {
        setReadout('Opened attachment picker');
      });
      target.addEventListener('mth-emoji', () => {
        setReadout('Opened emoji reaction picker');
      });
      target.addEventListener('mth-stop', () => {
        syncControlValue('streaming', false);
        setReadout('Stopped active stream');
      });
    },
  },

  'mth-notification-bell': {
    attrs: {
      'unread-count': 2,
      'max-count': 99,
      placement: 'bottom-end',
      label: 'Notifications',
    },
    props: {
      items: [
        {
          id: 'n-1',
          title: 'Deployment succeeded',
          message: '@methane-ui/admin v2.4.1 is live in production.',
          tone: 'success',
          timestamp: '4m ago',
          read: false,
        },
        {
          id: 'n-2',
          title: 'Expiring webhook secret',
          message: 'Rotate stripe-live signing key before Nov 20.',
          tone: 'warning',
          timestamp: '32m ago',
          read: false,
        },
        {
          id: 'n-3',
          title: 'New team member',
          message: 'Samira Patel joined Platform Engineering.',
          tone: 'info',
          timestamp: '2h ago',
          read: true,
        },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-open', () => {
        syncControlValue('open', true);
        setReadout('Opened notifications popover');
      });
      target.addEventListener('mth-close', () => {
        syncControlValue('open', false);
        setReadout('Closed notifications popover');
      });
      target.addEventListener('mth-item-select', (event) => {
        const detail = readDetail(event);
        const item = detail?.['item'] as DetailRecord | undefined;
        setReadout(`Opened notification: ${readString(item ?? null, 'title') || readString(detail, 'id')}`);
      });
      target.addEventListener('mth-item-dismiss', (event) => {
        const detail = readDetail(event);
        setReadout(`Dismissed notification ${readString(detail, 'id')}`);
      });
      target.addEventListener('mth-mark-all-read', () => {
        syncControlValue('unread-count', '0');
        setReadout('Marked all notifications read');
      });
    },
  },

  'mth-presence-badge': {
    attrs: {
      status: 'online',
      'show-label': true,
      size: 'md',
    },
  },

  'mth-reaction-bar': {
    attrs: {
      multiple: true,
      'allow-add': true,
      label: 'Message reactions',
    },
    props: {
      reactions: [
        { emoji: '👍', count: 8, active: true, label: 'Thumbs up' },
        { emoji: '🚀', count: 5, label: 'Ship it' },
        { emoji: '🎉', count: 3, label: 'Celebrate' },
        { emoji: '👀', count: 2, label: 'Watching' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        syncControlValue('value', value);
        setReadout(`Active reactions: ${value || 'none'}`);
      });
      target.addEventListener('mth-add-reaction', () => {
        setReadout('Clicked add reaction button');
      });
    },
  },

  'mth-typing-indicator': {
    props: {
      users: ['Maya Chen', 'Liam Ortiz'],
    },
  },

  // ── @methane-ui/commerce (10) ───────────────────────────────────────────

  'mth-cart': {
    style: 'inline-size:min(100%,38rem)',
    attrs: {
      currency: 'USD',
      locale: 'en-US',
      'tax-rate': 0.0825,
      'shipping-amount': 12,
      'discount-amount': 15,
      'allow-remove': true,
      'checkout-label': 'Proceed to checkout',
    },
    props: {
      items: [
        {
          id: 'sku-kb',
          title: 'Tactile Mechanical Keyboard',
          variant: 'Space Grey · Tactile Switches',
          price: 169,
          quantity: 1,
          min: 1,
          max: 5,
        },
        {
          id: 'sku-desk',
          title: 'Merino Wool Desk Mat',
          variant: 'Charcoal · 900×400 mm',
          price: 48,
          quantity: 2,
          min: 1,
          max: 10,
        },
      ],
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-quantity-change', (event) => {
        const detail = readDetail(event);
        const id = readString(detail, 'id');
        const qty = readNumber(detail, 'quantity') ?? 1;
        setReadout(`Updated ${id} quantity to ${qty}`);
      });
      target.addEventListener('mth-remove-item', (event) => {
        const detail = readDetail(event);
        setReadout(`Removed item ${readString(detail, 'id')}`);
      });
      target.addEventListener('mth-checkout', (event) => {
        const detail = readDetail(event);
        const total = readNumber(detail, 'total');
        setReadout(`Proceeding to checkout (total: $${total ?? 0})`);
      });
    },
  },

  'mth-checkout-steps': {
    style: 'inline-size:100%',
    attrs: {
      'active-step': 'shipping',
      orientation: 'horizontal',
      linear: false,
      label: 'Checkout progress',
    },
    props: {
      steps: [
        { id: 'cart', label: 'Cart', description: 'Review items', completed: true },
        { id: 'shipping', label: 'Shipping', description: 'Address & carrier' },
        { id: 'payment', label: 'Payment', description: 'Card or invoice' },
        { id: 'confirm', label: 'Confirm', description: 'Order receipt' },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-step-change', (event) => {
        const detail = readDetail(event);
        const stepId = readString(detail, 'stepId');
        if (stepId) syncControlValue('active-step', stepId);
        setReadout(`Active checkout step: ${stepId}`);
      });
      target.addEventListener('mth-step-complete', (event) => {
        const detail = readDetail(event);
        setReadout(`Completed step: ${readString(detail, 'stepId')}`);
      });
    },
  },

  'mth-facet-filters': {
    style: 'inline-size:min(100%,22rem)',
    attrs: {
      collapsible: true,
      label: 'Catalog filters',
    },
    props: {
      facets: [
        {
          id: 'category',
          label: 'Category',
          type: 'checkbox',
          options: [
            { value: 'keyboards', label: 'Keyboards', count: 24 },
            { value: 'audio', label: 'Studio Audio', count: 16 },
            { value: 'lighting', label: 'Desk Lighting', count: 11 },
          ],
        },
        {
          id: 'finish',
          label: 'Finish',
          type: 'swatch',
          options: [
            { value: 'slate', label: 'Slate', color: 'slategray', count: 19 },
            { value: 'silver', label: 'Anodized Silver', color: 'silver', count: 14 },
            { value: 'obsidian', label: 'Obsidian', color: 'black', count: 18 },
          ],
        },
        {
          id: 'price',
          label: 'Price Range',
          type: 'range',
          min: 20,
          max: 400,
          step: 10,
        },
      ],
      selected: {
        category: ['keyboards'],
        finish: ['slate'],
      },
      ranges: {
        price: { min: 50, max: 250 },
      },
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-filter-change', (event) => {
        const detail = readDetail(event);
        const selected = detail?.['selected'] as Record<string, unknown> | undefined;
        let count = 0;
        if (selected) {
          for (const values of Object.values(selected)) {
            if (Array.isArray(values)) count += values.length;
          }
        }
        setReadout(`Active facet filters: ${count}`);
      });
      target.addEventListener('mth-filter-clear', () => {
        setReadout('Cleared all catalog filters');
      });
    },
  },

  'mth-invoice': {
    style: 'inline-size:min(100%,42rem)',
    attrs: {
      'invoice-number': 'INV-2026-1148',
      'issue-date': '2026-11-01',
      'due-date': '2026-11-30',
      status: 'pending',
      currency: 'USD',
      'tax-rate': 0.08,
      'discount-amount': 50,
      notes: 'Net 30 terms. Reference INV-2026-1148 on wire transfers.',
    },
    props: {
      seller: {
        name: 'Methane UI Cloud Inc.',
        address: '548 Market St, San Francisco, CA 94104',
        email: 'billing@methane.dev',
        taxId: 'US-94-3829104',
      },
      buyer: {
        name: 'Northstar Labs Ltd.',
        address: '220 King St W, Toronto, ON M5H 1K4',
        email: 'ap@northstarlabs.io',
      },
      items: [
        { description: 'Methane Enterprise Seats (25 users)', quantity: 25, unitPrice: 29 },
        { description: 'Dedicated SSR Edge Nodes', quantity: 2, unitPrice: 120 },
        { description: 'SOC2 Audit Retention Add-on', quantity: 1, unitPrice: 199 },
      ],
    },
  },

  'mth-payment-form': {
    style: 'inline-size:min(100%,30rem)',
    attrs: {
      name: 'checkout-payment',
      amount: 217,
      currency: 'USD',
      'submit-label': 'Pay $217.00',
    },
    setup({ target, setReadout }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const valid = readBoolean(detail, 'valid') ?? false;
        const brand = readString(detail, 'brand');
        setReadout(`Payment fields (${brand || 'card'}): ${valid ? 'valid' : 'incomplete'}`);
      });
      target.addEventListener('mth-submit', (event) => {
        const detail = readDetail(event);
        const last4 = readString(detail, 'last4');
        const amount = readNumber(detail, 'amount');
        setReadout(`Authorized $${amount ?? 217} on card ending ${last4 || '••••'}`);
      });
    },
  },

  'mth-plan-picker': {
    style: 'inline-size:100%',
    attrs: {
      name: 'subscription-plan',
      value: 'pro',
      'billing-cycle': 'annual',
      currency: 'USD',
      label: 'Choose a workspace plan',
    },
    props: {
      plans: [
        {
          id: 'starter',
          name: 'Starter',
          description: 'For side projects and prototypes',
          monthlyPrice: 0,
          annualPrice: 0,
          features: ['Up to 3 members', 'All 5 Domain Kits', 'Community support'],
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'For growing product teams',
          monthlyPrice: 29,
          annualPrice: 24,
          badge: 'Most popular',
          features: ['Unlimited projects', 'SSR edge hydration', 'Priority email support'],
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Security and scale controls',
          monthlyPrice: 79,
          annualPrice: 65,
          features: ['SAML SSO & SCIM', 'RBAC role matrix', '99.99% uptime SLA'],
        },
      ],
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const value = readString(detail, 'value');
        const cycle = readString(detail, 'billingCycle');
        syncControlValue('value', value);
        if (cycle) syncControlValue('billing-cycle', cycle);
        setReadout(`Selected "${value}" plan (${cycle || 'annual'})`);
      });
      target.addEventListener('mth-cycle-change', (event) => {
        const detail = readDetail(event);
        const cycle = readString(detail, 'billingCycle');
        syncControlValue('billing-cycle', cycle);
        setReadout(`Billing cycle: ${cycle}`);
      });
    },
  },

  'mth-price-display': {
    attrs: {
      amount: 149,
      'compare-at-amount': 199,
      currency: 'USD',
      period: 'year',
      'show-discount-badge': true,
    },
  },

  'mth-product-card': {
    style: 'inline-size:min(100%,20rem)',
    attrs: {
      title: 'Studio Mechanical Keyboard',
      subtitle: 'Gasket-mounted aluminum · Hot-swap USB-C',
      price: 169,
      'compare-at-price': 199,
      currency: 'USD',
      badge: 'New arrival',
      rating: 4.8,
      'review-count': 124,
      'in-stock': true,
      'action-label': 'Add to cart',
    },
    children: [
      {
        tag: 'img',
        attrs: {
          slot: 'media',
          src: PRODUCT_MEDIA_URI,
          alt: 'Studio Mechanical Keyboard illustration',
          style: 'display:block;inline-size:100%;block-size:11rem;object-fit:cover;',
        },
      },
    ],
    setup({ target, setReadout }) {
      target.addEventListener('mth-add-to-cart', (event) => {
        const detail = readDetail(event);
        setReadout(`Added "${readString(detail, 'title')}" ($${readNumber(detail, 'price') ?? 169}) to cart`);
      });
      target.addEventListener('mth-product-select', (event) => {
        const detail = readDetail(event);
        setReadout(`Viewing product: ${readString(detail, 'title')}`);
      });
    },
  },

  'mth-quantity-selector': {
    attrs: {
      name: 'item-quantity',
      label: 'Quantity',
      value: 2,
      min: 1,
      max: 12,
      step: 1,
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-change', (event) => {
        const detail = readDetail(event);
        const value = readNumber(detail, 'value') ?? 1;
        syncControlValue('value', String(value));
        setReadout(`Selected quantity: ${value}`);
      });
    },
  },

  'mth-review-summary': {
    style: 'inline-size:min(100%,26rem)',
    attrs: {
      average: 4.7,
      'total-reviews': 312,
      'max-stars': 5,
      label: 'Customer review summary',
    },
    props: {
      breakdown: {
        5: 238,
        4: 54,
        3: 13,
        2: 4,
        1: 3,
      },
    },
    setup({ target, setReadout, syncControlValue }) {
      target.addEventListener('mth-rating-filter', (event) => {
        const detail = readDetail(event);
        const star = detail?.['star'];
        if (typeof star === 'number') {
          syncControlValue('active-star', String(star));
          setReadout(`Filtering reviews by ${star} stars`);
        } else {
          syncControlValue('active-star', '');
          setReadout('Showing all star ratings');
        }
      });
    },
  },
};
