import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const ALLOWED_PERMISSIVE_LICENSES: ReadonlySet<string> = new Set([
  'MIT',
  'MIT-0',
  '0BSD',
  'Apache-2.0',
  'Apache 2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-3-Clause-Clear',
  'BSD',
  'ISC',
  'MPL-2.0',
  'CC0-1.0',
  'Unlicense',
  'WTFPL',
  'BlueOak-1.0.0',
  'Python-2.0',
  'PSF-2.0',
  'Zlib',
  'Artistic-2.0',
  'PostgreSQL',
]);

export const BANNED_LICENSE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bA?L?GPL\b/i,
  /\bGPL[-\s]?\d/i,
  /\bAGPL/i,
  /\bLGPL/i,
  /\bSSPL/i,
  /\bBUSL/i,
  /\bBSL-1\./i,
  /Commons[\s-]+Clause/i,
  /\bCPAL\b/i,
  /\bOSL-\d/i,
  /\bEUPL\b/i,
  /\bRPL-\d/i,
  /\bQPL\b/i,
  /\bUNLICENSED\b/i,
  /\bPROPRIETARY\b/i,
];

export interface AuditedPackageRecord {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly location: string;
  readonly permissive: boolean;
  readonly reason?: string;
}

export interface LicenseAuditOptions {
  readonly workspaceRoot?: string;
  readonly additionalAllowed?: ReadonlyArray<string>;
  readonly includeApps?: boolean;
}

export interface LicenseAuditResult {
  readonly passed: boolean;
  readonly workspaceRoot: string;
  readonly totalPackages: number;
  readonly packages: ReadonlyArray<AuditedPackageRecord>;
  readonly violations: ReadonlyArray<AuditedPackageRecord>;
}

function findWorkspaceRoot(startDir = process.cwd()): string {
  let current = resolve(startDir);
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return resolve(startDir);
}

function extractLicenseString(pkgJson: Record<string, unknown>): string {
  const lic = pkgJson.license;
  if (typeof lic === 'string' && lic.trim().length > 0) {
    return lic.trim();
  }
  if (typeof lic === 'object' && lic !== null && 'type' in lic) {
    const typeVal = (lic as { type?: unknown }).type;
    if (typeof typeVal === 'string' && typeVal.trim().length > 0) {
      return typeVal.trim();
    }
  }
  const licenses = pkgJson.licenses;
  if (Array.isArray(licenses) && licenses.length > 0) {
    const parts: string[] = [];
    for (const entry of licenses) {
      if (typeof entry === 'string') {
        parts.push(entry);
      } else if (typeof entry === 'object' && entry !== null && 'type' in entry) {
        const t = (entry as { type?: unknown }).type;
        if (typeof t === 'string') parts.push(t);
      }
    }
    if (parts.length > 0) {
      return parts.join(' OR ');
    }
  }
  return 'MISSING';
}

function stripOuterParens(expr: string): string {
  let s = expr.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let matchesWhole = true;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth += 1;
      else if (s[i] === ')') depth -= 1;
      if (depth === 0 && i < s.length - 1) {
        matchesWhole = false;
        break;
      }
    }
    if (!matchesWhole) break;
    s = s.slice(1, -1).trim();
  }
  return s;
}

function splitTopLevelOperator(expr: string, operator: 'OR' | 'AND'): string[] | null {
  const parts: string[] = [];
  let depth = 0;
  let lastIdx = 0;
  const token = ` ${operator} `;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const slice = expr.slice(i, i + token.length);
      if (slice.toUpperCase() === token) {
        parts.push(expr.slice(lastIdx, i).trim());
        lastIdx = i + token.length;
        i += token.length - 1;
      }
    }
  }

  if (parts.length === 0) return null;
  parts.push(expr.slice(lastIdx).trim());
  return parts;
}

/**
 * Evaluates a license string or SPDX expression against the ADR-013 permissive allowlist.
 */
