import type {
  AttributeMigrationRule,
  EventMigrationRule,
  MigrationManifest,
  SlotMigrationRule,
  TagPrefixRewrite,
  TokenPrefixRewrite,
} from './types.js';

export interface ManifestValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface CompiledManifest {
  readonly manifest: MigrationManifest;
  rewriteTag(tagName: string): string;
  rewriteToken(tokenName: string): string;
  matchAttribute(
    tagName: string | null,
    attrName: string,
  ): AttributeMigrationRule | null;
  matchSlot(tagName: string | null, slotName: string): SlotMigrationRule | null;
  matchEvent(tagName: string | null, eventName: string): EventMigrationRule | null;
  matchReactEventProp(tagName: string | null, propName: string): { fromEvent: string; toEvent: string; toProp: string } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeTagFilter(
  tag: string | ReadonlyArray<string> | undefined,
): ReadonlyArray<string> | null {
  if (tag === undefined) return null;
  const list = typeof tag === 'string' ? [tag] : tag;
  return list.map((entry) => entry.toLowerCase());
}

/**
 * Convert a kebab-case custom event name (e.g. `mth-change`) to React JSX handler prop (`onMthChange`).
 */
export function toReactEventPropName(eventName: string): string {
  const parts = eventName
    .split(/[^a-zA-Z0-9]+/)
    .filter((segment) => segment.length > 0);
  const pascal = parts
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
  return `on${pascal}`;
}

export function validateMigrationManifest(input: unknown): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  if (!isRecord(input)) {
    issues.push({ path: '$', message: 'Manifest must be a JSON object.' });
    return issues;
  }

  if (!isNonEmptyString(input.version)) {
    issues.push({ path: 'version', message: 'Manifest "version" must be a non-empty string.' });
  }

  if (input.tagPrefix !== undefined) {
    if (!isRecord(input.tagPrefix)) {
      issues.push({ path: 'tagPrefix', message: '"tagPrefix" must be an object.' });
    } else {
      if (!isNonEmptyString(input.tagPrefix.fromPrefix) || !input.tagPrefix.fromPrefix.includes('-')) {
        issues.push({
          path: 'tagPrefix.fromPrefix',
          message: '"fromPrefix" must be a non-empty custom element prefix ending with "-" (e.g. "mth-").',
        });
      }
      if (!isNonEmptyString(input.tagPrefix.toPrefix) || !input.tagPrefix.toPrefix.includes('-')) {
        issues.push({
          path: 'tagPrefix.toPrefix',
          message: '"toPrefix" must be a non-empty custom element prefix containing "-" (e.g. "acme-").',
        });
      }
      if (input.tagPrefix.tags !== undefined && !Array.isArray(input.tagPrefix.tags)) {
        issues.push({ path: 'tagPrefix.tags', message: '"tagPrefix.tags" must be an array of strings.' });
      }
    }
  }

  if (input.tagRenames !== undefined) {
    if (!Array.isArray(input.tagRenames)) {
      issues.push({ path: 'tagRenames', message: '"tagRenames" must be an array.' });
    } else {
      input.tagRenames.forEach((rule, idx) => {
        if (!isRecord(rule) || !isNonEmptyString(rule.from) || !isNonEmptyString(rule.to)) {
          issues.push({
            path: `tagRenames[${idx}]`,
            message: 'Each tag rename must have non-empty "from" and "to" strings.',
          });
        }
      });
    }
  }

  if (input.tokenPrefix !== undefined) {
    if (!isRecord(input.tokenPrefix)) {
      issues.push({ path: 'tokenPrefix', message: '"tokenPrefix" must be an object.' });
    } else {
      if (
        !isNonEmptyString(input.tokenPrefix.fromPrefix) ||
        !input.tokenPrefix.fromPrefix.startsWith('--')
      ) {
        issues.push({
          path: 'tokenPrefix.fromPrefix',
          message: '"fromPrefix" must start with "--" (e.g. "--mth-").',
        });
      }
      if (
        !isNonEmptyString(input.tokenPrefix.toPrefix) ||
        !input.tokenPrefix.toPrefix.startsWith('--')
      ) {
        issues.push({
          path: 'tokenPrefix.toPrefix',
          message: '"toPrefix" must start with "--" (e.g. "--acme-").',
        });
      }
    }
  }

