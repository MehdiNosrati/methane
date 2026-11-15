import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import type { DataSource } from '@methane-ui/primitives';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  DataConsumerSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { auditLogSpec } from './audit-log.spec.js';
import {
  MthAuditLog,
  registerMthAuditLog,
  type AuditLogEntry,
  type AuditLogFilter,
} from './index.js';

describe('<mth-audit-log>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes DataConsumerSuite', async () => {
    registerMthAuditLog();
    const compiled = compileSpec(auditLogSpec);
    expect(compiled.docs).toContain('`<mth-audit-log>`');

    const adapter = {
      mount: async (ds: unknown) => {
        const el = document.createElement('mth-audit-log') as MthAuditLog;
        const rawSource = ds as DataSource<{ id: string; label: string }, string>;
        el.dataSource = {
          query: async (q) => {
            const res = await rawSource.query({
              ...q,
              filter: q.filter?.search ?? '',
            });
            return {
              items: res.items.map((item) => ({
                id: item.id,
                actor: item.label,
                action: 'updated',
                resource: 'settings',
                timestamp: '2026-11-15T00:00:00Z',
                severity: 'info' as const,
              })),
              total: res.total ?? res.items.length,
            };
          },
        };
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      triggerQuery: async (el: HTMLElement, filter?: string) => {
        const log = el as MthAuditLog;
        await log.query({ search: filter ?? '', severity: log.severity });
        await log.updateComplete;
      },
      getState: (el: HTMLElement) => (el as MthAuditLog).dataStatus,
      getRenderedItemCount: (el: HTMLElement) =>
        el.shadowRoot!.querySelectorAll('[part="row"]').length,
    };

    const report = await DataConsumerSuite.run(adapter);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(auditLogSpec, {
      dataConsumer: adapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('filters entries by actor/resource and severity cleanly', async () => {
    registerMthAuditLog();
    const el = document.createElement('mth-audit-log') as MthAuditLog;
    const sample: AuditLogEntry[] = [
      { id: '1', actor: 'alice', action: 'login', resource: 'auth', timestamp: '2026-11-15T00:00:00Z', severity: 'info' },
      { id: '2', actor: 'bob', action: 'delete_key', resource: 'api-keys', timestamp: '2026-11-15T01:00:00Z', severity: 'critical' },
    ];
    el.dataSource = {
      async query(req) {
        const f: AuditLogFilter | undefined = req.filter;
        const items = sample.filter((entry) => {
          if (f?.severity && f.severity !== 'all' && entry.severity !== f.severity) return false;
          return !f?.search || entry.actor.includes(f.search);
        });
        return { items, total: items.length, nextCursor: null };
      },
    };
    document.body.appendChild(el);
    await el.query({ severity: 'critical', search: '' });
    await el.updateComplete;

    expect(el.renderedItems).toHaveLength(1);
    expect(el.renderedItems[0]?.actor).toBe('bob');

    const sheetsBefore = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBe(sheetsBefore);

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-audit-log severity="all"></mth-audit-log>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-audit-log>', 'hyd-audit-log>')
      .replaceAll('<mth-audit-log', '<hyd-audit-log');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAuditLog('hyd');
        customElements.upgrade(host);
        await (host as MthAuditLog).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
