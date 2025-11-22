import type { StandardSchemaV1 } from '@standard-schema/spec';

export type JsonSchemaValidators<V> = {
  stringValidator: () => V;
  booleanValidator: () => V;
  numberValidator: () => V;
  integerValidator: () => V;
};

export type ValidatorFn<V> = (validator: V) => StandardSchemaV1;

export function standardValidate<T extends StandardSchemaV1>(
  schema: T,
  input: StandardSchemaV1.InferInput<T>,
): StandardSchemaV1.InferOutput<T> {
  const result = schema['~standard'].validate(input);
  if (result instanceof Promise) {
    throw new TypeError('Schema validation must be synchronous');
  }
  return result;
}

export function isStandardValidateSuccess<O>(
  result: StandardSchemaV1.Result<O>,
): result is StandardSchemaV1.SuccessResult<O> {
  return result.issues === undefined;
}
