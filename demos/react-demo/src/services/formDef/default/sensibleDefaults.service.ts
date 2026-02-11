import {
  DataInputDecorator,
  InputDecorator,
  TextDataInputDecorator,
  ValidShortcutType,
} from '../formDef.domain';

export class SensibleDefaults {
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

  public createDataInputDefinition(formDataValue: any): DataInputDecorator {
    let fieldDef: DataInputDecorator | undefined;
    const typeOfFormData = typeof formDataValue;
    switch (typeOfFormData) {
      case 'string':
        fieldDef = this.createDefaultStringDataInput();
        break;
      case 'number':
        fieldDef = this.createDefaultNumberDataInput();
        break;
      case 'boolean':
        fieldDef = this.createDefaultBooleanDataInput();
        break;
      default:
        throw new Error(`Unsupported form data type "${typeOfFormData}"`);
    }
    return fieldDef;
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

  public createDefaultSubmitButton(): any {
    return {
      type: 'button',
      widget: 'button',
      label: 'Submit',
      on: { click: 'submit' },
    };
  }
}

const sensibleDefaults = new SensibleDefaults();
export default sensibleDefaults;
