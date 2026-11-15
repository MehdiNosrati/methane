import type { MessageCatalog } from '@methane/core';

export const floorPlanMessages = {
  regionLabel: 'Interactive floor plan',
  levelLabel: 'Level {level}',
  roomsLabel: 'Rooms',
  zoomIn: 'Zoom in floor plan',
  zoomOut: 'Zoom out floor plan',
  resetPanZoom: 'Reset floor plan view',
  roomSelected: '{name} (selected)',
  roomUnavailable: '{name} (unavailable)',
} satisfies MessageCatalog;
