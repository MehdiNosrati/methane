import { defineComponents } from '@methane-ui/core';
import { MthSettingsShell } from './settings-shell.js';

export { MthSettingsShell, type SettingsSectionItem } from './settings-shell.js';
export { settingsShellMessages } from './settings-shell.messages.js';
export { settingsShellSpec } from './settings-shell.spec.js';
export { settingsShellStyles } from './settings-shell.styles.js';

export function registerMthSettingsShell(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-settings-shell': MthSettingsShell },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-settings-shell': MthSettingsShell;
  }
}
