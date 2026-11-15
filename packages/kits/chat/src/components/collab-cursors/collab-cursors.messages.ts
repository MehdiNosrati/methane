export const collabCursorsMessages = {
  overlayLabel: 'Collaborator cursors',
  anonymousUser: 'Collaborator',
} as const satisfies Record<string, string>;

export type CollabCursorsMessages = typeof collabCursorsMessages;
