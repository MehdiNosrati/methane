import type {
  ComponentBehaviorSpec,
  ConformanceSuiteName,
  FocusModel,
  SpecDiagnostic,
  SpecValidationResult,
} from './types.js';

const VALID_SUITES: ReadonlySet<ConformanceSuiteName> = new Set([
  'form-control',
  'overlay',
  'roving-focus',
  'listbox',
  'data-consumer',
  'satellite',
]);

const VALID_FOCUS_MODELS: ReadonlySet<FocusModel> = new Set(['none', 'host', 'delegates-focus']);
const TAG_PATTERN = /^mth-[a-z][a-z0-9-]*$/;
const UNPREFIXED_NATIVE_EVENTS = new Set(['input', 'change']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateBehaviorSpec(input: unknown): SpecValidationResult {
  const errors: SpecDiagnostic[] = [];
  const warnings: SpecDiagnostic[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [{ level: 'error', path: '$', message: 'Spec must be a non-null object.' }],
      warnings: [],
    };
  }

  if (typeof input['tag'] !== 'string' || !TAG_PATTERN.test(input['tag'])) {
    errors.push({
      level: 'error',
      path: 'tag',
      message: 'Spec `tag` must match /^mth-[a-z][a-z0-9-]*$/ (ADR-015).',
    });
  }

  if (typeof input['package'] !== 'string' || !input['package'].startsWith('@methane/')) {
    errors.push({
      level: 'error',
      path: 'package',
      message: 'Spec `package` must be an `@methane/*` package name.',
    });
  }

  if (!Array.isArray(input['conformance'])) {
    errors.push({
      level: 'error',
      path: 'conformance',
      message: 'Spec `conformance` must be an array of suite names.',
    });
  } else {
    for (const [idx, suite] of input['conformance'].entries()) {
      if (typeof suite !== 'string' || !VALID_SUITES.has(suite as ConformanceSuiteName)) {
        errors.push({
          level: 'error',
          path: `conformance[${idx}]`,
          message: `Unknown conformance suite "${String(suite)}".`,
        });
      }
    }
  }

  if (!Array.isArray(input['controllers']) || !input['controllers'].every((c) => typeof c === 'string')) {
    errors.push({
      level: 'error',
      path: 'controllers',
      message: 'Spec `controllers` must be an array of controller/core names.',
    });
  }

  const focusModel = input['focusModel'];
  if (typeof focusModel !== 'string' || !VALID_FOCUS_MODELS.has(focusModel as FocusModel)) {
    errors.push({
      level: 'error',
      path: 'focusModel',
      message: 'Spec `focusModel` must be "none", "host", or "delegates-focus".',
    });
  }

  if (input['role'] !== undefined && typeof input['role'] !== 'string') {
    errors.push({
      level: 'error',
      path: 'role',
      message: 'Spec `role` must be a string when provided.',
    });
  }

  // ADR-014 critical invariant: delegatesFocus: true + host internals.role is banned.
  if (focusModel === 'delegates-focus' && typeof input['role'] === 'string' && input['role'].length > 0) {
    errors.push({
      level: 'error',
      path: 'role',
      message:
        'ADR-014 invariant violation: `focusModel: "delegates-focus"` cannot declare a host `role`. Place the ARIA role on the internal shadow focus target or use `focusModel: "host"`.',
    });
  }

  if (!Array.isArray(input['states']) || !input['states'].every((s) => typeof s === 'string')) {
    errors.push({
      level: 'error',
      path: 'states',
      message: 'Spec `states` must be an array of `:state()` flag names.',
    });
  }

  if (!Array.isArray(input['keyboard'])) {
    errors.push({ level: 'error', path: 'keyboard', message: 'Spec `keyboard` must be an array.' });
  } else {
    for (const [idx, entry] of input['keyboard'].entries()) {
      if (
        !isRecord(entry) ||
        typeof entry['key'] !== 'string' ||
        typeof entry['when'] !== 'string' ||
        typeof entry['expect'] !== 'string' ||
        (entry['dir'] !== undefined && entry['dir'] !== 'ltr' && entry['dir'] !== 'rtl')
      ) {
        errors.push({
          level: 'error',
          path: `keyboard[${idx}]`,
          message: 'Keyboard binding must define `key`, `when`, `expect`, and optional `dir` ("ltr" | "rtl").',
        });
      }
    }
  }

  if (!Array.isArray(input['props'])) {
    errors.push({ level: 'error', path: 'props', message: 'Spec `props` must be an array.' });
  } else {
    const seenProps = new Set<string>();
    for (const [idx, prop] of input['props'].entries()) {
      if (
        !isRecord(prop) ||
        typeof prop['name'] !== 'string' ||
        typeof prop['type'] !== 'string' ||
        (prop['attr'] !== undefined && typeof prop['attr'] !== 'string' && prop['attr'] !== false)
      ) {
        errors.push({
          level: 'error',
          path: `props[${idx}]`,
          message: 'Prop entry must define `name`, `type`, and optional `attr` (string | false).',
        });
      } else {
        if (seenProps.has(prop['name'])) {
          errors.push({
            level: 'error',
            path: `props[${idx}].name`,
            message: `Duplicate prop name "${prop['name']}".`,
          });
        }
        seenProps.add(prop['name']);
      }
    }
  }

  if (!Array.isArray(input['events'])) {
    errors.push({ level: 'error', path: 'events', message: 'Spec `events` must be an array.' });
  } else {
    const seenEvents = new Set<string>();
    for (const [idx, ev] of input['events'].entries()) {
      if (
        !isRecord(ev) ||
        typeof ev['name'] !== 'string' ||
        typeof ev['cancelable'] !== 'boolean' ||
        typeof ev['detailType'] !== 'string'
      ) {
        errors.push({
          level: 'error',
          path: `events[${idx}]`,
          message: 'Event entry must define `name`, `cancelable`, and `detailType`.',
        });
      } else {
        if (!ev['name'].startsWith('mth-') && !UNPREFIXED_NATIVE_EVENTS.has(ev['name'])) {
          errors.push({
            level: 'error',
            path: `events[${idx}].name`,
            message: `Custom event "${ev['name']}" must use the "mth-" prefix (ADR-015; only native "input" and "change" are unprefixed).`,
          });
        }
        if (seenEvents.has(ev['name'])) {
          errors.push({
            level: 'error',
            path: `events[${idx}].name`,
            message: `Duplicate event name "${ev['name']}".`,
          });
        }
        seenEvents.add(ev['name']);
      }
    }
  }

  if (!Array.isArray(input['slots'])) {
    errors.push({ level: 'error', path: 'slots', message: 'Spec `slots` must be an array.' });
  } else {
    const seenSlots = new Set<string>();
    for (const [idx, slot] of input['slots'].entries()) {
      if (!isRecord(slot) || typeof slot['name'] !== 'string' || typeof slot['description'] !== 'string') {
        errors.push({
          level: 'error',
          path: `slots[${idx}]`,
          message: 'Slot entry must define `name` and `description`.',
        });
      } else {
        if (seenSlots.has(slot['name'])) {
          errors.push({
            level: 'error',
            path: `slots[${idx}].name`,
            message: `Duplicate slot name "${slot['name']}".`,
          });
        }
        seenSlots.add(slot['name']);
      }
    }
  }

  if (!Array.isArray(input['parts'])) {
    errors.push({ level: 'error', path: 'parts', message: 'Spec `parts` must be an array.' });
  } else {
    const seenParts = new Set<string>();
    for (const [idx, part] of input['parts'].entries()) {
      if (!isRecord(part) || typeof part['name'] !== 'string' || typeof part['description'] !== 'string') {
        errors.push({
          level: 'error',
          path: `parts[${idx}]`,
          message: 'Part entry must define `name` and `description`.',
        });
      } else {
        if (seenParts.has(part['name'])) {
          errors.push({
            level: 'error',
            path: `parts[${idx}].name`,
            message: `Duplicate part name "${part['name']}".`,
          });
        }
        seenParts.add(part['name']);
      }
    }
  }

  if (
    !isRecord(input['messages']) ||
    !Object.values(input['messages']).every((val) => typeof val === 'string')
  ) {
    errors.push({
      level: 'error',
      path: 'messages',
      message: 'Spec `messages` must be a Record<string, string> of default English i18n keys.',
    });
  }

  if (errors.length === 0) {
    const spec = input as unknown as ComponentBehaviorSpec;
    if (
      spec.conformance.includes('roving-focus') &&
      spec.keyboard.some((k) => k.key === 'ArrowRight' || k.key === 'ArrowLeft') &&
      !spec.keyboard.some((k) => k.dir === 'rtl')
    ) {
      warnings.push({
        level: 'warning',
        path: 'keyboard',
        message: 'Horizontal roving-focus spec should explicitly declare `dir: "rtl"` ArrowLeft/ArrowRight expectations.',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertValidBehaviorSpec(input: unknown): asserts input is ComponentBehaviorSpec {
  const result = validateBehaviorSpec(input);
  if (!result.valid) {
    const details = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Invalid ComponentBehaviorSpec: ${details}`);
  }
}
