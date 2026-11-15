import type { MessageCatalog } from '@methane-ui/core';

export const seatMapMessages = {
  defaultLabel: 'Seat selection',
  stageLabel: 'Stage / Front',
  legendAvailable: 'Available',
  legendSelected: 'Selected',
  legendOccupied: 'Occupied',
  seatAvailableLabel: 'Seat {label}, {tier}, available',
  seatSelectedLabel: 'Seat {label}, {tier}, selected',
  seatOccupiedLabel: 'Seat {label}, {tier}, occupied',
  seatDisabledLabel: 'Seat {label}, unavailable',
  defaultTier: 'Standard',
  selectedCount: '{count} selected',
  requiredError: 'Please select at least one seat.',
} satisfies MessageCatalog;
