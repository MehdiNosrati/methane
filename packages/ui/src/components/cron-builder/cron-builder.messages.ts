import type { MessageCatalog } from '@methane/core';

export const cronBuilderMessages: MessageCatalog = {
  builderLabel: 'Cron schedule builder',
  minute: 'Minute',
  hour: 'Hour',
  dayOfMonth: 'Day (month)',
  month: 'Month',
  dayOfWeek: 'Day (week)',
  presetsLabel: 'Quick presets',
  presetEvery15Min: 'Every 15 min',
  presetHourly: 'Hourly',
  presetDaily: 'Daily 00:00',
  presetWeekdays: 'Weekdays 09:00',
  invalidExpression: 'Enter a valid 5-part cron expression',
  summaryPrefix: 'Schedule:',
  summaryEvery15Min: '{prefix} Every 15 minutes',
  summaryHourly: '{prefix} Every hour at minute 0',
  summaryDaily: '{prefix} Daily at 00:00',
  summaryWeekdays: '{prefix} Weekdays at 09:00',
  summaryCustom: '{prefix} minute {minute}, hour {hour}, day {day}, month {month}, weekday {weekday}',
};
