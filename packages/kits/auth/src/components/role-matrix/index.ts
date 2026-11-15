import { registerMthRoleMatrix } from './element.js';

export * from './element.js';

registerMthRoleMatrix();

declare global {
  interface HTMLElementTagNameMap {
    'mth-role-matrix': import('./role-matrix.js').MthRoleMatrix;
  }
}
