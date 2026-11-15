export const captchaSlotMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Verification challenge',
  challengeMissing: 'Please complete the security verification.',
  resetLabel: 'Reset verification',
  verifiedStatus: 'Verified',
  pendingStatus: 'Verification required',
} as const satisfies Record<string, string>;