export function evaluateLicenseExpression(
  rawLicense: string,
  additionalAllowed: ReadonlyArray<string> = [],
): { readonly permissive: boolean; readonly reason?: string } {
  const cleaned = stripOuterParens(rawLicense);
  if (!cleaned || cleaned === 'MISSING') {
    return { permissive: false, reason: 'Missing license metadata' };
  }

  const orBranches = splitTopLevelOperator(cleaned, 'OR');
  if (orBranches) {
    const results = orBranches.map((b) => evaluateLicenseExpression(b, additionalAllowed));
    if (results.some((r) => r.permissive)) {
      return { permissive: true };
    }
    return {
      permissive: false,
      reason: `No permissive branch in OR expression "${rawLicense}"`,
    };
  }

  const andBranches = splitTopLevelOperator(cleaned, 'AND');
  if (andBranches) {
    for (const branch of andBranches) {
      const res = evaluateLicenseExpression(branch, additionalAllowed);
      if (!res.permissive) {
        return {
          permissive: false,
          reason: `Non-permissive branch "${branch}" in AND expression "${rawLicense}"`,
        };
      }
    }
    return { permissive: true };
  }

  // Handle legacy slash-separated dual licenses like "MIT/X11" or "MIT/Apache-2.0"
  if (cleaned.includes('/') && !cleaned.startsWith('SEE ')) {
    const slashParts = cleaned.split('/').map((p) => p.trim());
    if (slashParts.some((p) => evaluateLicenseExpression(p, additionalAllowed).permissive)) {
      return { permissive: true };
    }
  }

  for (const banned of BANNED_LICENSE_PATTERNS) {
    if (banned.test(cleaned)) {
      return {
        permissive: false,
        reason: `Banned non-permissive license "${cleaned}" (ADR-013)`,
      };
    }
  }

  const extraSet = new Set(additionalAllowed.map((l) => l.toLowerCase()));
  if (ALLOWED_PERMISSIVE_LICENSES.has(cleaned) || extraSet.has(cleaned.toLowerCase())) {
    return { permissive: true };
  }

  for (const allowed of ALLOWED_PERMISSIVE_LICENSES) {
    if (allowed.toLowerCase() === cleaned.toLowerCase()) {
      return { permissive: true };
    }
  }

  return {
    permissive: false,
    reason: `Unapproved license "${cleaned}" not in ADR-013 permissive allowlist`,
  };
}

