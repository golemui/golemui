import { type CustomValidatorSchemaFn } from '@golemui/gui-validators';
import { string, superRefine } from 'zod/mini'

export const allowedNames: CustomValidatorSchemaFn = (names: string[]) =>
  string().check(
    superRefine((val, ctx) => {
      if (val && names.includes(val) === false) {
        ctx.addIssue({
          code: 'custom',
          message: `Name "${val}" not in ${names.map((name) => `"${name}"`).join(', ')}`,
          input: val,
        });
      }
    }),
  );
