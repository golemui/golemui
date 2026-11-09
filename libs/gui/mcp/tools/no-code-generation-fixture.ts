/**
 * Runs `validateFormDefinition` and `validateFormDefinitionAsync` on forms that reach every
 * family of generated validators and prints the outcome as JSON. `no-code-generation.spec.ts`
 * runs it in a child process with `--disallow-code-generation-from-strings`, the V8 setting
 * behind the EvalError of Workers.
 */
import { validateFormDefinitionAsync } from '../src/json-lazy';
import { validateFormDefinition } from '../src/json/validate-form-definition';

type FixtureCase = { name: string; formDefinition: unknown; expectedValid: boolean };

const CASES: FixtureCase[] = [
  {
    name: 'valid form',
    expectedValid: true,
    formDefinition: { form: [{ kind: 'input', type: 'textinput', path: 'field' }] },
  },
  {
    name: 'invalid built-in widget',
    expectedValid: false,
    formDefinition: {
      form: [{ kind: 'input', type: 'textinput', path: 'field', notAProperty: true }],
    },
  },
  {
    name: 'invalid validator object',
    expectedValid: false,
    formDefinition: {
      form: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'field',
          validator: { type: 'string', minLength: 'ten' },
        },
      ],
    },
  },
  {
    name: 'invalid custom widget',
    expectedValid: false,
    formDefinition: { form: [{ kind: 'input', type: 'myInput' }] },
  },
  {
    name: 'invalid chunk ref',
    expectedValid: false,
    formDefinition: { form: [{ $ref: 5 }] },
  },
  {
    name: 'input widget as a repeater template',
    expectedValid: false,
    formDefinition: {
      form: [
        {
          kind: 'input',
          type: 'repeater',
          path: 'rows',
          props: { template: { kind: 'input', type: 'textinput', path: 'rows.items.name' } },
        },
      ],
    },
  },
  {
    name: 'invalid widget inside a layout',
    expectedValid: false,
    formDefinition: {
      form: [
        {
          kind: 'layout',
          type: 'grid',
          children: [{ kind: 'input', type: 'checkbox', path: 'field', notAProperty: true }],
        },
      ],
    },
  },
];

function isCodeGenerationBlocked(): boolean {
  try {
    new Function('return 1');
    return false;
  } catch {
    return true;
  }
}

const results = [];
for (const { name, formDefinition, expectedValid } of CASES) {
  const sync = validateFormDefinition({ formDefinition });
  results.push({ name, expectedValid, valid: sync.valid, errorCount: sync.errors.length });
  // The lazy entry loads each validator module with a dynamic import first.
  const lazy = await validateFormDefinitionAsync({ formDefinition });
  results.push({
    name: `${name} (lazy)`,
    expectedValid,
    valid: lazy.valid,
    errorCount: lazy.errors.length,
  });
}

console.log(JSON.stringify({ codeGenerationBlocked: isCodeGenerationBlocked(), results }));
