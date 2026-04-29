import {
  InputDecorator,
  TextDataInputDecorator,
  DataInputDecorator,
  ValidShortcutType,
} from './inputs.domain';

export class InputTypeDefaults {
  public explodeShortcut(fieldDefRaw: ValidShortcutType): InputDecorator {
    switch (fieldDefRaw) {
      case 'string':
        return this.createDefaultStringDataInput();
      case 'number':
        return this.createDefaultNumberDataInput();
      case 'boolean':
        return this.createDefaultBooleanDataInput();
      default:
        throw new Error(`Unsupported shortcut "${fieldDefRaw}"`);
    }
  }
  public createDefaultStringDataInput(): TextDataInputDecorator {
    return { type: 'text' };
  }

  public createDefaultNumberDataInput(): DataInputDecorator {
    return { type: 'number'};
  }

  public createDefaultBooleanDataInput(): DataInputDecorator {
    return { type: 'boolean'};
  }
}

const inputTypeDefaults = new InputTypeDefaults();
export default inputTypeDefaults;
