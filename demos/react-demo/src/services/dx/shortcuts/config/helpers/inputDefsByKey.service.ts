import sensibleDefaults, { SensibleDefaults } from '../../../default/sensibleDefaults.service';
import { InputDecorator, InputTags } from '../../../formDef.domain';
import {
  DxField,
  FacadeFieldByKey,
  InputDefOrCallback,
  ProcessedDxFieldsByKey,
} from '../../gui/shortcuts/guiFields.impl';
import { PartialInputDefCallback } from '../../../dxSelectors.domain';

export class InputDefsByKeyService {
  constructor(private readonly sensibleDefaults: SensibleDefaults) {}
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
      value = dataInputDef as PartialInputDefCallback;
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
}

const inputDefsByKeyService = new InputDefsByKeyService(sensibleDefaults);
export default inputDefsByKeyService;