function resolvePackageInAncestorNodeModules(fromDir: string, depName: string): string | null {
  let current = fromDir;
  for (let i = 0; i < 12; i++) {
    const candidate = join(current, 'node_modules', depName, 'package.json');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function collectDirectNodeModulesEntries(nmDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(nmDir)) return results;
  let entries: string[];
  try {
    entries = readdirSync(nmDir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry === '.bin' || entry === '.modules.yaml' || entry === '.pnpm') continue;
    const full = join(nmDir, entry);
    if (entry.startsWith('@')) {
      try {
        for (const scoped of readdirSync(full)) {
          const pj = join(full, scoped, 'package.json');
          if (existsSync(pj)) results.push(pj);
        }
      } catch {
        // ignore non-dir
      }
    } else {
      const pj = join(full, 'package.json');
      if (existsSync(pj)) results.push(pj);
    }
  }
  return results;
}

function collectPackageJsonPaths(workspaceRoot: string, includeApps = false): string[] {
  const visitedRealPaths = new Set<string>();
  const collected: string[] = [];
  const queue: Array<{ pkgJsonPath: string; isWorkspaceRootOrMember: boolean }> = [];

  function enqueue(pkgJsonPath: string, isWorkspaceRootOrMember: boolean): void {
    let realPj: string;
    try {
      realPj = realpathSync(pkgJsonPath);
    } catch {
      realPj = resolve(pkgJsonPath);
    }
    if (visitedRealPaths.has(realPj)) return;
    visitedRealPaths.add(realPj);
    collected.push(realPj);
    queue.push({ pkgJsonPath: realPj, isWorkspaceRootOrMember });
  }

  const rootPj = join(workspaceRoot, 'package.json');
  if (existsSync(rootPj)) {
    enqueue(rootPj, true);
  }

  for (const pj of collectDirectNodeModulesEntries(join(workspaceRoot, 'node_modules'))) {
    enqueue(pj, false);
  }

  const groups = includeApps
    ? ['packages', 'packages/kits', 'packages/satellites', 'tooling', 'apps']
    : ['packages', 'packages/kits', 'packages/satellites', 'tooling'];

  for (const group of groups) {
    const groupDir = join(workspaceRoot, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir)) {
      const pkgDir = join(groupDir, entry);
      try {
        if (!statSync(pkgDir).isDirectory()) continue;
      } catch {
        continue;
      }
      const pj = join(pkgDir, 'package.json');
      if (existsSync(pj)) {
        enqueue(pj, true);
      }
      for (const directDep of collectDirectNodeModulesEntries(join(pkgDir, 'node_modules'))) {
        enqueue(directDep, false);
      }
    }
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(readFileSync(item.pkgJsonPath, 'utf8')) as Record<string, unknown>;
    } catch {
      continue;
    }

    const depBuckets = item.isWorkspaceRootOrMember
      ? ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
      : ['dependencies', 'optionalDependencies', 'peerDependencies'];

    const pkgDir = dirname(item.pkgJsonPath);
    for (const bucket of depBuckets) {
      const deps = parsed[bucket];
      if (typeof deps !== 'object' || deps === null || Array.isArray(deps)) continue;
      for (const depName of Object.keys(deps as Record<string, unknown>)) {
        const resolved = resolvePackageInAncestorNodeModules(pkgDir, depName);
        if (resolved) {
          enqueue(resolved, false);
        }
      }
    }
  }

  return collected.sort();
}

/**
 * Walks published workspace packages (`packages/**`, `tooling/**`) and their reachable
 * dependency closures in `node_modules`, enforcing the ADR-013 permissive-only license policy.
 */
export function auditWorkspaceLicenses(
  options: LicenseAuditOptions = {},
): LicenseAuditResult {
  const workspaceRoot = resolve(options.workspaceRoot ?? findWorkspaceRoot());
  const pkgPaths = collectPackageJsonPaths(workspaceRoot, options.includeApps ?? false);
  const seen = new Map<string, AuditedPackageRecord>();
  const rootPkgCandidate = join(workspaceRoot, 'package.json');
  const rootPkgRealPath = existsSync(rootPkgCandidate) ? realpathSync(rootPkgCandidate) : null;

  for (const pjPath of pkgPaths) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(readFileSync(pjPath, 'utf8')) as Record<string, unknown>;
    } catch {
      continue;
    }

    // Skip private workspace root container if it has no license field
    if (rootPkgRealPath !== null && pjPath === rootPkgRealPath && parsed.private === true && !parsed.license) {
      continue;
    }

    const name = typeof parsed.name === 'string' ? parsed.name : '';
    const version = typeof parsed.version === 'string' ? parsed.version : '0.0.0';
    if (!name) continue;

    const dedupeKey = `${name}@${version}`;
    if (seen.has(dedupeKey)) continue;

    const license = extractLicenseString(parsed);
    const evalResult = evaluateLicenseExpression(license, options.additionalAllowed);

    const record: AuditedPackageRecord = {
      name,
      version,
      license,
      location: pjPath,
      permissive: evalResult.permissive,
      ...(evalResult.reason !== undefined ? { reason: evalResult.reason } : {}),
    };
    seen.set(dedupeKey, record);
  }

  const packages = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  const violations = packages.filter((p) => !p.permissive);

  return {
    passed: violations.length === 0,
    workspaceRoot,
    totalPackages: packages.length,
    packages,
    violations,
  };
}
