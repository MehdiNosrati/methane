import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export interface PackageAuditViolation {
  readonly packageName: string;
  readonly location: string;
  readonly rule: 'duplicate-dep-and-peer' | 'invalid-methane-peer-range' | 'version-skew';
  readonly message: string;
}

export interface PackageAuditOptions {
  readonly workspaceRoot?: string;
  readonly expectedVersion?: string;
  readonly expectedMethanePeerRange?: string;
  readonly allowPreMergeCoreVersion?: boolean;
}

export interface PackageAuditResult {
  readonly passed: boolean;
  readonly workspaceRoot: string;
  readonly totalManifests: number;
  readonly violations: ReadonlyArray<PackageAuditViolation>;
}

interface PackageManifestShape {
  readonly name?: string;
  readonly version?: string;
  readonly private?: boolean;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
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
 * Audits workspace `package.json` manifests for ADR-007 invariants:
 * 1. No package lists the same dependency in both `dependencies` and `peerDependencies`.
 * 2. All `@methane/*` `peerDependencies` ranges equal `"^0.1.0"` (never `||` or `*`).
 * 3. Every publishable (`private !== true`) package has uniform `"0.1.0"` version.
 */
export function auditWorkspacePackages(options: PackageAuditOptions = {}): PackageAuditResult {
  const workspaceRoot = options.workspaceRoot ? resolve(options.workspaceRoot) : findWorkspaceRoot();
  const expectedVersion = options.expectedVersion ?? '0.1.0';
  const expectedPeerRange = options.expectedMethanePeerRange ?? '^0.1.0';
  const allowPreMergeCoreVersion = options.allowPreMergeCoreVersion ?? true;

  const manifestPaths = collectWorkspacePackageJsonPaths(workspaceRoot);
  const violations: PackageAuditViolation[] = [];

  for (const manifestPath of manifestPaths) {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifestShape;
    const pkgName = raw.name ?? relative(workspaceRoot, manifestPath);
    const location = relative(workspaceRoot, manifestPath) || 'package.json';
    const deps = raw.dependencies ?? {};
    const peers = raw.peerDependencies ?? {};

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
      if (peerName.startsWith('@methane/') && range !== expectedPeerRange) {
        violations.push({
          packageName: pkgName,
          location,
          rule: 'invalid-methane-peer-range',
          message: `peerDependency "${peerName}" has range "${range}" instead of "${expectedPeerRange}"`,
        });
      }
    }

    if (raw.private !== true) {
      const isPreMergeCore =
        allowPreMergeCoreVersion && pkgName === '@methane/core' && raw.version === '1.0.0';
      if (!isPreMergeCore && raw.version !== expectedVersion) {
        violations.push({
          packageName: pkgName,
          location,
          rule: 'version-skew',
          message: `publishable package version is "${raw.version ?? 'missing'}" instead of "${expectedVersion}"`,
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    workspaceRoot,
    totalManifests: manifestPaths.length,
    violations,
  };
}
