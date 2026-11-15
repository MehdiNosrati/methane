import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export interface PackageAuditViolation {
  readonly packageName: string;
  readonly location: string;
  readonly rule:
    | 'duplicate-dep-and-peer'
    | 'invalid-methane-peer-range'
    | 'version-skew'
    | 'missing-readme'
    | 'forbidden-peer-dependency-rules'
    | 'publishable-core-dependency'
    | 'public-depends-on-private';
  readonly message: string;
}

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export interface PackageAuditOptions {
  readonly workspaceRoot?: string;
  readonly expectedVersion?: string;
  readonly expectedMethanePeerRange?: string;
  readonly minReadmeBytes?: number;
}

export interface PackageAuditResult {
  readonly passed: boolean;
  readonly workspaceRoot: string;
  readonly totalManifests: number;
  readonly publishableCount: number;
  readonly violations: ReadonlyArray<PackageAuditViolation>;
}

interface PackageManifestShape {
  readonly name?: string;
  readonly version?: string;
  readonly private?: boolean;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly pnpm?: {
    readonly peerDependencyRules?: unknown;
  };
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

function collectWorkspacePackageJsonPaths(rootDir: string): string[] {
  const results: string[] = [];
  const rootPkg = join(rootDir, 'package.json');
  if (existsSync(rootPkg)) {
    results.push(rootPkg);
  }

  for (const topDir of ['packages', 'tooling', 'apps']) {
    const absTop = join(rootDir, topDir);
    if (!existsSync(absTop)) continue;
    walkPackageManifests(absTop, results);
  }

  return results.sort((a, b) => a.localeCompare(b));
}

function walkPackageManifests(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.') ||
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'build' ||
      entry.name === 'generated'
    ) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPackageManifests(full, out);
    } else if (entry.isFile() && entry.name === 'package.json') {
      out.push(full);
    }
  }
}

/**
 * Audits workspace `package.json` manifests for ADR-007 & release hygiene invariants:
 * 1. No package lists the same dependency in both `dependencies` and `peerDependencies`.
 * 2. All `@methane-ui/*` `peerDependencies` ranges equal `"^<expectedVersion>"` (never `||` or `*`).
 * 3. Every publishable (`private !== true`) package has uniform valid semver matching `expectedVersion` (or the inferred uniform version).
 * 4. Every publishable (`private !== true`) package includes a non-empty `README.md` (>= 300 bytes).
 * 5. No publishable (`private !== true`) package lists a `private: true` workspace package in `dependencies` or `peerDependencies`.
 */
export function auditWorkspacePackages(options: PackageAuditOptions = {}): PackageAuditResult {
  const workspaceRoot = options.workspaceRoot ? resolve(options.workspaceRoot) : findWorkspaceRoot();
  const minReadmeBytes = options.minReadmeBytes ?? 300;

  const manifestPaths = collectWorkspacePackageJsonPaths(workspaceRoot);
  const manifests = manifestPaths.map((manifestPath) => {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifestShape;
    const pkgName = raw.name ?? relative(workspaceRoot, manifestPath);
    const location = relative(workspaceRoot, manifestPath) || 'package.json';
    return { manifestPath, raw, pkgName, location };
  });

  const privatePackageNames = new Set(
    manifests
      .filter((m) => m.raw.private === true && typeof m.raw.name === 'string')
      .map((m) => m.raw.name as string),
  );

  const envExpectedVersion = process.env['METHANE_EXPECTED_VERSION'];
  const explicitExpectedVersion =
    options.expectedVersion ?? (envExpectedVersion ? envExpectedVersion : undefined);
  const inferredVersion = manifests.find(
    (m) => m.raw.private !== true && typeof m.raw.version === 'string' && SEMVER_RE.test(m.raw.version),
  )?.raw.version;
  const expectedVersion = explicitExpectedVersion ?? inferredVersion;
  const expectedPeerRange =
    options.expectedMethanePeerRange ?? (expectedVersion ? `^${expectedVersion}` : undefined);

  const violations: PackageAuditViolation[] = [];
  let publishableCount = 0;

  for (const { manifestPath, raw, pkgName, location } of manifests) {
    const deps = raw.dependencies ?? {};
    const peers = raw.peerDependencies ?? {};

    if (location === 'package.json' && raw.pnpm?.peerDependencyRules !== undefined) {
      violations.push({
        packageName: pkgName,
        location,
        rule: 'forbidden-peer-dependency-rules',
        message: 'root package.json must not define pnpm.peerDependencyRules',
      });
    }

    if (
      raw.private !== true &&
      pkgName !== '@methane-ui/core' &&
      Object.prototype.hasOwnProperty.call(deps, '@methane-ui/core')
    ) {
      violations.push({
        packageName: pkgName,
        location,
        rule: 'publishable-core-dependency',
        message: 'publishable package must list "@methane-ui/core" in peerDependencies/devDependencies, never dependencies',
      });
    }

    if (raw.private !== true) {
      for (const field of ['dependencies', 'peerDependencies'] as const) {
        const record = raw[field] ?? {};
        for (const depName of Object.keys(record)) {
          if (privatePackageNames.has(depName)) {
            violations.push({
              packageName: pkgName,
              location,
              rule: 'public-depends-on-private',
              message: `publishable package must not depend on private workspace package "${depName}" in ${field}`,
            });
          }
        }
      }
    }

    for (const depName of Object.keys(deps)) {
      if (Object.prototype.hasOwnProperty.call(peers, depName)) {
        violations.push({
          packageName: pkgName,
          location,
          rule: 'duplicate-dep-and-peer',
          message: `"${depName}" is listed in both dependencies and peerDependencies`,
        });
      }
    }

    for (const [peerName, range] of Object.entries(peers)) {
      if (
        peerName.startsWith('@methane-ui/') &&
        expectedPeerRange !== undefined &&
        range !== expectedPeerRange
      ) {
        violations.push({
          packageName: pkgName,
          location,
          rule: 'invalid-methane-peer-range',
          message: `peerDependency "${peerName}" has range "${range}" instead of "${expectedPeerRange}"`,
        });
      }
    }

    if (raw.private !== true) {
      publishableCount += 1;
      if (typeof raw.version !== 'string' || !SEMVER_RE.test(raw.version)) {
        violations.push({
          packageName: pkgName,
          location,
          rule: 'version-skew',
          message: `publishable package version "${raw.version ?? 'missing'}" is not valid semver`,
        });
      } else if (expectedVersion !== undefined && raw.version !== expectedVersion) {
        violations.push({
          packageName: pkgName,
          location,
          rule: 'version-skew',
          message: `publishable package version is "${raw.version}" instead of "${expectedVersion}"`,
        });
      }

      const readmePath = join(dirname(manifestPath), 'README.md');
      const readmeSize = existsSync(readmePath) ? statSync(readmePath).size : 0;
      if (readmeSize < minReadmeBytes) {
        violations.push({
          packageName: pkgName,
          location: relative(workspaceRoot, readmePath),
          rule: 'missing-readme',
          message: `publishable package README.md is ${readmeSize} bytes (minimum ${minReadmeBytes} bytes required)`,
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    workspaceRoot,
    totalManifests: manifestPaths.length,
    publishableCount,
    violations,
  };
}
