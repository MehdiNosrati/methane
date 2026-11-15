import { defineComponents } from '@methane/core';
import { MthBookingWidget } from './booking-widget.js';

export {
  MthBookingWidget,
  type BookingDaySlots,
} from './booking-widget.js';
export { bookingWidgetMessages } from './booking-widget.messages.js';
export { bookingWidgetSpec } from './booking-widget.spec.js';
export { bookingWidgetStyles } from './booking-widget.styles.js';

export function registerMthBookingWidget(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-booking-widget': MthBookingWidget },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-booking-widget': MthBookingWidget;
  }
}
