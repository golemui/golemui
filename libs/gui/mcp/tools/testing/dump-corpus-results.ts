/**
 * Prints `validateFormDefinition` over the differential corpus as JSON, keyed by case name.
 * Used to compare two versions of the validator by hand: run it on each and diff the output.
 */
import { writeFileSync } from 'node:fs';
import { validateFormDefinition } from '../../src/json/validate-form-definition';
import { buildMutationCorpus } from './mutation-corpus';

const corpus = buildMutationCorpus();
const results: Record<string, unknown> = {};
const started = performance.now();
for (const [name, formDefinition] of Object.entries(corpus)) {
  results[name] = validateFormDefinition({ formDefinition });
}
const output = process.argv[2];
if (!output) throw new Error('Pass the output file');
writeFileSync(output, JSON.stringify(results, null, 1));
console.log(`${Object.keys(corpus).length} cases in ${Math.round(performance.now() - started)} ms`);
