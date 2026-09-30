import type { Result, RuleObject } from 'axe-core';

// Rules off until their fix lands: the accessible names of internal controls and inputs are
// step 3.9 of the v2 plan, which turns them back on.
const PENDING_RULES: RuleObject = {
  'button-name': { enabled: false },
  label: { enabled: false },
};

const logViolations = (violations: Result[]) => {
  const lines = violations.flatMap((violation) => [
    `${violation.id} (${violation.impact}): ${violation.help}`,
    ...violation.nodes.map((node) => `  ${node.html}`),
  ]);
  cy.task('log', lines.join('\n'), { log: false });
};

/**
 * Checks the element that matches `context` with axe. Pass `rules` to turn rules off where the
 * element is incomplete on its own, with the reason next to it.
 */
export function checkA11y(
  context: string | { include: string[]; exclude?: string[] },
  rules: RuleObject = {},
) {
  // axe-core is hoisted to the repo root, where cy.injectAxe() does not look by default.
  cy.injectAxe({ axeCorePath: '../../../node_modules/axe-core/axe.min.js' });
  cy.checkA11y(context, { rules: { ...PENDING_RULES, ...rules } }, logViolations);
}
