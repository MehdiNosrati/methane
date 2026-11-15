import {
  DataController,
  FormControlController,
  InputController,
  ListboxController,
  OverlayController,
  PositioningController,
  SlotCollectionController,
  type DataControllerStatus,
  type DataSource,
  type Placement,
} from '@methane-ui/primitives';
import type { PropertyValues, UIElement } from '@methane-ui/core';
import { comboboxMessages } from './combobox.messages.js';
import type { ComboboxOption } from './combobox-options.js';

export interface ComboboxControllersHost {
  readonly element: UIElement;
  readonly internals: ElementInternals | null;
  readonly placement: Placement;
  readonly forceFallback: boolean;
  readonly getError: () => string;
  readonly shouldSkipSlotReconcile: () => boolean;
  readonly getCustomValidityMessage: () => string;
  readonly getControlElement: () => HTMLElement | null;
  readonly getPopupElement: () => HTMLElement | null;
  readonly getListboxElement: () => HTMLElement | null;
  readonly getOptionElements: () => HTMLElement[];
  readonly onValueSync: (nextValue: string) => void;
  readonly onUserTextCommit: (nextValue: string) => void;
  readonly onActiveOptionChange: (activeId: string) => void;
  readonly onListboxSelection: (values: ReadonlyArray<string>) => void;
  readonly onReconcileOptions: () => void;
  readonly onDataStateChange: (status: DataControllerStatus) => void;
  readonly onOverlayOpenChange: (nextOpen: boolean) => void;
  readonly setCustomState: (name: string, active: boolean) => void;
}

export interface ComboboxControllersBundle {
  readonly formCtrl: FormControlController;
  readonly inputCtrl: InputController;
  readonly listboxCtrl: ListboxController;
  readonly slotCtrl: SlotCollectionController<HTMLElement, ComboboxOption>;
  readonly dataCtrl: DataController<ComboboxOption, string>;
  readonly overlayCtrl: OverlayController;
  readonly positioningCtrl: PositioningController;
}

/**
 * Instantiates and wires the 7 ADR-001 controllers backing `<mth-combobox>`.
 */
export function createComboboxControllers(host: ComboboxControllersHost): ComboboxControllersBundle {
  const { element } = host;

  const formCtrl: FormControlController = new FormControlController(element, {
    internals: host.internals,
    defaultValue: '',
    messages: comboboxMessages,
    onValueSync: host.onValueSync,
    onDisabledChange: () => {
      element.requestUpdate();
    },
    onSetCustomState: (stateName, active) => {
      host.setCustomState(stateName, active);
    },
    validator: () => {
      const customMsg = host.getCustomValidityMessage();
      if (customMsg.length > 0) {
        return { flags: { customError: true }, message: customMsg };
      }
      const ctxError = host.getError() || formCtrl.fieldContext?.error || '';
      if (ctxError.length > 0) {
        return { flags: { customError: true }, message: ctxError };
      }
      return null;
    },
  });

  const inputCtrl = new InputController(element, {
    onCommitValue: host.onUserTextCommit,
  });

  const listboxCtrl = new ListboxController(element, {
    focusMode: 'activedescendant',
    getListboxElement: host.getListboxElement,
    getOptionElements: host.getOptionElements,
    onActiveChange: (opt) => {
      host.onActiveOptionChange(opt?.id ?? '');
    },
    onSelectionChange: host.onListboxSelection,
  });

  const slotCtrl = new SlotCollectionController<HTMLElement, ComboboxOption>(element, {
    observeSubtree: true,
    attributeFilter: ['value', 'label', 'disabled'],
    onItemsChange: () => {
      if (host.shouldSkipSlotReconcile()) return;
      host.onReconcileOptions();
    },
  });

  const dataCtrl = new DataController<ComboboxOption, string>(element, {
    cacheTimeMs: 0,
    onStateChange: (status) => {
      host.onDataStateChange(status);
    },
  });

  const positioningCtrl = new PositioningController(element, {
    anchor: () => host.getControlElement() ?? element,
    floating: host.getPopupElement,
    placement: host.placement,
    offset: 4,
    flip: true,
    shift: true,
    forceFallback: host.forceFallback,
  });

  const overlayCtrl = new OverlayController(element, {
    mode: 'popover',
    surface: host.getPopupElement,
    closeOnEscape: true,
    lightDismiss: true,
    restoreFocus: true,
    onSetCustomState: (name, active) => {
      host.setCustomState(name, active);
    },
    onOpenChange: (nextOpen) => {
      if (!nextOpen) {
        positioningCtrl.stop();
      }
      host.onOverlayOpenChange(nextOpen);
    },
  });

  return {
    formCtrl,
    inputCtrl,
    listboxCtrl,
    slotCtrl,
    dataCtrl,
    overlayCtrl,
    positioningCtrl,
  };
}