  if (input.tokenRenames !== undefined) {
    if (!Array.isArray(input.tokenRenames)) {
      issues.push({ path: 'tokenRenames', message: '"tokenRenames" must be an array.' });
    } else {
      input.tokenRenames.forEach((rule, idx) => {
        if (
          !isRecord(rule) ||
          !isNonEmptyString(rule.from) ||
          !isNonEmptyString(rule.to) ||
          !rule.from.startsWith('--') ||
          !rule.to.startsWith('--')
        ) {
          issues.push({
            path: `tokenRenames[${idx}]`,
            message: 'Each token rename must have "--*" "from" and "to" strings.',
          });
        }
      });
    }
  }

  if (input.attributes !== undefined) {
    if (!Array.isArray(input.attributes)) {
      issues.push({ path: 'attributes', message: '"attributes" must be an array.' });
    } else {
      input.attributes.forEach((rule, idx) => {
        if (!isRecord(rule) || !isNonEmptyString(rule.from)) {
          issues.push({
            path: `attributes[${idx}]`,
            message: 'Each attribute migration must specify a non-empty "from" attribute name.',
          });
          return;
        }
        const hasAction =
          isNonEmptyString(rule.to) || isRecord(rule.valueMap) || rule.remove === true;
        if (!hasAction) {
          issues.push({
            path: `attributes[${idx}]`,
            message: 'Attribute migration must specify "to", "valueMap", or "remove: true".',
          });
        }
      });
    }
  }

  if (input.slots !== undefined) {
    if (!Array.isArray(input.slots)) {
      issues.push({ path: 'slots', message: '"slots" must be an array.' });
    } else {
      input.slots.forEach((rule, idx) => {
        if (!isRecord(rule) || !isNonEmptyString(rule.from) || !isNonEmptyString(rule.to)) {
          issues.push({
            path: `slots[${idx}]`,
            message: 'Each slot migration must have non-empty "from" and "to" strings.',
          });
        }
      });
    }
  }

  if (input.events !== undefined) {
    if (!Array.isArray(input.events)) {
      issues.push({ path: 'events', message: '"events" must be an array.' });
    } else {
      input.events.forEach((rule, idx) => {
        if (!isRecord(rule) || !isNonEmptyString(rule.from) || !isNonEmptyString(rule.to)) {
          issues.push({
            path: `events[${idx}]`,
            message: 'Each event migration must have non-empty "from" and "to" strings.',
          });
        }
      });
    }
  }

  return issues;
}

