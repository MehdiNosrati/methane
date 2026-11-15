import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { roleMatrixMessages } from './role-matrix.messages.js';

export const roleMatrixSpec: ComponentBehaviorSpec = {
  tag: 'mth-role-matrix',
  package: '@methane-ui/auth',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'host',
  states: ['readonly', 'disabled'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'Grid cell focused', expect: 'Moves focus to next column cell' },
    { key: 'ArrowDown', when: 'Grid cell focused', expect: 'Moves focus to cell in next row' },
  ],
  props: [
    { name: 'roles', attr: false, type: 'ReadonlyArray<RoleMatrixRole>' },
    { name: 'permissions', attr: false, type: 'ReadonlyArray<RoleMatrixPermission>' },
    { name: 'grants', attr: false, type: 'RoleMatrixGrants' },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ roleId: string; permissionId: string; granted: boolean; grants: RoleMatrixGrants }',
    },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Scrollable matrix wrapper.' },
    { name: 'table', description: 'Semantic grid table.' },
    { name: 'checkbox', description: 'Individual role/permission grant checkbox.' },
  ],
  messages: { ...roleMatrixMessages },
};

export const CEM_METADATA = {
  description:
    'Interactive role-by-permission authorization matrix grid with 2D roving keyboard navigation and readonly enforcement.',
  propDescriptions: {
    roles: 'Columns representing roles.',
    permissions: 'Rows representing permissions.',
    grants: 'Mapping of role ID to granted permission IDs.',
    readonly: 'Prevents mutating role permission grants while keeping navigation intact.',
    disabled: 'Disables all matrix cells.',
    label: 'Accessible label for the permissions grid.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when a permission grant is toggled.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Matrix container background color.' },
    { name: '--mth-color-accent', description: 'Granted checkbox accent color.' },
  ],
};
