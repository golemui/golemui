import { type CustomValidatorSchemaFn } from '@golemui/gui-validators';
import { string, superRefine } from 'zod/mini';

export const passwordsMatch: CustomValidatorSchemaFn = (other: string) =>
  string().check(
    superRefine((val, ctx) => {
      if (val && val !== other) {
        ctx.addIssue({
          code: 'custom',
          message: 'Passwords do not match',
          input: val,
        });
      }
    }),
  );
