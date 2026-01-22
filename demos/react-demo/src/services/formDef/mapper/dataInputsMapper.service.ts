import { NumberDataInputDef, OneOfDataInputDefs, TextDataInputDef, ValidInputDef, } from '../formDef.domain';
import { DefaultFieldDefFn, DefaultFieldDefParams, FormConfig } from '../fomConfig.domain';
import { ControlField, UiState } from '@golemui/core';
import sensibleDefaults, { SensibleDefaults } from '../default/sensibleDefaults.service';
import objectUtils, { ObjectUtils } from '../../../utils/objectUtils.service';

const LABEL_EMPTY_PLACEHOLDER_WITH_KEY: DefaultFieldDefFn = ({ fieldKey }) => {
  return {
    label: null,
    placeholder: `${fieldKey}`,
  };
};
const USE_FIELD_KEY_AS_LABEL: DefaultFieldDefFn = ({ fieldKey }) => ({
  label: fieldKey,
});

export class DataInputsMapper {
  constructor(
    private readonly sensibleDefaults: SensibleDefaults,
    private readonly objectUtils: ObjectUtils,
  ) {}

  mapControlField<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    key: string,
    baseFieldDef: OneOfDataInputDefs,
    formConfig?: FormConfig<FormData>,
  ): ControlField<any, StateKeys, FormData> {
    let withTagsFieldDef = baseFieldDef;
    let rolledUpConfig = formConfig;
    if (baseFieldDef?.tags && baseFieldDef.tags.length > 0) {
      baseFieldDef.tags.forEach((tag) => {
        const tagConfig = rolledUpConfig?.tags?.[tag];
        rolledUpConfig = this.objectUtils.deepMerge(rolledUpConfig, tagConfig);
        if (tagConfig == null) {
          throw new Error(`Tag "${tag}" is not defined in the form config!`);
        }
        const fieldDefWithTagRemoved = {
          ...baseFieldDef,
          tags: baseFieldDef!.tags!.filter((t) => t !== tag),
        }
        const fieldDefForTag = this.applyFormConfig(key, fieldDefWithTagRemoved, rolledUpConfig);
        withTagsFieldDef = this.objectUtils.deepMerge<OneOfDataInputDefs>(withTagsFieldDef, fieldDefForTag);
      })
    }

    const withFormConfig = this.applyFormConfig(key, withTagsFieldDef, rolledUpConfig);
    const merged = this.objectUtils.deepMerge<OneOfDataInputDefs>(withTagsFieldDef, withFormConfig);

    return this.mapToControlField<StateKeys, FormData>(key, merged);
  }

  private applyFormConfig<FormData extends Record<string, any> = any>(
    key: string,
    baseFieldDef: OneOfDataInputDefs,
    formConfig: FormConfig<FormData> | undefined,
  ): Partial<OneOfDataInputDefs> | null {
    const labelInfo = this.extractLabelDecorator(key, baseFieldDef, formConfig);
    const withLabels = this.objectUtils.deepMerge<OneOfDataInputDefs>(baseFieldDef, labelInfo);

    const defaultFieldDecorator = this.extractDefaultFieldDefDecorator(key, withLabels, formConfig);
    const withLabelsAndDefaultFieldDecorator = this.objectUtils.deepMerge<OneOfDataInputDefs>(
      withLabels,
      defaultFieldDecorator,
    );
    return withLabelsAndDefaultFieldDecorator;
  }

  private extractDefaultFieldDefDecorator<FormData extends Record<string, any> = any>(
    key: string,
    baseFieldDef: OneOfDataInputDefs,
    formConfig?: FormConfig<FormData>,
  ): Partial<OneOfDataInputDefs> | null {
    if (formConfig?.defaultFieldDef != null) {
      return typeof formConfig.defaultFieldDef === 'function'
        ? this.createDefaultFieldDefFromFn(
            formConfig.defaultFieldDef,
            baseFieldDef,
            baseFieldDef,
            key,
          )
        : formConfig.defaultFieldDef;
    } else {
      return null;
    }
  }

  private extractLabelDecorator<FormData extends Record<string, any> = any>(
    key: string,
    baseFieldDef: OneOfDataInputDefs,
    formConfig?: FormConfig<FormData>,
  ): Partial<OneOfDataInputDefs> | null {
    if (baseFieldDef.label != null) {
      // No need to decorate the label, the user is being specific about it.
      return null;
    }

    // From now on the user has NOT specified a label, so let's decorate the definition based on suppressAutomaticLabels
    const useLabels = !formConfig?.suppressAutomaticLabels;
    //IF suppressAutomaticLabels:true => We add the placeholder as key
    //IF suppressAutomaticLabels:false [DEFAULT] => We make the label match the key
    const labelsDecorator = useLabels ? USE_FIELD_KEY_AS_LABEL : LABEL_EMPTY_PLACEHOLDER_WITH_KEY;

    return labelsDecorator({
      fieldKey: key,
      currentDef: baseFieldDef,
      baseDef: baseFieldDef,
    });
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
      return fieldDefRaw as OneOfDataInputDefs;
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
