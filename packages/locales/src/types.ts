export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'fr',
  'de',
  'ja',
  'zh-CN',
  'ar',
  'he',
] as const;

export type MethaneLocaleCode = (typeof SUPPORTED_LOCALES)[number];

export type TextDirection = 'ltr' | 'rtl';

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export type PluralForms = {
  readonly other: string;
} & Partial<Record<Exclude<PluralCategory, 'other'>, string>>;

export type MethaneMessageValue = string | PluralForms;

export interface MethaneCommonMessages {
  readonly close: string;
  readonly cancel: string;
  readonly confirm: string;
  readonly save: string;
  readonly reset: string;
  readonly clear: string;
  readonly search: string;
  readonly loading: string;
  readonly empty: string;
  readonly error: string;
  readonly retry: string;
  readonly copy: string;
  readonly copied: string;
  readonly expand: string;
  readonly collapse: string;
  readonly selectAll: string;
  readonly deselectAll: string;
  readonly showMore: string;
  readonly showLess: string;
  readonly required: string;
  readonly optional: string;
  readonly selectedCount: PluralForms;
}

export interface MethaneValidationMessages {
  readonly valueMissing: string;
  readonly typeMismatch: string;
  readonly patternMismatch: string;
  readonly tooShort: PluralForms;
  readonly tooLong: PluralForms;
  readonly rangeUnderflow: string;
  readonly rangeOverflow: string;
  readonly stepMismatch: string;
  readonly badInput: string;
  readonly customError: string;
  readonly errorSummaryTitle: PluralForms;
  readonly invalidEmail: string;
  readonly invalidUrl: string;
  readonly passwordMismatch: string;
}

export interface MethanePaginationMessages {
  readonly label: string;
  readonly previous: string;
  readonly next: string;
  readonly first: string;
  readonly last: string;
  readonly page: string;
  readonly pageOf: string;
  readonly itemsPerPage: string;
  readonly totalItems: PluralForms;
  readonly showingRange: string;
  readonly jumpToPage: string;
}

export interface MethaneCalendarMessages {
  readonly label: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly previousYear: string;
  readonly nextYear: string;
  readonly today: string;
  readonly clearDate: string;
  readonly selectDate: string;
  readonly selectRange: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly weekNumber: string;
  readonly selectedDate: string;
  readonly unavailableDate: string;
}

export interface MethaneOverlayMessages {
  readonly closeDialog: string;
  readonly closeDrawer: string;
  readonly dismissToast: string;
  readonly notifications: PluralForms;
  readonly clearNotifications: string;
  readonly tourStep: string;
  readonly tourNext: string;
  readonly tourPrevious: string;
  readonly tourFinish: string;
  readonly tourSkip: string;
}

export interface MethaneTableMessages {
  readonly empty: string;
  readonly loading: string;
  readonly error: string;
  readonly sortAscending: string;
  readonly sortDescending: string;
  readonly sortNone: string;
  readonly selectRow: string;
  readonly selectAllRows: string;
  readonly selectedRows: PluralForms;
  readonly expandRow: string;
  readonly collapseRow: string;
  readonly filterColumn: string;
  readonly clearFilters: string;
  readonly columnMenu: string;
  readonly pinColumn: string;
  readonly unpinColumn: string;
  readonly rowsCount: PluralForms;
}

export interface MethaneComboboxMessages {
  readonly placeholder: string;
  readonly noResults: string;
  readonly loading: string;
  readonly clearSelection: string;
  readonly removeTag: string;
  readonly createOption: string;
  readonly availableOptions: PluralForms;
  readonly selectedOptions: PluralForms;
  readonly toggleOptions: string;
}

export interface MethaneUploadMessages {
  readonly browseFiles: string;
  readonly dropzoneLabel: string;
  readonly dropzoneActive: string;
  readonly removeFile: string;
  readonly retryUpload: string;
  readonly uploading: string;
  readonly uploaded: string;
  readonly failed: string;
  readonly fileTooLarge: string;
  readonly invalidFileType: string;
  readonly maxFilesExceeded: PluralForms;
  readonly filesSelected: PluralForms;
}

export interface MethaneAnnouncerMessages {
  readonly resultsAvailable: PluralForms;
  readonly noResults: string;
  readonly optionSelected: string;
  readonly optionRemoved: string;
  readonly pageChanged: string;
  readonly sortedBy: string;
  readonly dialogOpened: string;
  readonly dialogClosed: string;
  readonly loadingStarted: string;
  readonly loadingFinished: string;
  readonly validationErrorCount: PluralForms;
  readonly copiedToClipboard: string;
  readonly itemMoved: string;
}

export interface MethaneMessages {
  readonly common: MethaneCommonMessages;
  readonly validation: MethaneValidationMessages;
  readonly pagination: MethanePaginationMessages;
  readonly calendar: MethaneCalendarMessages;
  readonly overlay: MethaneOverlayMessages;
  readonly table: MethaneTableMessages;
  readonly combobox: MethaneComboboxMessages;
  readonly upload: MethaneUploadMessages;
  readonly announcer: MethaneAnnouncerMessages;
}

export type MessageNamespace = keyof MethaneMessages;

export type MessageKey = {
  [NS in MessageNamespace]: `${NS}.${Extract<keyof MethaneMessages[NS], string>}`;
}[MessageNamespace];

export interface MethaneLocalePack {
  readonly locale: MethaneLocaleCode;
  readonly dir: TextDirection;
  readonly messages: MethaneMessages;
}

export type MessageParams = Readonly<Record<string, string | number | boolean>>;

export interface FormatMessageOptions {
  readonly locale?: string;
  readonly dir?: TextDirection;
  readonly pluralParam?: string;
  readonly isolateBidi?: boolean;
}

export interface LoadLocalePackOptions {
  readonly fallback?: MethaneLocaleCode | false;
}
