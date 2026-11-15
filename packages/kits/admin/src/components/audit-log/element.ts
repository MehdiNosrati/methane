import { defineComponents } from '@methane/core';
import { MthAuditLog } from './audit-log.js';

export {
  MthAuditLog,
  type AuditLogEntry,
  type AuditLogFilter,
  type AuditSeverity,
  type AuditSeverityFilter,
} from './audit-log.js';
export { auditLogMessages } from './audit-log.messages.js';
export { auditLogSpec } from './audit-log.spec.js';
export { auditLogStyles } from './audit-log.styles.js';

export function registerMthAuditLog(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-audit-log': MthAuditLog },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-audit-log': MthAuditLog;
  }
}
