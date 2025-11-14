import * as z from 'zod';

// see https://zod.dev/json-schema

const schema = z.object({
  name: z.string(),
  email: z.email(),
  sex: z.enum(['male', 'female']),
  age: z.optional(z.number()),
  terms: z.boolean().meta({ title: 'Accept Terms' }),
});

export const testingJsonSchema = z.toJSONSchema(schema, { target: 'draft-2020-12' });
