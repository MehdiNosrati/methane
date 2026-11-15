// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(THIS_DIR, '../../..');

const SATELLITE_TAGS = [
  'mth-rich-editor',
  'mth-code-editor',
  'mth-json-editor',
  'mth-chart',
  'mth-pdf-viewer',
  'mth-model-viewer',
  'mth-map',
  'mth-datagrid',
  'mth-spreadsheet',
  'mth-video-grid',
  'mth-flow-editor',
  'mth-waveform',
] as const;

describe('Pure-Node SSR barrel imports and satellite DSD rendering', () => {
  it('imports @methane-ui/ui, all 5 kits, and all 11 satellites in pure Node without jsdom and renders valid DSD templates', () => {
    const script = `
import './packages/ssr/dist/dom-shim.js';
import { transformHtmlDsd } from './packages/ssr/dist/index.js';
import './packages/ui/dist/define.js';

const kits = ['admin', 'ai', 'auth', 'chat', 'commerce'];
for (const kit of kits) {
  await import('./packages/kits/' + kit + '/dist/define.js');
}

const satellites = ['3d', 'charts', 'code', 'datagrid', 'editor', 'flow', 'maps', 'media', 'pdf', 'rtc', 'spreadsheet'];
for (const sat of satellites) {
  await import('./packages/satellites/' + sat + '/dist/define.js');
}

const tags = ${JSON.stringify(SATELLITE_TAGS)};
const results = [];
for (const tag of tags) {
  const rendered = await transformHtmlDsd('<' + tag + '></' + tag + '>');
  results.push({
    tag,
    defined: Boolean(customElements.get(tag)),
    hasDsdTemplate: rendered.html.includes('shadowrootmode="open"'),
  });
}
process.stdout.write(JSON.stringify(results));
`;

    const stdout = execFileSync(process.execPath, ['--input-type=module', '-'], {
      cwd: REPO_ROOT,
      input: script,
      encoding: 'utf8',
      timeout: 30_000,
    });

    const parsed = JSON.parse(stdout) as Array<{
      tag: string;
      defined: boolean;
      hasDsdTemplate: boolean;
    }>;

    expect(parsed).toHaveLength(SATELLITE_TAGS.length);
    for (const entry of parsed) {
      expect(entry.defined, `Expected <${entry.tag}> custom element to be registered`).toBe(true);
      expect(
        entry.hasDsdTemplate,
        `Expected <${entry.tag}> to emit Declarative Shadow DOM template`,
      ).toBe(true);
    }
  });
});
