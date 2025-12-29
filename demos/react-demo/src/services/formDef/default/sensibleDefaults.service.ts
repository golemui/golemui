import { DataInputDef } from '../formDef.domain';

export class SensibleDefaults {
  public createDataInputDefinition(formDataValue: any): DataInputDef {
    let fieldDef: DataInputDef | undefined;
    const typeOfFormData = typeof formDataValue;
    switch (typeOfFormData) {
      case 'string':
        fieldDef = this.createDefaultStringDataInput();
        break;
      case 'number':
        fieldDef = this.createDefaultNumberDataInput();
        break;
      default:
        throw new Error(`Unsupported form data type "${typeOfFormData}"`);
    }
    return fieldDef;
  }

  public createDefaultStringDataInput(): DataInputDef {
    return { type: 'text' };
  }

  public createDefaultNumberDataInput(): DataInputDef {
    return { type: 'number' };
  }

  public createDefaultSubmitButton(): any {
    return {
      type: 'button',
      label: 'Submit',
      on: { click: 'submit' },
    };
  }
}

const sensibleDefaults = new SensibleDefaults();
export default sensibleDefaults;
