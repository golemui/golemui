import { KeyOf } from 'zod/v4/core/util';
import { DataInputDef, DataInputDefsByKey, FormDefFacade, FormDefTuple } from '../formDef.domain';
import sensibleDefaults, { SensibleDefaults } from '../default/sensibleDefaults.service';

export class FormDefFacadeFactory {
  constructor(private readonly sensibleDefaults: SensibleDefaults) {}

  public create<FORM_DATA extends Record<string, any> = any>(
    dataInputDefsByKey: Record<string, DataInputDef>,
  ): FormDefFacade<FORM_DATA> {
    const fieldDefKeys: string[] = Object.keys(dataInputDefsByKey);
    if (fieldDefKeys.length === 0) {
      throw new Error('Form definition cannot be null');
    }

    const tuples: FormDefTuple<FORM_DATA>[] = [];
    for (const key of fieldDefKeys) {
      const fieldDef: DataInputDef = this.extractFieldDef(dataInputDefsByKey, key);
      const dataInputTuple: FormDefTuple<FORM_DATA> = this.createDataInputTuple(key, fieldDef);
      tuples.push(dataInputTuple);
    }

    tuples.push(['controllers', [this.sensibleDefaults.createDefaultSubmitButton()]]);
    return tuples;
  }

  private extractFieldDef<FORM_DATA extends Record<string, any> = any>(
    dataInputDefsByKey: Record<string, DataInputDef>,
    key: keyof FORM_DATA,
  ): DataInputDef {
    const fieldDefForKey = dataInputDefsByKey?.[key as KeyOf<FORM_DATA>];
    if (fieldDefForKey == null) {
      throw new Error(`Unexpected error "${key as string}"`);
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
const formDefFacadeFactory = new FormDefFacadeFactory(sensibleDefaults);
export default formDefFacadeFactory;
