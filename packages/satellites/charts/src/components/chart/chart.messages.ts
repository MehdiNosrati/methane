export const chartMessages = {
  chartLabel: 'Data visualization chart',
  loadingLabel: 'Loading chart data',
  emptyLabel: 'No chart data available',
  fallbackToggleShow: 'Show data table',
  fallbackToggleHide: 'Hide data table',
} as const;

export type ChartMessageKey = keyof typeof chartMessages;
