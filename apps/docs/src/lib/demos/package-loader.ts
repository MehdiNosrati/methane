import type { DemoSpec } from './types.js';

export type PreviewPackageGroup = 'ui' | 'kits' | 'satellites' | 'primitives';

interface RegisterableModule {
  registerAllComponents?: (prefix?: string) => ReadonlyArray<string>;
  registerUtilityElements?: (prefix?: string) => ReadonlyArray<string>;
}

const PACKAGE_LOADERS: Readonly<Record<string, () => Promise<RegisterableModule>>> = {
  '@methane-ui/ui': () => import('@methane-ui/ui') as Promise<RegisterableModule>,
  '@methane-ui/primitives': () => import('@methane-ui/primitives') as Promise<RegisterableModule>,
  '@methane-ui/admin': () => import('@methane-ui/admin') as Promise<RegisterableModule>,
  '@methane-ui/ai': () => import('@methane-ui/ai') as Promise<RegisterableModule>,
  '@methane-ui/auth': () => import('@methane-ui/auth') as Promise<RegisterableModule>,
  '@methane-ui/chat': () => import('@methane-ui/chat') as Promise<RegisterableModule>,
  '@methane-ui/commerce': () => import('@methane-ui/commerce') as Promise<RegisterableModule>,
  '@methane-ui/3d': () => import('@methane-ui/3d') as Promise<RegisterableModule>,
  '@methane-ui/charts': () => import('@methane-ui/charts') as Promise<RegisterableModule>,
  '@methane-ui/code': () => import('@methane-ui/code') as Promise<RegisterableModule>,
  '@methane-ui/datagrid': () => import('@methane-ui/datagrid') as Promise<RegisterableModule>,
  '@methane-ui/editor': () => import('@methane-ui/editor') as Promise<RegisterableModule>,
  '@methane-ui/flow': () => import('@methane-ui/flow') as Promise<RegisterableModule>,
  '@methane-ui/maps': () => import('@methane-ui/maps') as Promise<RegisterableModule>,
  '@methane-ui/media': () => import('@methane-ui/media') as Promise<RegisterableModule>,
  '@methane-ui/pdf': () => import('@methane-ui/pdf') as Promise<RegisterableModule>,
  '@methane-ui/rtc': () => import('@methane-ui/rtc') as Promise<RegisterableModule>,
  '@methane-ui/spreadsheet': () => import('@methane-ui/spreadsheet') as Promise<RegisterableModule>,
};

const loadedPackages = new Map<string, Promise<void>>();
const loadedDemoMaps = new Map<string, Promise<Readonly<Record<string, DemoSpec>>>>();

export function loadPreviewPackage(packageName: string): Promise<void> {
  const existing = loadedPackages.get(packageName);
  if (existing) return existing;

  const loader = PACKAGE_LOADERS[packageName];
  if (!loader) {
    return Promise.reject(new Error(`No dynamic package loader configured for "${packageName}"`));
  }

  const pending = loader().then((mod) => {
    mod.registerUtilityElements?.();
    mod.registerAllComponents?.();
  });

  loadedPackages.set(packageName, pending);
  return pending;
}

export function loadDemoSpecsForGroup(
  group: PreviewPackageGroup,
): Promise<Readonly<Record<string, DemoSpec>>> {
  const key = group === 'kits' ? 'kits' : group === 'satellites' ? 'satellites' : 'ui';
  const existing = loadedDemoMaps.get(key);
  if (existing) return existing;

  let pending: Promise<Readonly<Record<string, DemoSpec>>>;
  if (key === 'kits') {
    pending = import('./kits-demos.js').then((m) => m.KITS_DEMO_SPECS);
  } else if (key === 'satellites') {
    pending = import('./satellites-demos.js').then((m) => m.SATELLITES_DEMO_SPECS);
  } else {
    pending = import('./ui-demos.js').then((m) => m.UI_DEMO_SPECS);
  }

  loadedDemoMaps.set(key, pending);
  return pending;
}

export async function loadDemoSpec(
  group: PreviewPackageGroup,
  tagName: string,
): Promise<DemoSpec | undefined> {
  const map = await loadDemoSpecsForGroup(group);
  return map[tagName];
}
