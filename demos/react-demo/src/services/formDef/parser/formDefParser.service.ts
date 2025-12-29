import {
  DataInputDef,
  DataInputDefsByKey,
  FormDefFacade,
  FormDefFacadeLike,
  FormDefTuple,
} from '../formDef.domain';

const NO_INPUT_DEFS: Record<string, any> = {};

export class FormDefParser {
  extractDataInputDefs<FormData extends Record<string, any> = any>(
    formDefFacade: FormDefFacade<FormData> | null,
  ): Record<string, DataInputDef> {
    if (formDefFacade == null) {
      return NO_INPUT_DEFS;
    }

    if (!Array.isArray(formDefFacade)) {
      return this.extractDataInputDefs([
        [`data_inputs`, formDefFacade as DataInputDefsByKey<FormData>],
      ]);
    }

    const formDefRaw: FormDefFacadeLike<FormData>[] =
      formDefFacade as FormDefFacadeLike<FormData>[];

    const result: Record<string, DataInputDef> = {};
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

const formDefParser = new FormDefParser();
export default formDefParser;
