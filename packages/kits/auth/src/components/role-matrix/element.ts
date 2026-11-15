import { defineComponents } from '@methane-ui/core';
import { MthRoleMatrix } from './role-matrix.js';

export {
  MthRoleMatrix,
  type RoleMatrixGrants,
  type RoleMatrixPermission,
  type RoleMatrixRole,
} from './role-matrix.js';
export { roleMatrixMessages } from './role-matrix.messages.js';
export { roleMatrixStyles } from './role-matrix.styles.js';

export function registerMthRoleMatrix(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-role-matrix': MthRoleMatrix },
  });
}
