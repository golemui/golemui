// Cross-package entry point for symbols shared with other @golemui packages that
// are not part of the stable public API (see "Export conventions" in CONTRIBUTING.md).
// The widget contract types (WithWidget, WidgetLoaders) live in index.ts because
// custom-widget authors need them and apps cannot import internals.

// The runtime expression check, so that tools such as @golemui/gui-mcp reject the same expressions.
export {
  ALLOWED_EXPRESSION_METHODS,
  checkExpression,
  EXPRESSION_LIMITS,
  isI18nParamExpression,
} from './lib/utils/check-expression';
export type {
  ExpressionIssue,
  ExpressionIssueCode,
  ExpressionPolicy,
  ExpressionSize,
} from './lib/utils/check-expression';
