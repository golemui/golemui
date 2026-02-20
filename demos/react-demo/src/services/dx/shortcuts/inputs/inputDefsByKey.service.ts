import inputTypeDefaults, { InputTypeDefaults } from './inputTypeDefaults.service';
import {
  InputDecorator,
  InputTags,
  InputDefOrCallback,
  PartialInputDefCallback,
  ValidShortcutType,
} from './inputs.domain';

export type DxField = InputDefOrCallback | ValidShortcutType | InputTags;

export type FacadeFieldByKey<T extends Record<string, any>> = Partial<Record<keyof T, DxField>>;

export type ProcessedDxFieldsByKey<T extends Record<string, any>> = Partial<
  Record<keyof T, InputDefOrCallback>
>;

export class InputDefsByKeyService {
  constructor(private readonly inputTypeDefaults: InputTypeDefaults) {}
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
      value = this.inputTypeDefaults.explodeShortcut(dataInputDef);
    } else if (Array.isArray(dataInputDef)) {
      const [shortcut, ...tagList] = dataInputDef as InputTags;
      value = this.inputTypeDefaults.explodeShortcut(shortcut);
      if (tagList.length > 0) {
        value.tags = tagList;
      }
    } else {
      value = dataInputDef as InputDecorator;
    }

    return value;
  }
}

const inputDefsByKeyService = new InputDefsByKeyService(inputTypeDefaults);
export default inputDefsByKeyService;
