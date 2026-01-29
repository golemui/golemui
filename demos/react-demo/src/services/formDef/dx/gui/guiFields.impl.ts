import {
  ControllerDef,
  ControllerDefCallback,
  DxShortcutFinal,
  DynamicDefParams,
  InputTags,
  OneOfDataInputDefs,
  ValidShortcutType,
} from '../../formDef.domain';
import { guiFieldsService } from './guiFields.sercice';

export type DxField = ProcessedDxField | ValidShortcutType | InputTags;
export type OneOfDataInputDefsCallback = (params: DynamicDefParams) => OneOfDataInputDefs;
export type ProcessedDxField = OneOfDataInputDefs | OneOfDataInputDefsCallback;
export type ProcessedValidControllerDef = ControllerDef | ControllerDefCallback;

export type DxFieldsByKey<T extends Record<string, any>> = Partial<Record<keyof T, DxField>>;

export type ProcessedDxFieldsByKey<T extends Record<string, any>> = Partial<
  Record<keyof T, ProcessedDxField>
>;

export interface ReadyToMapField {
  key: string;
  processedField: ProcessedDxField;
}
export type FieldsShortcut = DxShortcutFinal<'_inputDefsByKey', ReadyToMapField>;

export const _guiFields = <T extends Record<string, unknown>>(
  fields: DxFieldsByKey<T>,
  tags?: string[],
): FieldsShortcut => {
  const expanded: ProcessedDxFieldsByKey<T> = guiFieldsService.expand(fields);
  const asArray: ReadyToMapField[] = Object.entries(expanded).map((entry) => {
    const [key, processedField] = entry as [string, ProcessedDxField];
    return {
      processedField,
      key,
    };
  });
  if (tags) {
    return [['_inputDefsByKey', ...tags], asArray];
  }
  return [['_inputDefsByKey'], asArray];
};
