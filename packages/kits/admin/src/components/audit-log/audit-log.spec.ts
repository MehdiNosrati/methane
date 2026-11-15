import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { auditLogMessages } from './audit-log.messages.js';

export const auditLogSpec: ComponentBehaviorSpec = {
  tag: 'mth-audit-log',
  package: '@methane-ui/admin',
  conformance: ['data-consumer'],
  controllers: ['DataController', 'VirtualizerController'],
  focusModel: 'delegates-focus',
  states: ['loading', 'empty', 'error'],
  keyboard: [],
  props: [
    { name: 'entries', attr: false, type: 'ReadonlyArray<AuditLogEntry>', default: undefined },
    { name: 'dataSource', attr: false, type: 'DataSource<AuditLogEntry, AuditLogFilter> | null', default: undefined },
    { name: 'severity', attr: 'severity', type: "'all' | 'info' | 'warning' | 'critical'", default: 'all' },
    { name: 'search', attr: 'search', type: 'string', default: '' },
    { name: 'rowHeight', attr: 'row-height', type: 'number', default: 56 },
  ],
  events: [
    { name: 'mth-entry-select', cancelable: false, detailType: '{ entry: AuditLogEntry }' },
    { name: 'mth-filter-change', cancelable: false, detailType: '{ search: string; severity: AuditSeverityFilter }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer audit log container.' },
    { name: 'filters', description: 'Search and severity filter toolbar.' },
    { name: 'viewport', description: 'Virtualized scrollable timeline viewport.' },
    { name: 'row', description: 'Audit log entry row.' },
  ],
  messages: auditLogMessages,
};

export const CEM_METADATA = {
  description: 'Chronological virtualized audit log (`<mth-audit-log>`) powered by DataController and VirtualizerController with actor/action/resource/severity filtering.',
  propDescriptions: {
    entries: 'Static array of audit log entries.',
    dataSource: 'Async DataSource<AuditLogEntry, AuditLogFilter> adapter.',
    severity: 'Severity filter (`all`, `info`, `warning`, `critical`).',
    search: 'Actor/action/resource search string.',
    rowHeight: 'Estimated row height in pixels for VirtualizerController.',
  },
  eventDescriptions: {
    'mth-entry-select': 'Emitted when an audit entry is activated.',
    'mth-filter-change': 'Emitted when search or severity filter changes.',
  },
};
