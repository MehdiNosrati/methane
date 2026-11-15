export const imageMessages = {
  loadError: 'Image failed to load',
  loadingLabel: 'Loading image',
} as const satisfies Record<string, string>;

export type ImageMessages = typeof imageMessages;
