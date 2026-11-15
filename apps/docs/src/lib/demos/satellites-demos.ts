import type { DemoSetupContext, DemoSpec } from './types.js';

interface EventTargetWithProps extends HTMLElement {
  src?: string;
}

function readDetailRecord(event: Event): Readonly<Record<string, unknown>> | null {
  if (!(event instanceof CustomEvent)) return null;
  const detail: unknown = event.detail;
  if (typeof detail !== 'object' || detail === null) return null;
  return detail as Readonly<Record<string, unknown>>;
}

function readStringField(
  record: Readonly<Record<string, unknown>> | null,
  key: string,
): string | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readNumberField(
  record: Readonly<Record<string, unknown>> | null,
  key: string,
): number | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function escapePdfLiteral(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdfPageStream(heading: string, lines: ReadonlyArray<string>): string {
  const parts: string[] = [
    'BT',
    '/F1 18 Tf',
    '54 732 Td',
    `(${escapePdfLiteral(heading)}) Tj`,
    '/F1 11 Tf',
    '0 -28 Td',
  ];
  for (const line of lines) {
    parts.push(`(${escapePdfLiteral(line)}) Tj`);
    parts.push('0 -18 Td');
  }
  parts.push('ET');
  return parts.join('\n');
}

function createSamplePdfBytes(): Uint8Array {
  const encoder = new TextEncoder();
  const page1Stream = buildPdfPageStream('Methane UI - Architecture Brief', [
    'Page 1 of 2 - Offline Generated Specification',
    'Web Components built with Declarative Shadow DOM and Constructable Stylesheets.',
    'Four-tier logical CSS custom properties drive OKLCH themes across surfaces.',
    'Form-Associated Custom Elements integrate natively with ElementInternals.',
  ]);
  const page2Stream = buildPdfPageStream('Satellite Packages Overview', [
    'Page 2 of 2 - Verification & Telemetry',
    '1. @methane-ui/charts, @methane-ui/datagrid, @methane-ui/spreadsheet',
    '2. @methane-ui/code, @methane-ui/editor, @methane-ui/flow, @methane-ui/3d',
    '3. @methane-ui/maps, @methane-ui/media, @methane-ui/pdf, @methane-ui/rtc',
  ]);

  const objects: readonly string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `6 0 obj\n<< /Length ${encoder.encode(page1Stream).length} >>\nstream\n${page1Stream}\nendstream\nendobj\n`,
    `7 0 obj\n<< /Length ${encoder.encode(page2Stream).length} >>\nstream\n${page2Stream}\nendstream\nendobj\n`,
  ];

  const header = '%PDF-1.4\n';
  const chunks: Uint8Array[] = [encoder.encode(header)];
  const offsets: number[] = [];
  let cursor = chunks[0]?.length ?? 0;

  for (const obj of objects) {
    offsets.push(cursor);
    const bytes = encoder.encode(obj);
    chunks.push(bytes);
    cursor += bytes.length;
  }

  const xrefOffset = cursor;
  const xrefLines = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
  ];
  const trailer = `${xrefLines.join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(encoder.encode(trailer));

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let writeOffset = 0;
  for (const chunk of chunks) {
    output.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }
  return output;
}

function createChordWavBlobUrl(): string | null {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }
  const sampleRate = 22050;
  const durationSeconds = 0.9;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  const freqs = [261.63, 329.63, 392.0];
  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.min(1, i / 400) * Math.max(0, 1 - t / durationSeconds);
    let sample = 0;
    for (const freq of freqs) {
      sample += Math.sin(2 * Math.PI * freq * t);
    }
    const pcm = Math.max(-1, Math.min(1, (sample / freqs.length) * 0.65 * envelope));
    view.setInt16(44 + i * 2, Math.round(pcm * 32767), true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function createBlueprintBlobUrl(): string | null {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">',
    '<defs>',
    '<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">',
    '<path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1e293b" stroke-width="1"/>',
    '</pattern>',
    '</defs>',
    '<rect width="640" height="360" fill="#0f172a"/>',
    '<rect width="640" height="360" fill="url(#grid)"/>',
    '<rect x="64" y="56" width="210" height="128" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>',
    '<rect x="330" y="56" width="246" height="224" rx="8" fill="#1e293b" stroke="#818cf8" stroke-width="2"/>',
    '<rect x="64" y="212" width="210" height="68" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="2"/>',
    '<line x1="274" y1="120" x2="330" y2="120" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 4"/>',
    '<text x="84" y="92" fill="#e2e8f0" font-family="sans-serif" font-size="16" font-weight="600">Edge Ingress</text>',
    '<text x="84" y="252" fill="#a7f3d0" font-family="sans-serif" font-size="14">Cache Layer (94% hit)</text>',
    '<text x="352" y="94" fill="#c7d2fe" font-family="sans-serif" font-size="16" font-weight="600">Compute Cluster</text>',
    '</svg>',
  ].join('');
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}

function createWaveformPeaks(count: number): readonly number[] {
  const peaks: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const norm = i / Math.max(1, count - 1);
    const wave = 0.45 + 0.35 * Math.sin(norm * Math.PI * 5) + 0.15 * Math.cos(norm * Math.PI * 13);
    peaks.push(Number(Math.max(0.12, Math.min(0.96, wave)).toFixed(3)));
  }
  return peaks;
}

const OFFLINE_MAP_STYLE = {
  version: 8,
  sources: {
    bayCorridor: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Bay Service Corridor' },
            geometry: {
              type: 'LineString',
              coordinates: [
                [-122.478, 37.819],
                [-122.419, 37.775],
                [-122.371, 37.798],
                [-122.271, 37.804],
              ],
            },
          },
          {
            type: 'Feature',
            properties: { name: 'Metro Coverage Zone' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-122.46, 37.805],
                  [-122.36, 37.805],
                  [-122.36, 37.745],
                  [-122.46, 37.745],
                  [-122.46, 37.805],
                ],
              ],
            },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: 'bg',
      type: 'background',
      paint: { 'background-color': '#131c2e' },
    },
    {
      id: 'coverage-fill',
      type: 'fill',
      source: 'bayCorridor',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': '#2563eb',
        'fill-opacity': 0.18,
      },
    },
    {
      id: 'corridor-line',
      type: 'line',
      source: 'bayCorridor',
      filter: ['==', '$type', 'LineString'],
      paint: {
        'line-color': '#38bdf8',
        'line-width': 3,
      },
    },
  ],
} as const;

function attachEventReadout(
  ctx: DemoSetupContext,
  events: ReadonlyArray<string>,
  formatter?: (event: Event) => string,
): void {
  for (const eventName of events) {
    ctx.target.addEventListener(eventName, (event) => {
      if (formatter) {
        ctx.setReadout(formatter(event));
        return;
      }
      const detail = readDetailRecord(event);
      ctx.setReadout(detail ? `${eventName}: ${JSON.stringify(detail)}` : eventName);
    });
  }
}

export const SATELLITES_DEMO_SPECS: Readonly<Record<string, DemoSpec>> = {
  'mth-model-viewer': {
    attrs: {
      alt: 'Procedural orbital telemetry stage',
      'renderer-backend': 'auto',
      'auto-rotate': true,
      'auto-rotate-speed': 1.2,
      'camera-orbit-theta': 0.72,
      'camera-orbit-phi': 1.04,
      'camera-distance': 4.4,
      exposure: 1.1,
      'show-controls': true,
    },
    style: 'inline-size:100%;min-block-size:20rem',
    children: [
      {
        tag: 'div',
        attrs: { slot: 'fallback' },
        text: '3D Stage Ready (WebGL with automatic headless fallback)',
      },
    ],
    setup(ctx) {
      attachEventReadout(ctx, ['mth-model-load', 'mth-camera-change', 'mth-model-error'], (event) => {
        const detail = readDetailRecord(event);
        const theta = readNumberField(detail, 'theta');
        const phi = readNumberField(detail, 'phi');
        const distance = readNumberField(detail, 'distance');
        if (theta !== null && phi !== null && distance !== null) {
          return `orbit theta=${theta.toFixed(2)} phi=${phi.toFixed(2)} dist=${distance.toFixed(2)}`;
        }
        return `${event.type}`;
      });
    },
  },

  'mth-chart': {
    attrs: {
      'chart-title': 'Quarterly Platform Telemetry',
      subtitle: 'Edge throughput & cache hit ratio',
      type: 'bar',
      renderer: 'canvas',
      size: 'md',
      'show-legend': true,
      'show-tooltip': true,
      'categories-json': JSON.stringify(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']),
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [
        {
          name: 'Edge Requests (k)',
          type: 'bar',
          data: [420, 510, 490, 620, 710, 790],
          color: '#6366f1',
        },
        {
          name: 'Cache Hit (%)',
          type: 'line',
          data: [84, 87, 89, 91, 93, 95],
          smooth: true,
          color: '#10b981',
        },
        {
          name: 'Origin Fallback (k)',
          type: 'bar',
          data: [68, 66, 54, 55, 49, 40],
          color: '#f59e0b',
        },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-chart-ready', 'mth-point-select']);
    },
  },

  'mth-chart-series': {
    style: 'inline-size:100%;min-block-size:20rem',
    tree: {
      tag: 'mth-chart',
      attrs: {
        'chart-title': 'Throughput by Runtime',
        subtitle: 'Declarative <mth-chart-series> composition',
        'show-legend': true,
        'show-tooltip': true,
        style: 'inline-size:100%;min-block-size:20rem',
        'categories-json': JSON.stringify(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']),
      },
      children: [
        {
          tag: 'mth-chart-series',
          attrs: {
            'data-preview-target': true,
            name: 'Edge Workers',
            type: 'line',
            color: '#6366f1',
            smooth: true,
            'data-json': JSON.stringify([142, 168, 194, 215, 248, 286]),
          },
        },
        {
          tag: 'mth-chart-series',
          attrs: {
            name: 'Regional Origin',
            type: 'bar',
            color: '#10b981',
            'data-json': JSON.stringify([88, 102, 118, 124, 136, 152]),
          },
        },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-series-change']);
      const parentChart = ctx.target.closest('mth-chart');
      if (parentChart) {
        parentChart.addEventListener('mth-point-select', (event) => {
          const detail = readDetailRecord(event);
          ctx.setReadout(detail ? `mth-point-select: ${JSON.stringify(detail)}` : 'mth-point-select');
        });
      }
    },
  },

  'mth-code-block': {
    attrs: {
      language: 'typescript',
      label: 'Design token compiler snippet',
      'line-numbers': true,
      'highlight-lines': '3,5',
      'show-copy': true,
    },
    style: 'inline-size:100%;min-block-size:14rem',
    props: {
      code: [
        "import { compileDtcgTokens } from '@methane-ui/tokens';",
        '',
        'const compiled = compileDtcgTokens({',
        "  brandSeed: 'oklch(0.62 0.22 264)',",
        "  density: 'compact',",
        '});',
        '',
        'export const themeCss = compiled.cssText;',
      ].join('\n'),
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-copy'], () => 'Snippet copied to clipboard');
    },
  },

  'mth-code-editor': {
    attrs: {
      name: 'telemetry-handler',
      label: 'TypeScript telemetry aggregator',
      language: 'typescript',
    },
    style: 'inline-size:100%;min-block-size:16rem',
    props: {
      value: [
        'export interface SpanMetric {',
        '  readonly service: string;',
        '  readonly durationMs: number;',
        '  readonly ok: boolean;',
        '}',
        '',
        'export function averageLatency(spans: readonly SpanMetric[]): number {',
        '  if (spans.length === 0) return 0;',
        '  const total = spans.reduce((sum, span) => sum + span.durationMs, 0);',
        '  return Math.round(total / spans.length);',
        '}',
      ].join('\n'),
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-input', 'mth-change'], (event) => {
        const detail = readDetailRecord(event);
        const value = readStringField(detail, 'value');
        return value !== null ? `${event.type}: ${value.length} chars` : event.type;
      });
    },
  },

  'mth-diff-viewer': {
    attrs: {
      filename: 'src/theme-preset.ts',
      label: 'Theme preset revision diff',
      view: 'split',
    },
    style: 'inline-size:100%;min-block-size:16rem',
    props: {
      original: [
        'export const themePreset = {',
        "  mode: 'light',",
        "  radius: '0.375rem',",
        "  density: 'comfortable',",
        "  accent: '#3b82f6',",
        '};',
      ].join('\n'),
      modified: [
        'export const themePreset = {',
        "  mode: 'auto',",
        "  radius: '0.5rem',",
        "  density: 'compact',",
        "  accent: 'oklch(0.62 0.22 264)',",
        '  forcedColors: true,',
        '};',
      ].join('\n'),
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-view-change', 'mth-hunk-change']);
    },
  },

  'mth-json-editor': {
    attrs: {
      name: 'tokens-json',
      label: 'DTCG Design Tokens JSON',
      mode: 'split',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      value: JSON.stringify(
        {
          format: 'dtcg-2025.10',
          color: {
            brand: { $value: 'oklch(0.62 0.22 264)', $type: 'color' },
            surface: { $value: '#0f172a', $type: 'color' },
            success: { $value: 'oklch(0.68 0.17 152)', $type: 'color' },
          },
          spacing: {
            sm: { $value: '0.5rem', $type: 'dimension' },
            md: { $value: '1rem', $type: 'dimension' },
          },
        },
        null,
        2,
      ),
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-mode-change', 'mth-change']);
    },
  },

  'mth-datagrid': {
    attrs: {
      selectable: true,
      'multi-sort': true,
      label: 'Edge deployment cluster inventory',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      columns: [
        { id: 'service', header: 'Service', accessorKey: 'service', sortable: true, filterable: true, resizable: true, width: 170 },
        { id: 'region', header: 'Region', accessorKey: 'region', sortable: true, filterable: true, width: 110 },
        { id: 'runtime', header: 'Runtime', accessorKey: 'runtime', sortable: true, width: 120 },
        { id: 'p95Ms', header: 'p95 (ms)', accessorKey: 'p95Ms', sortable: true, width: 100 },
        { id: 'rps', header: 'Req/s', accessorKey: 'rps', sortable: true, width: 100 },
        { id: 'status', header: 'Status', accessorKey: 'status', sortable: true, filterable: true, width: 110 },
      ],
      rows: [
        { service: 'edge-gateway', region: 'us-west-2', runtime: 'worker-v3', p95Ms: 14, rps: 18400, status: 'healthy' },
        { service: 'token-compiler', region: 'us-east-1', runtime: 'node-24', p95Ms: 22, rps: 6200, status: 'healthy' },
        { service: 'ssr-hydrator', region: 'eu-central-1', runtime: 'edge-wasm', p95Ms: 19, rps: 11350, status: 'healthy' },
        { service: 'search-index', region: 'us-west-2', runtime: 'rust-simd', p95Ms: 31, rps: 9420, status: 'healthy' },
        { service: 'pdf-renderer', region: 'eu-west-1', runtime: 'worker-v3', p95Ms: 64, rps: 1840, status: 'degraded' },
        { service: 'geo-router', region: 'ap-northeast-1', runtime: 'edge-wasm', p95Ms: 11, rps: 21500, status: 'healthy' },
        { service: 'media-proxy', region: 'us-east-1', runtime: 'node-24', p95Ms: 42, rps: 4780, status: 'healthy' },
        { service: 'auth-verifier', region: 'eu-central-1', runtime: 'rust-simd', p95Ms: 9, rps: 27900, status: 'healthy' },
        { service: 'rtc-signaling', region: 'us-west-1', runtime: 'worker-v3', p95Ms: 17, rps: 8120, status: 'healthy' },
        { service: 'audit-sink', region: 'ap-southeast-1', runtime: 'node-24', p95Ms: 53, rps: 3190, status: 'standby' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-sort-change', 'mth-selection-change', 'mth-column-resize']);
    },
  },

  'mth-gantt': {
    attrs: {
      'start-date': '2026-04-01',
      days: 21,
      'show-dependencies': true,
      label: 'Q2 Satellite Rollout Roadmap',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      tasks: [
        { id: 't-spec', title: 'ComponentBehaviorSpec Audit', startDate: '2026-04-01', endDate: '2026-04-05', progress: 100 },
        { id: 't-tokens', title: '4-Tier Logical CSS Tokens', startDate: '2026-04-04', endDate: '2026-04-09', progress: 90, dependencies: ['t-spec'] },
        { id: 't-ssr', title: 'DSD Hydration Engine', startDate: '2026-04-08', endDate: '2026-04-14', progress: 75, dependencies: ['t-tokens'] },
        { id: 't-docs', title: 'Interactive Live Demos', startDate: '2026-04-12', endDate: '2026-04-17', progress: 55, dependencies: ['t-ssr'] },
        { id: 't-e2e', title: 'Playwright Cross-Browser Gate', startDate: '2026-04-16', endDate: '2026-04-20', progress: 30, dependencies: ['t-docs'] },
        { id: 't-rc', title: 'v0.1.0 Release Candidate', startDate: '2026-04-20', endDate: '2026-04-20', progress: 0, milestone: true, dependencies: ['t-e2e'] },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-task-select']);
    },
  },

  'mth-pivot-table': {
    attrs: {
      aggregator: 'sum',
      'show-totals': true,
      label: 'Regional Subscription Revenue Pivot',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      rowDimensions: ['region', 'tier'],
      columnDimensions: ['quarter'],
      valueFields: ['revenue'],
      rows: [
        { region: 'North America', tier: 'Enterprise', quarter: 'Q1', revenue: 148000 },
        { region: 'North America', tier: 'Enterprise', quarter: 'Q2', revenue: 164000 },
        { region: 'North America', tier: 'Growth', quarter: 'Q1', revenue: 72000 },
        { region: 'North America', tier: 'Growth', quarter: 'Q2', revenue: 81000 },
        { region: 'Europe', tier: 'Enterprise', quarter: 'Q1', revenue: 112000 },
        { region: 'Europe', tier: 'Enterprise', quarter: 'Q2', revenue: 129000 },
        { region: 'Europe', tier: 'Growth', quarter: 'Q1', revenue: 54000 },
        { region: 'Europe', tier: 'Growth', quarter: 'Q2', revenue: 61500 },
        { region: 'APAC', tier: 'Enterprise', quarter: 'Q1', revenue: 86000 },
        { region: 'APAC', tier: 'Enterprise', quarter: 'Q2', revenue: 97500 },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-pivot-change', 'mth-group-toggle']);
    },
  },

  'mth-scheduler': {
    attrs: {
      'start-date': '2026-04-06',
      days: 7,
      label: 'Cluster Maintenance & Release Windows',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      resources: [
        { id: 'r-core', label: 'Core Runtime' },
        { id: 'r-edge', label: 'Edge Workers' },
        { id: 'r-docs', label: 'Docs & Preview' },
        { id: 'r-qa', label: 'QA Lab' },
      ],
      events: [
        { id: 'e-1', resourceId: 'r-core', title: 'Lit 3.2 Upgrade', startDate: '2026-04-06', endDate: '2026-04-07' },
        { id: 'e-2', resourceId: 'r-edge', title: 'WASM Cache Warmup', startDate: '2026-04-07', endDate: '2026-04-09' },
        { id: 'e-3', resourceId: 'r-docs', title: 'Satellite Demo Freeze', startDate: '2026-04-08', endDate: '2026-04-10' },
        { id: 'e-4', resourceId: 'r-qa', title: 'Chromium/WebKit Matrix', startDate: '2026-04-10', endDate: '2026-04-12' },
        { id: 'e-5', resourceId: 'r-core', title: 'Canary Promotion', startDate: '2026-04-11', endDate: '2026-04-12' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-event-select', 'mth-date-navigate']);
    },
  },

  'mth-tree-table': {
    attrs: {
      'sub-rows-key': 'children',
      selectable: true,
      label: 'Workspace Packages & Conformance',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      columns: [
        { id: 'name', header: 'Package', accessorKey: 'name' },
        { id: 'kind', header: 'Tier', accessorKey: 'kind' },
        { id: 'sizeKb', header: 'Bundle (KB)', accessorKey: 'sizeKb' },
        { id: 'coverage', header: 'Specs', accessorKey: 'coverage' },
      ],
      expandedIds: ['pkg-core', 'pkg-satellites'],
      rows: [
        {
          id: 'pkg-core',
          name: '@methane-ui/core',
          kind: 'foundation',
          sizeKb: 18.4,
          coverage: '100%',
          children: [
            { id: 'core-aria', name: 'same-root-aria', kind: 'module', sizeKb: 4.2, coverage: '100%' },
            { id: 'core-face', name: 'form-internals', kind: 'module', sizeKb: 3.9, coverage: '100%' },
          ],
        },
        {
          id: 'pkg-satellites',
          name: '@methane-ui/satellites',
          kind: 'domain',
          sizeKb: 142.0,
          coverage: '100%',
          children: [
            { id: 'sat-charts', name: '@methane-ui/charts', kind: 'satellite', sizeKb: 24.6, coverage: '2 tags' },
            { id: 'sat-datagrid', name: '@methane-ui/datagrid', kind: 'satellite', sizeKb: 28.1, coverage: '5 tags' },
            { id: 'sat-maps', name: '@methane-ui/maps', kind: 'satellite', sizeKb: 36.5, coverage: '7 tags' },
          ],
        },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-expand-change', 'mth-selection-change']);
    },
  },

  'mth-markdown': {
    attrs: {
      label: 'Methane architecture overview',
    },
    style: 'inline-size:100%;min-block-size:14rem',
    props: {
      content: [
        '# Methane UI Specification',
        '',
        'Every element compiles from a **single source of truth**:',
        '',
        '- Same-root `ElementInternals` accessibility without wrapper `<div>` boilerplate',
        '- 4-tier logical CSS properties (`inline-size`, `block-size`, `margin-inline`)',
        '- Declarative Shadow DOM hydration across Astro, Next.js, Nuxt, and SvelteKit',
        '',
        '```ts',
        "import '@methane-ui/charts/chart';",
        '```',
      ].join('\n'),
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-render']);
    },
  },

  'mth-markdown-editor': {
    attrs: {
      name: 'release-notes',
      label: 'Release notes markdown editor',
      mode: 'split',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      value: [
        '## v0.1.0 Release Highlights',
        '',
        '- Added **offline-safe** vector & PDF preview pipelines.',
        '- Added 4-tier density presets (`compact`, `comfortable`, `spacious`).',
        '',
        '> Verify changes with `pnpm test` before publishing.',
      ].join('\n'),
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-input', 'mth-change', 'mth-mode-change']);
    },
  },

  'mth-math-editor': {
    attrs: {
      name: 'oklch-metric',
      label: 'OKLCH perceptual distance formula',
      'display-mode': true,
    },
    style: 'inline-size:100%;min-block-size:16rem',
    props: {
      value: '\\Delta E_{OK} = \\sqrt{(L_2 - L_1)^2 + (a_2 - a_1)^2 + (b_2 - b_1)^2}',
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-input', 'mth-change', 'mth-error']);
    },
  },

  'mth-rich-editor': {
    attrs: {
      name: 'product-brief',
      label: 'Rich formatted specification editor',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      value:
        '<h2>Methane Design System</h2><p>Author structured content with <strong>ProseMirror</strong>, <em>semantic headings</em>, and <code>inline code</code>.</p><ul><li>Accessible toolbar controls</li><li>Clean HTML serialization</li></ul>',
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-input', 'mth-change']);
    },
  },

  'mth-flow-editor': {
    attrs: {
      direction: 'LR',
      'edge-style': 'bezier',
      'auto-layout': true,
      label: 'Build & Hydration DAG',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      nodes: [
        { id: 'n-spec', label: 'Behavior Spec', type: 'input', width: 140, height: 48 },
        { id: 'n-tokens', label: 'Compile Tokens', type: 'process', width: 150, height: 48 },
        { id: 'n-ssr', label: 'Render DSD HTML', type: 'process', width: 150, height: 48 },
        { id: 'n-verify', label: 'E2E Conformance', type: 'output', width: 150, height: 48 },
      ],
      edges: [
        { id: 'e-1', source: 'n-spec', target: 'n-tokens', label: 'CSS' },
        { id: 'e-2', source: 'n-tokens', target: 'n-ssr', label: 'Templates' },
        { id: 'e-3', source: 'n-ssr', target: 'n-verify', label: 'Hydrate' },
        { id: 'e-4', source: 'n-spec', target: 'n-verify', label: 'ARIA checks' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-node-select', 'mth-layout-complete', 'mth-viewport-change']);
    },
  },

  'mth-org-chart': {
    attrs: {
      direction: 'TB',
      label: 'Platform Engineering Hierarchy',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      nodes: [
        { id: 'org-vp', name: 'Elena Rostova', title: 'VP Platform', department: 'Engineering', parentId: null },
        { id: 'org-design', name: 'Marcus Vance', title: 'Design Systems Lead', department: 'UI Core', parentId: 'org-vp' },
        { id: 'org-runtime', name: 'Aria Chen', title: 'SSR & Hydration Lead', department: 'Runtime', parentId: 'org-vp' },
        { id: 'org-a11y', name: 'Nadia Okafor', title: 'Accessibility Staff', department: 'UI Core', parentId: 'org-design' },
        { id: 'org-vis', name: 'Devon Park', title: 'Data Vis Engineer', department: 'UI Core', parentId: 'org-design' },
        { id: 'org-edge', name: 'Samir Patel', title: 'Edge Telemetry Lead', department: 'Runtime', parentId: 'org-runtime' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-node-select', 'mth-node-toggle']);
    },
  },

  'mth-floor-plan': {
    attrs: {
      level: 'L2',
      multiple: true,
      label: 'Engineering Studio Floor L2',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      selectedIds: ['room-studio'],
      rooms: [
        { id: 'room-studio', name: 'Design Studio', x: 20, y: 20, width: 170, height: 110, level: 'L2' },
        { id: 'room-lab', name: 'Hardware QA Lab', x: 210, y: 20, width: 160, height: 110, level: 'L2' },
        { id: 'room-commons', name: 'Open Commons', x: 20, y: 150, width: 220, height: 100, level: 'L2' },
        { id: 'room-pod', name: 'Focus Pod B', x: 260, y: 150, width: 110, height: 100, level: 'L2' },
        { id: 'room-lobby', name: 'Main Atrium', x: 20, y: 20, width: 350, height: 140, level: 'L1' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-room-select', 'mth-floor-zoom']);
    },
  },

  'mth-location-picker': {
    attrs: {
      name: 'datacenter-location',
      value: '37.774900,-122.419400',
      'default-value': '37.774900,-122.419400',
      label: 'Primary edge POP coordinates',
      step: 0.005,
    },
    style: 'inline-size:100%;min-block-size:20rem',
    setup(ctx) {
      attachEventReadout(ctx, ['mth-location-select', 'change']);
    },
  },

  'mth-map': {
    attrs: {
      'center-lng': -122.4194,
      'center-lat': 37.7749,
      zoom: 11.2,
      interactive: true,
      label: 'Offline San Francisco Bay Telemetry Map',
    },
    style: 'inline-size:100%;min-block-size:22rem',
    props: {
      mapStyle: OFFLINE_MAP_STYLE,
      markers: [
        { id: 'm-sf', lng: -122.4194, lat: 37.7749, label: 'SF Civic Edge' },
        { id: 'm-oak', lng: -122.2711, lat: 37.8044, label: 'Oakland Relay' },
        { id: 'm-marin', lng: -122.4783, lat: 37.8199, label: 'Golden Gate Node' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-marker-select', 'mth-map-move']);
    },
  },

  'mth-map-cluster': {
    attrs: {
      radius: 48,
      zoom: 10,
      'max-zoom': 16,
      label: 'Regional POP Cluster Density',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      points: [
        { id: 'p-1', lng: -122.4194, lat: 37.7749, label: 'SF Civic' },
        { id: 'p-2', lng: -122.4089, lat: 37.7858, label: 'Market St' },
        { id: 'p-3', lng: -122.3921, lat: 37.7912, label: 'Embarcadero' },
        { id: 'p-4', lng: -122.4355, lat: 37.7642, label: 'Mission Dolores' },
        { id: 'p-5', lng: -122.2711, lat: 37.8044, label: 'Oakland Downtown' },
        { id: 'p-6', lng: -122.2585, lat: 37.8715, label: 'Berkeley Hub' },
        { id: 'p-7', lng: -122.3012, lat: 37.8351, label: 'Emeryville' },
        { id: 'p-8', lng: -122.1430, lat: 37.4419, label: 'Palo Alto' },
        { id: 'p-9', lng: -122.0838, lat: 37.3861, label: 'Mountain View' },
        { id: 'p-10', lng: -121.8863, lat: 37.3382, label: 'San Jose Core' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-cluster-expand', 'mth-cluster-select']);
    },
  },

  'mth-map-draw': {
    attrs: {
      mode: 'polygon',
      label: 'Service Geofence Draw Canvas',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      features: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: 'zone-alpha', role: 'primary' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-122.45, 37.79],
                  [-122.39, 37.79],
                  [-122.39, 37.75],
                  [-122.45, 37.75],
                  [-122.45, 37.79],
                ],
              ],
            },
          },
          {
            type: 'Feature',
            properties: { id: 'fiber-link' },
            geometry: {
              type: 'LineString',
              coordinates: [
                [-122.44, 37.78],
                [-122.40, 37.76],
              ],
            },
          },
        ],
      },
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-draw-change', 'mth-draw-mode']);
    },
  },

  'mth-map-route': {
    attrs: {
      unit: 'km',
      label: 'Multi-hop Transit Route',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      origin: { lng: -122.4194, lat: 37.7749, label: 'San Francisco POP' },
      waypoints: [{ lng: -122.2711, lat: 37.8044, label: 'Oakland Relay' }],
      destination: { lng: -121.8863, lat: 37.3382, label: 'San Jose POP' },
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-route-fit', 'mth-waypoint-select']);
    },
  },

  'mth-seat-map': {
    attrs: {
      name: 'auditorium-seats',
      value: 'A2',
      'default-value': 'A2',
      columns: 4,
      multiple: true,
      label: 'Design Review Auditorium Seating',
    },
    style: 'inline-size:100%;min-block-size:18rem',
    props: {
      seats: [
        { id: 'A1', label: 'A1', row: 'A', tier: 'front', status: 'available' },
        { id: 'A2', label: 'A2', row: 'A', tier: 'front', status: 'available' },
        { id: 'A3', label: 'A3', row: 'A', tier: 'front', status: 'occupied' },
        { id: 'A4', label: 'A4', row: 'A', tier: 'front', status: 'available' },
        { id: 'B1', label: 'B1', row: 'B', tier: 'standard', status: 'available' },
        { id: 'B2', label: 'B2', row: 'B', tier: 'standard', status: 'occupied' },
        { id: 'B3', label: 'B3', row: 'B', tier: 'standard', status: 'available' },
        { id: 'B4', label: 'B4', row: 'B', tier: 'standard', status: 'available' },
        { id: 'C1', label: 'C1', row: 'C', tier: 'balcony', status: 'disabled' },
        { id: 'C2', label: 'C2', row: 'C', tier: 'balcony', status: 'available' },
        { id: 'C3', label: 'C3', row: 'C', tier: 'balcony', status: 'available' },
        { id: 'C4', label: 'C4', row: 'C', tier: 'balcony', status: 'occupied' },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-seat-select', 'change']);
    },
  },

  'mth-image-annotator': {
    attrs: {
      alt: 'System architecture schematic',
      tool: 'rect',
      label: 'Architecture Schematic Annotator',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      annotations: [
        { id: 'ann-1', type: 'rect', x: 56, y: 48, width: 224, height: 140, color: '#38bdf8' },
        { id: 'ann-2', type: 'arrow', x: 274, y: 120, x2: 330, y2: 120, color: '#f59e0b' },
        { id: 'ann-3', type: 'text', x: 344, y: 214, text: 'Primary Region', color: '#a7f3d0' },
      ],
    },
    setup(ctx) {
      const target = ctx.target as EventTargetWithProps;
      const posterUrl = createBlueprintBlobUrl();
      if (posterUrl) {
        target.src = posterUrl;
      }
      attachEventReadout(ctx, [
        'mth-annotation-add',
        'mth-annotation-change',
        'mth-annotation-select',
        'mth-tool-change',
      ]);
    },
  },

  'mth-lottie': {
    attrs: {
      autoplay: true,
      loop: true,
      speed: 1,
      playing: true,
      controls: true,
      label: 'Offline Vector Orbital Preview',
    },
    style: 'inline-size:100%;min-block-size:16rem',
    setup(ctx) {
      let running = true;
      let phase = 0;

      const drawFrame = (): void => {
        const canvas = ctx.target.shadowRoot?.querySelector('[part="canvas"]');
        if (!(canvas instanceof HTMLCanvasElement)) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const w = canvas.width || 320;
        const h = canvas.height || 200;
        context.clearRect(0, 0, w, h);

        context.fillStyle = '#0f172a';
        context.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const baseR = Math.min(w, h) * 0.28;

        context.strokeStyle = 'rgba(99, 102, 241, 0.45)';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(cx, cy, baseR, 0, Math.PI * 2);
        context.stroke();

        const orbX = cx + Math.cos(phase) * baseR;
        const orbY = cy + Math.sin(phase) * baseR;

        context.fillStyle = '#38bdf8';
        context.beginPath();
        context.arc(orbX, orbY, 8, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#818cf8';
        context.beginPath();
        context.arc(cx, cy, 12 + Math.sin(phase * 2) * 3, 0, Math.PI * 2);
        context.fill();
      };

      const tick = (): void => {
        if (!ctx.target.isConnected) return;
        if (running) {
          phase += 0.04;
        }
        drawFrame();
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(tick);
        }
      };

      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(tick);
      } else {
        drawFrame();
      }

      ctx.target.addEventListener('mth-play', () => {
        running = true;
        ctx.setReadout('mth-play');
      });
      ctx.target.addEventListener('mth-pause', () => {
        running = false;
        ctx.setReadout('mth-pause');
      });
      ctx.target.addEventListener('mth-stop', () => {
        running = false;
        phase = 0;
        drawFrame();
        ctx.setReadout('mth-stop');
      });
      ctx.target.addEventListener('mth-error', () => {
        ctx.setReadout('mth-error');
      });
    },
  },

  'mth-waveform': {
    attrs: {
      playing: false,
      'current-time': 0.28,
      duration: 0.9,
      'bar-count': 48,
      label: 'Synthesized C-Major Chord Waveform',
    },
    style: 'inline-size:100%;min-block-size:10rem',
    props: {
      peaks: createWaveformPeaks(48),
    },
    setup(ctx) {
      const target = ctx.target as EventTargetWithProps;
      const wavUrl = createChordWavBlobUrl();
      if (wavUrl) {
        target.src = wavUrl;
      }
      attachEventReadout(ctx, ['mth-play', 'mth-pause', 'mth-seek', 'mth-error']);
    },
  },

  'mth-pdf-viewer': {
    attrs: {
      'document-title': 'Methane-Architecture-Brief.pdf',
      page: 1,
      'show-toolbar': true,
      'show-outline': true,
    },
    style: 'inline-size:100%;min-block-size:26rem',
    props: {
      data: createSamplePdfBytes(),
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-pdf-load', 'mth-page-change', 'mth-zoom-change', 'mth-search-change', 'mth-pdf-error']);
    },
  },

  'mth-audio-recorder': {
    attrs: {
      'mime-type': 'audio/webm',
      'max-duration': 120,
      label: 'Voice note recorder',
    },
    style: 'inline-size:100%;min-block-size:12rem',
    setup(ctx) {
      attachEventReadout(ctx, ['mth-state-change', 'mth-record-complete', 'mth-error']);
    },
  },

  'mth-camera-capture': {
    attrs: {
      'facing-mode': 'user',
      'mime-type': 'image/png',
      quality: 0.92,
      label: 'Snapshot camera capture',
    },
    style: 'inline-size:100%;min-block-size:16rem',
    setup(ctx) {
      attachEventReadout(ctx, ['mth-capture', 'mth-permission-change', 'mth-device-change', 'mth-error']);
    },
  },

  'mth-screen-recorder': {
    attrs: {
      'system-audio': false,
      'mime-type': 'video/webm',
      label: 'Session screen capture',
    },
    style: 'inline-size:100%;min-block-size:12rem',
    setup(ctx) {
      attachEventReadout(ctx, ['mth-state-change', 'mth-record-complete', 'mth-error']);
    },
  },

  'mth-video-grid': {
    attrs: {
      layout: 'gallery',
      'active-speaker-id': 'p-aria',
      'pinned-id': 'p-aria',
      columns: 2,
      label: 'Architecture Review Call',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      participants: [
        { id: 'p-aria', name: 'Aria Chen', muted: false, videoOff: true, speaking: true, pinned: true },
        { id: 'p-marcus', name: 'Marcus Vance', muted: true, videoOff: true, speaking: false, pinned: false },
        { id: 'p-nadia', name: 'Nadia Okafor', muted: false, videoOff: true, speaking: false, pinned: false },
        { id: 'p-devon', name: 'Devon Park', muted: true, videoOff: true, speaking: false, pinned: false },
      ],
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-pin-change', 'mth-layout-change']);
    },
  },

  'mth-formula-bar': {
    attrs: {
      name: 'active-formula',
      'cell-address': 'D6',
      value: '=SUM(D2:D5)',
      placeholder: 'Enter scalar or =FORMULA(...)',
      label: 'Active cell formula bar',
    },
    style: 'inline-size:100%',
    setup(ctx) {
      attachEventReadout(ctx, ['mth-formula-input', 'mth-formula-commit']);
    },
  },

  'mth-spreadsheet': {
    attrs: {
      rows: 7,
      cols: 5,
      'address-mode': 'A1',
      'active-cell': 'D6',
      label: 'Quarterly Infrastructure Budget',
    },
    style: 'inline-size:100%;min-block-size:20rem',
    props: {
      cells: {
        A1: 'Category',
        B1: 'Q1 ($)',
        C1: 'Q2 ($)',
        D1: 'Total',
        E1: 'Avg',
        A2: 'Compute',
        B2: '4200',
        C2: '4800',
        D2: '=SUM(B2:C2)',
        E2: '=AVERAGE(B2:C2)',
        A3: 'Edge CDN',
        B3: '1850',
        C3: '2150',
        D3: '=SUM(B3:C3)',
        E3: '=AVERAGE(B3:C3)',
        A4: 'Storage',
        B4: '940',
        C4: '1060',
        D4: '=SUM(B4:C4)',
        E4: '=AVERAGE(B4:C4)',
        A5: 'Observability',
        B5: '1320',
        C5: '1480',
        D5: '=SUM(B5:C5)',
        E5: '=AVERAGE(B5:C5)',
        A6: 'Portfolio',
        B6: '=SUM(B2:B5)',
        C6: '=SUM(C2:C5)',
        D6: '=SUM(D2:D5)',
        E6: '=AVERAGE(E2:E5)',
      },
    },
    setup(ctx) {
      attachEventReadout(ctx, ['mth-cell-select', 'mth-cell-change']);
    },
  },
};