export function parseMigrationManifest(jsonText: string): MigrationManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new SyntaxError(
      `Invalid migration manifest JSON: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }
  const issues = validateMigrationManifest(parsed);
  if (issues.length > 0) {
    const details = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    throw new TypeError(`Invalid migration manifest: ${details}`);
  }
  return parsed as MigrationManifest;
}

export function createPrefixManifest(options: {
  readonly fromTagPrefix?: string;
  readonly toTagPrefix?: string;
  readonly fromTokenPrefix?: string;
  readonly toTokenPrefix?: string;
  readonly tags?: ReadonlyArray<string>;
}): MigrationManifest {
  const tagPrefix: TagPrefixRewrite | undefined = options.toTagPrefix
    ? options.tags
      ? {
          fromPrefix: options.fromTagPrefix ?? 'mth-',
          toPrefix: options.toTagPrefix,
          tags: options.tags,
        }
      : {
          fromPrefix: options.fromTagPrefix ?? 'mth-',
          toPrefix: options.toTagPrefix,
        }
    : undefined;

  const tokenPrefix: TokenPrefixRewrite | undefined = options.toTokenPrefix
    ? {
        fromPrefix: options.fromTokenPrefix ?? '--mth-',
        toPrefix: options.toTokenPrefix,
      }
    : undefined;

  return {
    version: '1.0.0',
    name: 'prefix-rewrite',
    ...(tagPrefix ? { tagPrefix } : {}),
    ...(tokenPrefix ? { tokenPrefix } : {}),
  };
}

export function compileManifest(manifest: MigrationManifest): CompiledManifest {
  const tagRenameMap = new Map<string, string>();
  for (const rule of manifest.tagRenames ?? []) {
    tagRenameMap.set(rule.from.toLowerCase(), rule.to.toLowerCase());
  }

  const tagPrefix = manifest.tagPrefix;
  const fromTagPrefix = tagPrefix?.fromPrefix.toLowerCase();
  const toTagPrefix = tagPrefix?.toPrefix.toLowerCase();
  const allowedSuffixes = tagPrefix?.tags
    ? new Set(
        tagPrefix.tags.map((t) => {
          const lower = t.toLowerCase();
          return fromTagPrefix && lower.startsWith(fromTagPrefix)
            ? lower.slice(fromTagPrefix.length)
            : lower;
        }),
      )
    : null;

  const tokenRenameMap = new Map<string, string>();
  for (const rule of manifest.tokenRenames ?? []) {
    tokenRenameMap.set(rule.from, rule.to);
  }

  const tokenPrefix = manifest.tokenPrefix;

  function rewriteTag(tagName: string): string {
    const lower = tagName.toLowerCase();
    let current = tagRenameMap.get(lower) ?? lower;

    if (fromTagPrefix && toTagPrefix && fromTagPrefix !== toTagPrefix) {
      // Idempotency guard: if tag already starts with target prefix (e.g. `mth-v2-`), do not double-prefix.
      if (!current.startsWith(toTagPrefix) && current.startsWith(fromTagPrefix)) {
        const suffix = current.slice(fromTagPrefix.length);
        if (suffix.length > 0 && (!allowedSuffixes || allowedSuffixes.has(suffix))) {
          current = `${toTagPrefix}${suffix}`;
        }
      }
    }

    return current;
  }

  function rewriteToken(tokenName: string): string {
    let current = tokenRenameMap.get(tokenName) ?? tokenName;

    if (tokenPrefix && tokenPrefix.fromPrefix !== tokenPrefix.toPrefix) {
      if (!current.startsWith(tokenPrefix.toPrefix) && current.startsWith(tokenPrefix.fromPrefix)) {
        const suffix = current.slice(tokenPrefix.fromPrefix.length);
        if (suffix.length > 0) {
          current = `${tokenPrefix.toPrefix}${suffix}`;
        }
      }
    }

    return current;
  }

  function matchesTagScope(
    ruleTag: string | ReadonlyArray<string> | undefined,
    elementTag: string | null,
  ): boolean {
    const scope = normalizeTagFilter(ruleTag);
    if (!scope) return true;
    if (scope.includes('*')) return true;
    if (!elementTag) return false;
    const normalizedEl = elementTag.toLowerCase();
    const rewrittenEl = rewriteTag(normalizedEl);
    return scope.some((candidate) => {
      const rewrittenCandidate = rewriteTag(candidate);
      return (
        candidate === normalizedEl ||
        candidate === rewrittenEl ||
        rewrittenCandidate === normalizedEl ||
        rewrittenCandidate === rewrittenEl
      );
    });
  }

  const attrRules = manifest.attributes ?? [];
  const slotRules = manifest.slots ?? [];
  const eventRules = manifest.events ?? [];

  const reactEventLookup = eventRules.map((rule) => ({
    rule,
    fromProp: toReactEventPropName(rule.from),
    toProp: toReactEventPropName(rule.to),
  }));

  return {
    manifest,
    rewriteTag,
    rewriteToken,
    matchAttribute(tagName, attrName) {
      const lowerAttr = attrName.toLowerCase();
      for (const rule of attrRules) {
        if (rule.from.toLowerCase() !== lowerAttr) continue;
        if (!matchesTagScope(rule.tag, tagName)) continue;
        return rule;
      }
      return null;
    },
    matchSlot(tagName, slotName) {
      for (const rule of slotRules) {
        if (rule.from !== slotName) continue;
        if (!matchesTagScope(rule.tag, tagName)) continue;
        return rule;
      }
      return null;
    },
    matchEvent(tagName, eventName) {
      const lowerEvent = eventName.toLowerCase();
      for (const rule of eventRules) {
        if (rule.from.toLowerCase() !== lowerEvent) continue;
        if (!matchesTagScope(rule.tag, tagName)) continue;
        return rule;
      }
      return null;
    },
    matchReactEventProp(tagName, propName) {
      for (const entry of reactEventLookup) {
        if (entry.fromProp !== propName) continue;
        if (!matchesTagScope(entry.rule.tag, tagName)) continue;
        return {
          fromEvent: entry.rule.from,
          toEvent: entry.rule.to,
          toProp: entry.toProp,
        };
      }
      return null;
    },
  };
}
