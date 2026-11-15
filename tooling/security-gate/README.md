# `@methane/security-gate`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Strict Content Security Policy (CSP) + Trusted Types runtime compliance suite, Declarative Shadow DOM (DSD) CSP HTML auditor, permissive supply-chain license auditor, and GitHub Actions workflow security gate for **Methane UI**.

## Installation

```bash
pnpm add -D @methane/security-gate
# or
npm install -D @methane/security-gate
```

## Exported API

| Symbol | Category | Description |
| --- | --- | --- |
| `installTrustedTypesAndCspGuards(options?)` | CSP / Trusted Types | Installs enforcing Trusted Types (`createHTML`, `createScript`, `createScriptURL`) and DOM sink monitors for `innerHTML` / inline script violations |
| `runStrictCspSuite(options?)` | CSP / Trusted Types | Executes runtime CSP & Trusted Types compliance checks against `@methane/core`, `@methane/primitives`, `@methane/sanitize`, and `@methane/ssr` |
| `auditDsdHtmlForCsp(html)` | SSR Audit | Scans server-rendered DSD HTML for inline event handlers (`on*`), `javascript:` URLs, or unguarded `<script>` tags |
| `auditWorkspaceLicenses(options)` | Supply Chain | Audits workspace/lockfile dependencies against `ALLOWED_PERMISSIVE_LICENSES` and `BANNED_LICENSE_PATTERNS` |
| `evaluateLicenseExpression(expr)` | Supply Chain | Parses SPDX license expressions (e.g. `MIT OR Apache-2.0`) |
| `auditWorkflowFiles(paths)` | CI Security | Inspects `.github/workflows/*.yml` for unpinned third-party actions, unsafe `pull_request_target`, and script injection sinks |

## Usage Examples

### Auditing SSR Declarative Shadow DOM & Strict Trusted Types

```ts
import { auditDsdHtmlForCsp, runStrictCspSuite } from '@methane/security-gate';

const cspSuite = await runStrictCspSuite();
if (!cspSuite.passed) {
  throw new Error('CSP / Trusted Types violations detected');
}

const dsdReport = auditDsdHtmlForCsp(ssrHtml);
console.log('DSD CSP safe:', dsdReport.passed);
```

### Checking Workspace Dependency Licenses in CI

```ts
import { auditWorkspaceLicenses } from '@methane/security-gate';

const licenseAudit = await auditWorkspaceLicenses({ rootDir: process.cwd() });
if (!licenseAudit.passed) {
  console.error(licenseAudit.violations);
  process.exitCode = 1;
}
```

## Notes

- Intended for CI security gates and Vitest compliance verification across web component packages, SSR output, and repository workflows.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
