import { KeyOf } from 'zod/v4/core/util';
import { DataInputDef, DataInputDefsByKey, FormDefFacade, FormDefTuple } from '../formDef.domain';
import formDefUtils, { FormDefUtils } from '../utils/formDefUtils.service';
import sensibleDefaults, { SensibleDefaults } from '../default/sensibleDefaults.service';

export class FormDefFacadeFactory {
  constructor(
    private readonly formDefUtils: FormDefUtils,
    private readonly sensibleDefaults: SensibleDefaults,
  ) {}

  public create<FORM_DATA extends Record<string, any> = any>(
    dataInputDefsByKey: Record<string, DataInputDef>,
    formData: FORM_DATA | null,
  ): FormDefFacade<FORM_DATA> {
    const fieldDefKeys: string[] = Object.keys(dataInputDefsByKey);
    if (fieldDefKeys.length === 0 && formData === null) {
      throw new Error('Form definition and form data cannot both be null');
    }

    const formDataKeys = Object.keys(formData || {});
    const keyResults: (keyof FORM_DATA)[] = this.formDefUtils.mergeKeys(fieldDefKeys, formDataKeys);

    const tuples: FormDefTuple<FORM_DATA>[] = [];
    for (const key of keyResults) {
      const fieldDef: DataInputDef = this.extractFieldDef(dataInputDefsByKey, key, formData);
      const dataInputTuple = this.createDataInputTuple(key, fieldDef);
      tuples.push(dataInputTuple);
    }

    tuples.push(['controllers', [this.sensibleDefaults.createDefaultSubmitButton()]]);
    return tuples;
  }

  private extractFieldDef<FORM_DATA extends Record<string, any> = any>(
    dataInputDefsByKey: Record<string, DataInputDef>,
    key: keyof FORM_DATA,
    formData: FORM_DATA | null,
  ): DataInputDef {
    const fieldDefForKey = dataInputDefsByKey?.[key as KeyOf<FORM_DATA>];
    const formDataValue = formData?.[key];
    if (fieldDefForKey == null && formDataValue == null) {
      throw new Error(`Unexpected error "${key as string}"`);
    }

    if (fieldDefForKey == null) {
      return this.sensibleDefaults.createDataInputDefinition(formDataValue);
    }

    return fieldDefForKey as DataInputDef;
  }

  private createDataInputTuple<FORM_DATA extends Record<string, any> = any>(
    key: keyof FORM_DATA,
    fieldDef: DataInputDef,
  ): FormDefTuple<FORM_DATA> {
    const dataInput: DataInputDefsByKey<FORM_DATA> = {
      [key]: fieldDef,
    } as DataInputDefsByKey<FORM_DATA>;

    return ['data_inputs', dataInput];
  }
}
const formDefFacadeFactory = new FormDefFacadeFactory(formDefUtils, sensibleDefaults);
export default formDefFacadeFactory;
