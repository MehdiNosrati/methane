import { KITS_DEMO_SPECS } from './kits-demos.js';
import { SATELLITES_DEMO_SPECS } from './satellites-demos.js';
import type { DemoSpec } from './types.js';
import { UI_DEMO_SPECS } from './ui-demos.js';

export type { DemoNode, DemoSetupContext, DemoSpec } from './types.js';
export { renderDemoHtml, renderDemoNode, escapeHtml } from './render-html.js';
export {
  loadDemoSpec,
  loadDemoSpecsForGroup,
  loadPreviewPackage,
  type PreviewPackageGroup,
} from './package-loader.js';
export { UI_DEMO_SPECS, KITS_DEMO_SPECS, SATELLITES_DEMO_SPECS };

export const ALL_DEMO_SPECS: Readonly<Record<string, DemoSpec>> = {
  ...UI_DEMO_SPECS,
  ...KITS_DEMO_SPECS,
  ...SATELLITES_DEMO_SPECS,
};
