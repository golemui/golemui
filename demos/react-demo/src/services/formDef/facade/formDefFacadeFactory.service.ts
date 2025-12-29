
import { KeyOf } from 'zod/v4/core/util';
import {
  DataInputDef,
  DataInputDefsByKey,
  FormDefFacade,
  FormDefFacadeLike,
  FormDefTuple,
} from './formDefFacade.domain';

export class FormDefFacadeFactory {
  public createFromRawFormDef<FormData extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FormData> | null,
    formDataRaw: FormData | null,
  ): FormDefFacade<FormData> {
    const dataInputDefsByKey = this.extractDataInputDefs(formDefRaw);
    return this.createFromDataInputsDef(dataInputDefsByKey, formDataRaw);
  }

  public createFromDataInputsDef<FORM_DATA extends Record<string, any> = any>(
    dataInputDefsByKey: Record<string, DataInputDef>,
    formData: FORM_DATA | null,
  ): FormDefFacade<FORM_DATA> {
    const fieldDefKeys: string[] = Object.keys(dataInputDefsByKey);
    if (fieldDefKeys.length === 0 && formData === null) {
      throw new Error('Form definition and form data cannot both be null');
    }

    const formDataKeys = Object.keys(formData || {});
    const keyResults = this.mergeKeys(fieldDefKeys, formDataKeys);

    const tuples: FormDefTuple<FORM_DATA>[] = [];
    for (const key of keyResults) {
      const fieldDefForKey = dataInputDefsByKey?.[key as KeyOf<FORM_DATA>];
      const formDataValue = formData?.[key];
      if (fieldDefForKey == null && formDataValue == null) {
        throw new Error(`Unexpected error "${key}"`);
      }
      let fieldDef: DataInputDef | undefined;
      if (fieldDefForKey == null) {
        const typeOfFormData = typeof formDataValue;
        switch (typeOfFormData) {
          case 'string':
            fieldDef = { type: 'text' };
            break;
          case 'number':
            fieldDef = { type: 'number' };
            break;
          default:
            throw new Error(`Unsupported form data type "${typeOfFormData}"`);
        }

        const dataInput: DataInputDefsByKey<FORM_DATA> = {
          [key as keyof FORM_DATA]: fieldDef,
        } as DataInputDefsByKey<FORM_DATA>;
        tuples.push(['data_inputs', dataInput]);
      } else {
        tuples.push([
          'data_inputs',
          {
            [key as keyof FORM_DATA]: fieldDefForKey as DataInputDef,
          } as DataInputDefsByKey<FORM_DATA>,
        ]);
      }
    }

    tuples.push([
      'controllers',
      [
        {
          type: 'button',
          label: 'Submit',
          on: { click: 'submit' },
        },
      ],
    ]);
    return tuples;
  }

  mergeKeys(keysLeft: string[] | null, keysRight: string[] | null): string[] {
    if (keysLeft === null && keysRight === null) {
      throw new Error('Both keysLeft and keysRight cannot be null');
    }

    if (keysLeft === null) {
      return keysRight == null ? [] : keysRight;
    }

    if (keysRight === null) {
      return keysLeft;
    }

    // Filter out keys from keysRight that already exist in keysLeff
    const uniqueRightKeys = keysRight.filter((key) => !keysLeft.includes(key));
    return [...keysLeft, ...uniqueRightKeys];
  }

  private extractDataInputDefs<FormData extends Record<string, any> = any>(
    formDefOut: FormDefFacade<FormData> | null,
  ): Record<string, DataInputDef> {
    if (formDefOut == null) {
      return {};
    }
    if (!Array.isArray(formDefOut)) {
      throw new Error('Form definition must be an array');
    }
    const formDefRaw: FormDefFacadeLike<FormData>[] = formDefOut as FormDefFacadeLike<FormData>[];
    const result: Record<string, DataInputDef> = {};
    if (!Array.isArray(formDefRaw)) {
      throw new Error('Form definition must be an array');
    }
    formDefRaw.forEach((tuple) => {
      if (!Array.isArray(tuple)) {
        throw new Error('Form definition must contain tuples');
      }

      const asTuple: FormDefTuple<FormData> = tuple;
      const subKeys = asTuple[1] ? Object.keys(asTuple[1]) : [];
      for (const subKey of subKeys) {
        result[subKey] = asTuple[1][subKey as keyof (typeof asTuple)[1]] as DataInputDef;
      }
    });

    return result;
  }
}
const formDefFacadeFactory = new FormDefFacadeFactory();
export default formDefFacadeFactory;
