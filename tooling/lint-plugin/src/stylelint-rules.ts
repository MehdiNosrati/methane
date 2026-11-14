import stylelint, { type Plugin, type Rule } from 'stylelint';
import {
  checkLogicalDeclaration,
  hasHostContextSelector,
  isInsideHostRule,
} from './css-checks.js';

export const NO_HOST_CONTEXT_RULE = 'methane/no-host-context';
export const LOGICAL_PROPERTIES_ONLY_RULE = 'methane/logical-properties-only';
export const NO_HOST_PUBLIC_TOKEN_SEED_RULE = 'methane/no-host-public-token-seed';

const noHostContextMessages = stylelint.utils.ruleMessages(NO_HOST_CONTEXT_RULE, {
  rejected: (selector: string) =>
    `":host-context()" is banned by Methane ADR-014 (selector: "${selector}").`,
});

const logicalPropertiesMessages = stylelint.utils.ruleMessages(LOGICAL_PROPERTIES_ONLY_RULE, {
  rejected: (message: string) => message,
});

const noHostPublicTokenSeedMessages = stylelint.utils.ruleMessages(
  NO_HOST_PUBLIC_TOKEN_SEED_RULE,
  {
    rejected: (prop: string) =>
      `Public token "${prop}" must not be seeded on :host; alias into a private "--_*" variable instead.`,
  },
);

const noHostContextRule: Rule = (primary) => {
  return (root, result) => {
    const valid = stylelint.utils.validateOptions(result, NO_HOST_CONTEXT_RULE, {
      actual: primary,
    });
    if (!valid || !primary) return;

    root.walkRules((rule) => {
      if (hasHostContextSelector(rule.selector)) {
        stylelint.utils.report({
          ruleName: NO_HOST_CONTEXT_RULE,
          result,
          node: rule,
          message: noHostContextMessages.rejected(rule.selector),
        });
      }
    });
  };
};
noHostContextRule.ruleName = NO_HOST_CONTEXT_RULE;
noHostContextRule.messages = noHostContextMessages;

const logicalPropertiesOnlyRule: Rule = (primary) => {
  return (root, result) => {
    const valid = stylelint.utils.validateOptions(result, LOGICAL_PROPERTIES_ONLY_RULE, {
      actual: primary,
    });
    if (!valid || !primary) return;

    root.walkDecls((decl) => {
      const violation = checkLogicalDeclaration(decl);
      if (violation) {
        stylelint.utils.report({
          ruleName: LOGICAL_PROPERTIES_ONLY_RULE,
          result,
          node: decl,
          message: logicalPropertiesMessages.rejected(violation.message),
        });
      }
    });
  };
};
logicalPropertiesOnlyRule.ruleName = LOGICAL_PROPERTIES_ONLY_RULE;
logicalPropertiesOnlyRule.messages = logicalPropertiesMessages;

const noHostPublicTokenSeedRule: Rule = (primary) => {
  return (root, result) => {
    const valid = stylelint.utils.validateOptions(result, NO_HOST_PUBLIC_TOKEN_SEED_RULE, {
      actual: primary,
    });
    if (!valid || !primary) return;

    root.walkDecls((decl) => {
      if (decl.prop.startsWith('--mth-') && isInsideHostRule(decl)) {
        stylelint.utils.report({
          ruleName: NO_HOST_PUBLIC_TOKEN_SEED_RULE,
          result,
          node: decl,
          message: noHostPublicTokenSeedMessages.rejected(decl.prop),
        });
      }
    });
  };
};
noHostPublicTokenSeedRule.ruleName = NO_HOST_PUBLIC_TOKEN_SEED_RULE;
noHostPublicTokenSeedRule.messages = noHostPublicTokenSeedMessages;

export const stylelintPlugins: Plugin[] = [
  stylelint.createPlugin(NO_HOST_CONTEXT_RULE, noHostContextRule),
  stylelint.createPlugin(LOGICAL_PROPERTIES_ONLY_RULE, logicalPropertiesOnlyRule),
  stylelint.createPlugin(NO_HOST_PUBLIC_TOKEN_SEED_RULE, noHostPublicTokenSeedRule),
];

export const recommendedStylelintRules: Record<string, boolean> = {
  [NO_HOST_CONTEXT_RULE]: true,
  [LOGICAL_PROPERTIES_ONLY_RULE]: true,
  [NO_HOST_PUBLIC_TOKEN_SEED_RULE]: true,
};

export default stylelintPlugins;
