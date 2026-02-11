import sensibleDefaults, { SensibleDefaults } from '../../../default/sensibleDefaults.service';
import {
  InputTags,
  InputDecorator,


} from '../../../formDef.domain';
import { ParsedDxShortcut, UnrolledField, UnrolledFields } from '../../dx.domain';
import {
  DxField,
  FacadeFieldByKey,
  PartialInputDefCallback,
  InputDefOrCallback,
  ProcessedDxFieldsByKey,
} from '../../gui/shortcuts/guiFields.impl';

export class InputDefsByKeyService {
  constructor(private readonly sensibleDefaults: SensibleDefaults) {}

  unroll<FORM_DATA extends Record<string, any> = any>(
    payload: FacadeFieldByKey<FORM_DATA>,
    source: ParsedDxShortcut<any>,
  ): UnrolledFields {
    return {
      source,
      type: 'fields',
      items: this.processPayload(payload),
    };
  }

  public expandFields<T extends Record<string, any>>(
    fields: FacadeFieldByKey<T>,
  ): ProcessedDxFieldsByKey<T> {
    const result: ProcessedDxFieldsByKey<T> = {};
    Object.entries(fields).forEach(([key, dataInputDef]) => {
      if (!dataInputDef) {
        throw new Error(`Unexpected undefined value for field key: ${key}`);
      }

      result[key as keyof T] = this.expandField(dataInputDef);
    });
    return result;
  }

  private expandField(dataInputDef: DxField): InputDefOrCallback {
    let value: InputDefOrCallback;
    if (typeof dataInputDef === 'function') {
      value = dataInputDef as InputDefCallback;
    } else if (typeof dataInputDef === 'string') {
      value = this.sensibleDefaults.explodeShortcut(dataInputDef);
    } else if (Array.isArray(dataInputDef)) {
      const [shortcut, ...tagList] = dataInputDef as InputTags;
      value = this.sensibleDefaults.explodeShortcut(shortcut);
      if (tagList.length > 0) {
        value.tags = tagList;
      }
    } else {
      value = dataInputDef as InputDecorator;
    }

    return value;
  }

  private processPayload<FORM_DATA extends Record<string, any> = any>(
    payload: FacadeFieldByKey<FORM_DATA>,
  ): UnrolledField[] {
    const expandedFields:ProcessedDxFieldsByKey<FORM_DATA> = this.expandFields(payload);
    const result: UnrolledField[] = [];

    Object.entries(payload).forEach(([key, dataInputDef]) => {
      if (!dataInputDef) {
        throw new Error(`Unexpected undefined value for field key: ${key}`);
      }

      const value: InputDefOrCallback = expandedFields[key as keyof FORM_DATA]!;

      result.push({
        key,
        value,
        type: 'field',
      });
    });
    return result;
  }
}

const inputDefsByKeyService = new InputDefsByKeyService(sensibleDefaults);
export default inputDefsByKeyService;
