import { CustomValidatorSchemaFn } from '@golemui/core';
import * as z from 'zod/mini';

export const allowedNames: CustomValidatorSchemaFn = (names: string[]) =>
  z.string().check(
    z.superRefine((val, ctx) => {
      if (names.includes(val) == false) {
        ctx.addIssue({
          code: 'custom',
          message: `Name "${val}" not in ${names.join(', ')}`,
          input: val,
        });
      }
    }),
  );
