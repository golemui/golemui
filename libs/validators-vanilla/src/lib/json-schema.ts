import * as Core from '@golemui/core';
import { BooleanValidator, NumberValidator, StringValidator, Validator } from './validators';

export const stringValidator = (config?: Omit<StringValidator, 'type'>): StringValidator => ({
  type: 'string',
  ...(config || {}),
});

export const numberValidator = (config?: Omit<NumberValidator, 'type'>): NumberValidator => ({
  type: 'number',
  ...(config || {}),
});

export const integerValidator = (config?: Omit<NumberValidator, 'type'>): NumberValidator => ({
  type: 'integer',
  ...(config || {}),
});

export const booleanValidator = (config?: Omit<BooleanValidator, 'type'>): BooleanValidator => ({
  type: 'boolean',
  ...(config || {}),
});

export const jsonSchemaValidators: Core.JsonSchemaValidators<Validator> = {
  stringValidator,
  booleanValidator,
  numberValidator,
  integerValidator,
};
