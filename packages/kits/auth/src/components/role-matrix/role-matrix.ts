import { UIElement, html, nothing, property, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController } from '@methane-ui/primitives';
import { roleMatrixMessages } from './role-matrix.messages.js';
import { roleMatrixStyles } from './role-matrix.styles.js';

export interface RoleMatrixRole {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

export interface RoleMatrixPermission {
  readonly id: string;
  readonly label: string;
  readonly category?: string;
}

export type RoleMatrixGrants = Record<string, ReadonlyArray<string>>;

/**
 * `<mth-role-matrix>`: semantic `<table role="grid">` RBAC matrix with 2D RTL-aware
 * `RovingFocusController` and strict `readonly` + `disabled` guards.
 */
export class MthRoleMatrix extends UIElement {
  static override messages = roleMatrixMessages;
  static override styles = roleMatrixStyles;

  @property({ attribute: false })
  roles: ReadonlyArray<RoleMatrixRole> = [];

  @property({ attribute: false })
  permissions: ReadonlyArray<RoleMatrixPermission> = [];

  @property({ attribute: false })
  grants: RoleMatrixGrants = {};

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getCellControls(),
      orientation: 'both',
      columns: 1,
      loop: false,
      dir: this.resolvedDir,
    });
  }

  getCellControls(): HTMLInputElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLInputElement>('[part="checkbox"]'));
  }

  isGranted(roleId: string, permissionId: string): boolean {
    const roleGrants = this.grants[roleId];
    return Array.isArray(roleGrants) ? roleGrants.includes(permissionId) : false;
  }

  private resolveEffectiveDir(): 'ltr' | 'rtl' {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
      ? 'rtl'
      : 'ltr';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('readonly', this.readonly);
    this.setCustomState('disabled', this.disabled);
    this.rovingCtrl.updateOptions({
      columns: Math.max(1, this.roles.length),
      dir: this.resolveEffectiveDir(),
    });
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
    if (changedProperties.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    this.rovingCtrl.updateOptions({
      columns: Math.max(1, this.roles.length),
      dir: this.resolveEffectiveDir(),
    });
  }

  private handleCheckboxClick(event: Event): void {
    if (this.disabled || this.readonly) {
      event.preventDefault();
    }
  }

  private handleCheckboxChange(
    roleId: string,
    permissionId: string,
    event: Event,
  ): void {
    const input = event.target as HTMLInputElement;
    const currentlyGranted = this.isGranted(roleId, permissionId);

    if (this.disabled || this.readonly) {
      input.checked = currentlyGranted;
      return;
    }

    const nextGranted = input.checked;
    const prevList = this.grants[roleId] ?? [];
    const nextSet = new Set(prevList);
    if (nextGranted) {
      nextSet.add(permissionId);
    } else {
      nextSet.delete(permissionId);
    }

    const nextGrants: RoleMatrixGrants = {
      ...this.grants,
      [roleId]: Array.from(nextSet),
    };
    this.grants = nextGrants;

    this.emitEvent('mth-change', {
      detail: {
        roleId,
        permissionId,
        granted: nextGranted,
        grants: nextGrants,
      },
    });
  }

  override render() {
    const gridLabel = this.label || this.t('matrixLabel');
    const hasData = this.roles.length > 0 && this.permissions.length > 0;

    return html`
      <div part="base" class="container" dir=${this.resolveEffectiveDir()}>
        ${hasData
          ? html`
              <table part="table" class="grid-table" role="grid" aria-label=${gridLabel}>
                <thead>
                  <tr role="row">
                    <th scope="col" role="columnheader" class="perm-header">
                      ${this.t('permissionColumn')}
                    </th>
                    ${this.roles.map(
                      (role) => html`
                        <th
                          scope="col"
                          role="columnheader"
                          class="role-header"
                          title=${role.description ?? ''}
                        >
                          ${role.name}
                        </th>
                      `,
                    )}
                  </tr>
                </thead>
                <tbody>
                  ${this.permissions.map(
                    (perm, rowIndex) => html`
                      <tr role="row">
                        <th scope="row" role="rowheader" class="perm-cell">
                          <span class="perm-label">${perm.label}</span>
                          ${perm.category
                            ? html`<span class="perm-category">${perm.category}</span>`
                            : nothing}
                        </th>
                        ${this.roles.map((role, colIndex) => {
                          const granted = this.isGranted(role.id, perm.id);
                          const isFirst = rowIndex === 0 && colIndex === 0;
                          return html`
                            <td role="gridcell">
                              <input
                                part="checkbox"
                                class="cell-check"
                                type="checkbox"
                                tabindex=${isFirst ? 0 : -1}
                                .checked=${granted}
                                ?disabled=${this.disabled}
                                aria-readonly=${this.readonly ? 'true' : 'false'}
                                aria-label=${this.t('cellLabel', {
                                  permission: perm.label,
                                  role: role.name,
                                })}
                                @click=${this.handleCheckboxClick}
                                @change=${(ev: Event) =>
                                  this.handleCheckboxChange(role.id, perm.id, ev)}
                              />
                            </td>
                          `;
                        })}
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            `
          : html`<p class="empty">${this.t('emptyState')}</p>`}
      </div>
    `;
  }
}
