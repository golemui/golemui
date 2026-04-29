import inputTypeDefaults, { InputTypeDefaults } from './inputTypeDefaults.service';
import {
  InputDecorator,
  InputTags,
  InputDefOrCallback,
  SimpleFieldDef,
} from './inputs.domain';

export type ProcessedDxFieldsByKey = Record<string, InputDefOrCallback>;

export class InputDefsByKeyService {
  constructor(private readonly inputTypeDefaults: InputTypeDefaults) {}
  public expandFields(fields: Record<string, SimpleFieldDef>): ProcessedDxFieldsByKey {
    const result: ProcessedDxFieldsByKey = {};
    Object.entries(fields).forEach(([key, dataInputDef]) => {
      result[key] = this.expandField(dataInputDef);
    });
    return result;
  }

  private expandField(dataInputDef: SimpleFieldDef): InputDefOrCallback {
    if (typeof dataInputDef === 'string') {
      return this.inputTypeDefaults.explodeShortcut(dataInputDef);
    }

    if (Array.isArray(dataInputDef)) {
      const [shortcut, ...tagList] = dataInputDef as InputTags;
      const value = this.inputTypeDefaults.explodeShortcut(shortcut);
      if (tagList.length > 0) {
        value.tags = tagList;
        if (tagList.includes('required')) {
          const withValidator = value as InputDecorator & {
            validator?: Record<string, any>;
          };
          withValidator.validator = {
            ...withValidator.validator,
            required: true,
          };
        }
      }
      return value;
    }

    throw new Error(
      `Invalid field definition: expected string shorthand or tag tuple, got ${typeof dataInputDef}`,
    );
  }
}

const inputDefsByKeyService = new InputDefsByKeyService(inputTypeDefaults);
export default inputDefsByKeyService;
