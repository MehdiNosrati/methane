import { defineComponents } from '@methane-ui/core';
import { MthSeatMap } from './seat-map.js';
import { seatMapMessages } from './seat-map.messages.js';
import { seatMapStyles } from './seat-map.styles.js';

export { MthSeatMap, seatMapMessages, seatMapStyles };
export type { SeatDefinition, SeatStatus } from './seat-map.js';

export function registerMthSeatMap(prefix?: string): string {
  return defineComponents({
    ...(prefix ? { prefix } : {}),
    components: { 'mth-seat-map': MthSeatMap },
  })[0]!;
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-seat-map': MthSeatMap;
  }
}
