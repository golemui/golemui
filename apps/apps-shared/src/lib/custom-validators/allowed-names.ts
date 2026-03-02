import { CustomValidatorSchemaFn } from '@golemui/gui-validators';
import * as z from 'zod/mini';

export const allowedNames: CustomValidatorSchemaFn = (names: string[]) =>
  z.string().check(
    z.superRefine((val, ctx) => {
      if (val && names.includes(val) === false) {
        ctx.addIssue({
          code: 'custom',
          message: `Name "${val}" not in ${names.map((name) => `"${name}"`).join(', ')}`,
          input: val,
        });
      }
    }),
  );
