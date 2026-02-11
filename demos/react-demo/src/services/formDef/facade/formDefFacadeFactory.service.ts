import { KeyOf } from 'zod/v4/core/util';
import {
  DataInputDecorator,
  FormDefTuple,

} from '../formDef.domain';
import sensibleDefaults, { SensibleDefaults } from '../default/sensibleDefaults.service';
import { ProcessedDxFieldsByKey, ProcessedDxField } from '../dx/gui/guiFields.impl';

export class FormDefTupleFactory {
  constructor(private readonly sensibleDefaults: SensibleDefaults) {}

  public create<FORM_DATA extends Record<string, any> = any>(
    dataInputDefsByKey: Record<string, ProcessedDxField>,
  ): FormDefTuple<FORM_DATA>[] {
    const fieldDefKeys: string[] = Object.keys(dataInputDefsByKey);
    if (fieldDefKeys.length === 0) {
      throw new Error('Form definition cannot be null');
    }

    const tuples: FormDefTuple<FORM_DATA>[] = [];
    for (const key of fieldDefKeys) {
      const fieldDef: DataInputDecorator = this.extractFieldDef(dataInputDefsByKey, key);
      const dataInputTuple: FormDefTuple<FORM_DATA> = this.createDataInputTuple(key, fieldDef);
      tuples.push(dataInputTuple);
    }

    tuples.push(['controllers', [this.sensibleDefaults.createDefaultSubmitButton()]]);
    return tuples;
  }

  private extractFieldDef<FORM_DATA extends Record<string, any> = any>(
    dataInputDefsByKey: Record<string, ProcessedDxField>,
    key: keyof FORM_DATA,
  ): DataInputDecorator {
    const fieldDefForKey = dataInputDefsByKey?.[key as KeyOf<FORM_DATA>];
    if (fieldDefForKey == null) {
      throw new Error(`Unexpected error "${key as string}"`);
    }

    return fieldDefForKey as DataInputDecorator;
  }

  private createDataInputTuple<FORM_DATA extends Record<string, any> = any>(
    key: keyof FORM_DATA,
    fieldDef: DataInputDecorator,
  ): FormDefTuple<FORM_DATA> {
    const dataInput: ProcessedDxFieldsByKey<FORM_DATA> = {
      [key]: fieldDef,
    } as ProcessedDxFieldsByKey<FORM_DATA>;

    return ['data_inputs', dataInput];
  }
}
const formDefTupleFactory = new FormDefTupleFactory(sensibleDefaults);
export default formDefTupleFactory;