export interface ComboboxWillUpdateHost {
  readonly hasUpdated: boolean;
  readonly defaultValue: string;
  readonly disabled: boolean;
  readonly isEffectivelyDisabled: boolean;
  readonly readonly: boolean;
  readonly required: boolean;
  readonly error: string;
  readonly multiple: boolean;
  readonly value: string;
  readonly open: boolean;
  readonly placement: Placement;
  readonly forceFallback: boolean;
  readonly options: ReadonlyArray<ComboboxOption> | null;
  readonly dataSource: DataSource<ComboboxOption, string> | null;
}

export interface ComboboxWillUpdateBridge {
  readonly pendingLazyOptionReconcile: boolean;
  readonly setPendingLazyOptionReconcile: (next: boolean) => void;
  readonly setCustomState: (name: string, active: boolean) => void;
  readonly syncSelectedFromValue: (rawValue: string) => void;
  readonly reconcileOptions: () => void;
}

/**
 * Synchronizes reactive property mutations into the ADR-001 combobox controllers during `willUpdate`.
 */
export function syncComboboxWillUpdate(
  host: ComboboxWillUpdateHost,
  bridge: ComboboxWillUpdateBridge,
  ctrls: ComboboxControllersBundle,
  changedProperties: PropertyValues<ComboboxWillUpdateHost>,
): void {
  const { formCtrl, slotCtrl, dataCtrl, positioningCtrl } = ctrls;

  if (changedProperties.has('defaultValue')) formCtrl.setDefaultValue(host.defaultValue);
  if (changedProperties.has('disabled')) {
    formCtrl.hostDisabled = host.disabled;
    bridge.setCustomState('disabled', host.isEffectivelyDisabled);
  }
  if (changedProperties.has('readonly')) {
    formCtrl.hostReadOnly = host.readonly;
    bridge.setCustomState('readonly', host.readonly);
  }
  if (changedProperties.has('required')) {
    formCtrl.required = host.required;
    bridge.setCustomState('required', host.required);
    formCtrl.validate();
  }
  if (changedProperties.has('error')) formCtrl.validate();
  if (changedProperties.has('multiple')) bridge.syncSelectedFromValue(host.value);
  if (changedProperties.has('value')) {
    bridge.syncSelectedFromValue(host.value);
    if (formCtrl.value !== host.value) formCtrl.setValue(host.value, { markDirty: false });
  }
  if (changedProperties.has('options') && (host.options !== null || host.hasUpdated)) {
    bridge.setPendingLazyOptionReconcile(false);
    slotCtrl.setPropertyItems(host.options);
    bridge.reconcileOptions();
  }
  if (changedProperties.has('dataSource') && (host.dataSource !== null || host.hasUpdated)) {
    bridge.setPendingLazyOptionReconcile(false);
    dataCtrl.setDataSource(host.dataSource);
    bridge.reconcileOptions();
  }
  if (changedProperties.has('open') && host.open && bridge.pendingLazyOptionReconcile) {
    bridge.setPendingLazyOptionReconcile(false);
    bridge.reconcileOptions();
  }
  if (changedProperties.has('placement') || changedProperties.has('forceFallback')) {
    positioningCtrl.updateOptions({
      placement: host.placement,
      forceFallback: host.forceFallback,
    });
  }
}
