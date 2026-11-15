declare const __DEV__: boolean | undefined;

/**
 * Tree-shakable development mode check.
 * Bundlers can replace `__DEV__` with `false` for dead-code elimination.
 */
export function isDevMode(): boolean {
  if (typeof __DEV__ === 'boolean') {
    return __DEV__;
  }
  if (typeof process !== 'undefined' && typeof process.env === 'object' && process.env !== null) {
    return process.env['NODE_ENV'] !== 'production';
  }
  return false;
}

export function devWarn(message: string, ...args: unknown[]): void {
  if (isDevMode() && typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(`[methane] ${message}`, ...args);
  }
}
