type ClassDecoratorFn = (target: object) => unknown;
type MemberDecoratorFn = (
  target: object,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
) => unknown;

/**
 * Shared TypeScript legacy-decorator helper deduplicated across Methane UI component packages.
 */
export function __decorate(
  decorators: ReadonlyArray<ClassDecoratorFn | MemberDecoratorFn>,
  target: object,
  key?: string | symbol,
  desc?: PropertyDescriptor | null,
): unknown {
  const c = arguments.length;
  let r: unknown =
    c < 3
      ? target
      : desc === null
        ? (desc = Object.getOwnPropertyDescriptor(target, key!))
        : desc;
  const reflectDecorate = (
    Reflect as unknown as {
      decorate?: (
        d: ReadonlyArray<ClassDecoratorFn | MemberDecoratorFn>,
        t: object,
        k?: string | symbol,
        desc?: PropertyDescriptor,
      ) => unknown;
    }
  ).decorate;
  if (typeof reflectDecorate === 'function') {
    r = reflectDecorate(decorators, target, key, desc ?? undefined);
  } else {
    for (let i = decorators.length - 1; i >= 0; i--) {
      const d = decorators[i];
      if (d) {
        r =
          (c < 3
            ? (d as ClassDecoratorFn)(r as object)
            : c > 3
              ? (d as MemberDecoratorFn)(target, key, r as PropertyDescriptor)
              : (d as MemberDecoratorFn)(target, key)) || r;
      }
    }
  }
  if (c > 3 && r && key !== undefined) {
    Object.defineProperty(target, key, r as PropertyDescriptor);
  }
  return r;
}
