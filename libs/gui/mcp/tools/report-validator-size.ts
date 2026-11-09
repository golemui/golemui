/**
 * Prints the browser weight of the form-definition validator as a Markdown table, for a PR
 * description. Run after `npm run generate:validators`:
 *   npx tsx --tsconfig libs/gui/mcp/tsconfig.spec.json libs/gui/mcp/tools/report-validator-size.ts
 */
import { formatValidatorSizeReport, measureValidatorSizes } from './validator-size';

console.log(formatValidatorSizeReport(await measureValidatorSizes()));
