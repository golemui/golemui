import sensibleDefaults, { SensibleDefaults } from '../../../default/sensibleDefaults.service';
import {
  DataInputDefsByKey,
  InputTags,
  OneOfDataInputDefs,
  OneOfDataInputDefsCallback,
  ProcessedValidInputDef,
} from '../../../formDef.domain';
import { ParsedDxShortcut, UnrolledField, UnrolledFields } from '../../dx.domain';


export class InputDefsByKeyService {
  constructor(private readonly sensibleDefaults: SensibleDefaults) {}

  unroll<FORM_DATA extends Record<string, any> = any>(
    payload: DataInputDefsByKey<FORM_DATA>,
    source: ParsedDxShortcut<any>,
  ): UnrolledFields {
    return {
      source,
      type: 'fields',
      items: this.processPayload(payload),
    };
  }

  private processPayload<FORM_DATA extends Record<string, any> = any>(
    payload: DataInputDefsByKey<FORM_DATA>,
  ): UnrolledField[] {
    const result: UnrolledField[] = [];
    Object.entries(payload).forEach(([key, dataInputDef]) => {
      if (!dataInputDef) {
        throw new Error(`Unexpected undefined value for field key: ${key}`);
      }

      let value: ProcessedValidInputDef;
      let tags: string[] = [];
      if (typeof dataInputDef === 'function') {
        value = dataInputDef as OneOfDataInputDefsCallback;
      } else if (typeof dataInputDef === 'string') {
        value = this.sensibleDefaults.explodeShortcut(dataInputDef);
      } else if (Array.isArray(dataInputDef)) {
        const [shortcut, ...tagList] = dataInputDef as InputTags;
        value = this.sensibleDefaults.explodeShortcut(shortcut);
        tags = tagList as string[];
      } else {
        value = dataInputDef as OneOfDataInputDefs;
      }

      result.push({
        key,
        value,
        tags,
        type: 'field',
      });
    });
    return result;
  }
}

const inputDefsByKeyService = new InputDefsByKeyService(sensibleDefaults);
export default inputDefsByKeyService;
