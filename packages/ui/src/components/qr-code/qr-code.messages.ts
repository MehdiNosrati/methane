export const qrCodeMessages = {
  defaultLabel: 'QR code',
  emptyLabel: 'Empty QR code',
} as const satisfies Record<string, string>;

export type QrCodeMessages = typeof qrCodeMessages;
