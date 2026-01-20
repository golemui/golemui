import {
  NumberDataInputDef,
  OneOfDataInputDefs,
  TextDataInputDef,
  ValidInputDef,
} from '../formDef.domain';
import { DefaultFieldDefFn, DefaultFieldDefParams, FormConfig } from '../fomConfig.domain';
import { ControlField, UiState } from '@golemui/core';
import sensibleDefaults, { SensibleDefaults } from '../default/sensibleDefaults.service';
import objectUtils, { ObjectUtils } from '../../../utils/objectUtils.service';

const SUPPRESS_LABELS_DEFAULT: DefaultFieldDefFn = ({ fieldKey, currentDef }) => {
  if (currentDef.label != null) {
    return currentDef;
  }
  return {
    label: null,
    placeholder: `${fieldKey}`,
  };
};
const SHOW_LABELS_DEFAULT: DefaultFieldDefFn = ({ fieldKey }) => ({
  label: fieldKey,
});

export class DataInputsMapper {
  constructor(
    private readonly sensibleDefaults: SensibleDefaults,
    private readonly objectUtils: ObjectUtils,
  ) {}

  mapControlField<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    key: string,
    fieldDefRaw: ValidInputDef,
    formConfig?: FormConfig<FormData>,
  ): ControlField<any, StateKeys, FormData> {
    const baseFieldDef: OneOfDataInputDefs = this.explodeShortcutIfNeeded(fieldDefRaw);

    const useLabels = !formConfig?.suppressAutomaticLabels;
    const labelsDecorator = useLabels ? SHOW_LABELS_DEFAULT : SUPPRESS_LABELS_DEFAULT;
    const labelsFieldDef = labelsDecorator({
      fieldKey: key,
      currentDef: baseFieldDef,
      baseDef: baseFieldDef,
    });
    const withLabels = this.objectUtils.deepMerge(baseFieldDef, labelsFieldDef);

    if (formConfig?.defaultFieldDef == null) {
      return this.mapToControlField<StateKeys, FormData>(key, withLabels);
    }

    const defaultDef =
      typeof formConfig.defaultFieldDef === 'function'
        ? this.createDefaultFieldDefFromFn(
            formConfig.defaultFieldDef,
            withLabels,
            baseFieldDef,
            key,
          )
        : formConfig.defaultFieldDef;

    console.log(`about to merge`, baseFieldDef, defaultDef);
    const combinedDef = this.objectUtils.deepMerge<OneOfDataInputDefs>(withLabels, defaultDef);
    return this.mapToControlField<StateKeys, FormData>(key, combinedDef);
  }

  private createDefaultFieldDefFromFn(
    fn: (params: DefaultFieldDefParams) => Partial<OneOfDataInputDefs>,
    currentDef: OneOfDataInputDefs,
    baseDef: OneOfDataInputDefs,
    fieldKey: string,
  ): Partial<OneOfDataInputDefs> {
    const params: DefaultFieldDefParams = {
      fieldKey,
      currentDef,
      baseDef,
    };
    return fn(params);
  }

  private explodeShortcutIfNeeded(fieldDefRaw: ValidInputDef): OneOfDataInputDefs {
    if (typeof fieldDefRaw === 'string') {
      return this.sensibleDefaults.explodeShortcut(fieldDefRaw);
    }

    if (typeof fieldDefRaw === 'object') {
      return fieldDefRaw;
    }

    throw new Error(`Now we need to add support for dynamic field definitions!`);
  }

  private mapToControlField<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: OneOfDataInputDefs): ControlField<any, StateKeys, FormData> {
    switch (fieldDef.type) {
      case 'text':
        return this.mapTextFieldDef(key, fieldDef);
      case 'number':
        return this.mapNumberFieldDef(key, fieldDef);
      default:
        throw new Error(`Unsupported field type "${(fieldDef as OneOfDataInputDefs).type}"`);
    }
  }

  private mapTextFieldDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: TextDataInputDef): ControlField<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: key,
      ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
      props: {
        placeholder: fieldDef.placeholder ?? '',
      },
      validator: {
        type: 'string',
        ...fieldDef.validator,
      },
    };
  }

  private mapNumberFieldDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: NumberDataInputDef): ControlField<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: key,
      ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
      props: {
        placeholder: fieldDef.placeholder ?? '',
      },
      validator: {
        type: 'number',
        ...fieldDef.validator,
      },
    };
  }
}

const dataInputsMapper = new DataInputsMapper(sensibleDefaults, objectUtils);
export default dataInputsMapper;
