import {
  BooleanDataInputDef,
  ControllerDef,
  GolemFormItem,
  NumberDataInputDef,
  OneOfDataInputDefs,
  TextDataInputDef,
} from '../formDef.domain';
import { DefaultFieldDefFn, DefaultFieldDefParams, FormConfig } from '../fomConfig.domain';
import { ControlField, InteractiveField, UiState } from '@golemui/core';
import objectUtils, { ObjectUtils } from '../../../utils/objectUtils.service';
import { ReadyToMapToGolemFormItem } from './formDefMapper.service';
import { UnrolledField } from '../dx/dx.domain';

const LABEL_EMPTY_PLACEHOLDER_WITH_KEY: DefaultFieldDefFn = ({ fieldKey }) => {
  return {
    label: null,
    placeholder: `${fieldKey}`,
  };
};
const USE_FIELD_KEY_AS_LABEL: DefaultFieldDefFn = ({ fieldKey }) => ({
  label: fieldKey,
});

export class FormItemsMapper {
  constructor(private readonly objectUtils: ObjectUtils) {}

  mapItem<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    item: ReadyToMapToGolemFormItem,
    formConfig?: FormConfig<FormData>,
  ): ControlField<any, StateKeys, FormData> | InteractiveField<StateKeys, FormData> {
    let rolledUpConfig = formConfig;
    const rolledUpReadyToImport: ReadyToMapToGolemFormItem = {
      ...item,
    };
    const value: GolemFormItem = item.value;
    if (value?.tags && value.tags.length > 0) {
      const valueTags = value.tags as string[];
      valueTags.forEach((tag) => {
        const tagConfig = rolledUpConfig?.tags?.[tag];
        rolledUpConfig = this.objectUtils.deepMerge(rolledUpConfig, tagConfig);
        if (tagConfig == null) {
          throw new Error(`Tag "${tag}" is not defined in the form config!`);
        }
        const fieldDefWithTagRemoved: ReadyToMapToGolemFormItem = {
          unrolledElement: item.unrolledElement,
          isCallback: item.isCallback,
          value: {
            ...item.value,
            tags: valueTags.filter((t) => t !== tag),
          },
          type: item.type,
        };
        const fieldDefForTag = this.applyFormConfig(fieldDefWithTagRemoved, rolledUpConfig);
        rolledUpReadyToImport.value = this.objectUtils.deepMerge<
          OneOfDataInputDefs | ControllerDef
        >(rolledUpReadyToImport.value, fieldDefForTag.value);
      });
    }

    const withBaseConfig = this.applyFormConfig(rolledUpReadyToImport, rolledUpConfig);
    const merged = this.objectUtils.deepMerge<OneOfDataInputDefs | ControllerDef>(
      withBaseConfig.value,
      rolledUpReadyToImport.value,
    );

    if (rolledUpReadyToImport.type === 'controller') {
      return this.mapInteractiveField(rolledUpReadyToImport.value as ControllerDef);
    }
    return this.mapToControlField<StateKeys, FormData>(
      (rolledUpReadyToImport.unrolledElement as UnrolledField).key,
      merged as OneOfDataInputDefs,
    );
  }

  private applyFormConfig<FormData extends Record<string, any> = any>(
    item: ReadyToMapToGolemFormItem,
    formConfig: FormConfig<FormData> | undefined,
  ): ReadyToMapToGolemFormItem {
    if (item.unrolledElement.type === 'field') {
      return {
        ...item,
        value: this.applyFormConfigToField(
          item.unrolledElement.key,
          item.unrolledElement.value as OneOfDataInputDefs,
          formConfig,
        ),
      };
    }

    console.warn(`eventually there will be configuration for controls, so far this is ignored`);
    return item;
  }

  private applyFormConfigToField<FormData extends Record<string, any> = any>(
    key: string,
    baseFieldDef: OneOfDataInputDefs,
    formConfig: FormConfig<FormData> | undefined,
  ): OneOfDataInputDefs {
    const labelInfo = this.extractLabelDecorator(key, baseFieldDef, formConfig);
    const withLabels = this.objectUtils.deepMerge<OneOfDataInputDefs>(baseFieldDef, labelInfo);

    const defaultFieldDecorator = this.extractDefaultFieldDefDecorator(key, withLabels, formConfig);

    return this.objectUtils.deepMerge<OneOfDataInputDefs>(withLabels, defaultFieldDecorator);
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
  private mapToControlField<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: OneOfDataInputDefs): ControlField<any, StateKeys, FormData> {
    switch (fieldDef.type) {
      case 'text':
        return this.mapTextFieldDef(key, fieldDef);
      case 'number':
        return this.mapNumberFieldDef(key, fieldDef);
      case 'boolean':
        return this.mapBooleanFieldDef(key, fieldDef);
      default:
        throw new Error(`Unsupported field type "${(fieldDef as OneOfDataInputDefs).type}"`);
    }
  }
  private mapBooleanFieldDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: BooleanDataInputDef): ControlField<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'control',
      widget: 'toggle',
      path: key,
      ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
      props: {
        placeholder: fieldDef.placeholder ?? '',
      },
    };
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

  private mapInteractiveField<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(controllerDef: ControllerDef): InteractiveField<StateKeys, FormData> {
    return {
      uid: '',
      kind: 'interactive', // data
      widget: 'button',
      disabled: controllerDef.disabled,
      label: controllerDef.label,
      on: controllerDef.on
    };
  }
}

const formItemsMapper = new FormItemsMapper(objectUtils);
export default formItemsMapper;
