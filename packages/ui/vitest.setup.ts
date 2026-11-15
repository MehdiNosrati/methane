import { afterEach, vi } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('data-mth-theme');
  document.documentElement.removeAttribute('data-mth-contrast');
  document.documentElement.removeAttribute('data-mth-density');
  vi.useRealTimers();
  vi.restoreAllMocks();
});
