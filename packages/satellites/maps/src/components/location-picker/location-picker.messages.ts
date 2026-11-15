import type { MessageCatalog } from '@methane-ui/core';

export const locationPickerMessages = {
  defaultLabel: 'Location',
  pinInstructions: 'Move location pin',
  nudgeWest: 'Move west',
  nudgeEast: 'Move east',
  nudgeNorth: 'Move north',
  nudgeSouth: 'Move south',
  clearLabel: 'Clear location',
  noLocationSelected: 'No coordinates selected',
  coordinateSummary: '{lat}, {lng}',
  requiredError: 'Please select a location.',
  invalidFormatError: 'Location must be formatted as latitude,longitude.',
} satisfies MessageCatalog;
