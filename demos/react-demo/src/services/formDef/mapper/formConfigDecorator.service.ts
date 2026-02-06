import {
  ActionDef,
  BooleanDataInputDef,
  InputDef,
  NumberDataInputDef,
  TextDataInputDef,
} from '../formDef.domain';
import { FormConfig } from '../fomConfig.domain';
import { ActionWidget, FormWidget, InputWidget, UiState } from '@golemui/core';
import objectUtils, { ObjectUtils } from '../../../utils/objectUtils.service';
import { GuiItemsShortcutType } from '../dx/gui/gui.domain';

const BASE_CONFIG: FormConfig<any> = {
  suppressAutomaticLabels: false,
};

export class FormConfigDecorator {
  constructor(private readonly objectUtils: ObjectUtils) {}

  processFormConfiguration<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    item: InputDef | ActionDef,
    type: GuiItemsShortcutType,
    formConfig?: FormConfig<FormData>,
  ): FormWidget<StateKeys, FormData> {
    const applicableConfigs: FormConfig<FormData>[] = [BASE_CONFIG];
    if (item?.tags && item.tags.length > 0) {
      const valueTags = item.tags as string[];
      valueTags
        .reverse() // The most powerful tag should be the first
        .map((tag) => formConfig?.tags?.[tag])
        .filter((result) => result != null)
        .forEach((config) => applicableConfigs.push(config));
    }

    let currentConfig: FormConfig<FormData> = {};
    let accumulatedDef: InputDef | ActionDef = {};
    applicableConfigs.forEach((newConfig) => {
      currentConfig = this.objectUtils.deepMerge(currentConfig, newConfig);
      const thisDef = this.applyItemConfig(type, item, currentConfig);
      accumulatedDef = this.objectUtils.deepMerge(accumulatedDef, thisDef);
    });

    // The most powerful configuration should be the one hardcoded in the formDef
    accumulatedDef = this.objectUtils.deepMerge(accumulatedDef, item);

    switch (type) {
      case GuiItemsShortcutType.INPUTS:
        return this.mapToInputWidget(accumulatedDef as InputDef);
      case GuiItemsShortcutType.ACTIONS:
        return this.mapToActionWidget(accumulatedDef as ActionDef);
    }
  }

  private mapToInputWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(fieldDef: InputDef): InputWidget<any, StateKeys, FormData> {
    switch (fieldDef.type) {
      case 'text':
        return this.mapTextInputDef(fieldDef);
      case 'number':
        return this.mapNumberInputDef(fieldDef);
      case 'boolean':
        return this.mapBooleanInputDef(fieldDef);
      default:
        throw new Error(`Unsupported field type "${(fieldDef as InputDef).type}"`);
    }
  }

  private mapBooleanInputDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(fieldDef: BooleanDataInputDef): InputWidget<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'input',
      type: 'toggle',
      path: fieldDef.dataPath!,
      ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
      props: {
        placeholder: fieldDef.placeholder ?? '',
      },
    };
  }
  private mapTextInputDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(fieldDef: TextDataInputDef): InputWidget<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: fieldDef.dataPath!,
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

  private mapNumberInputDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(fieldDef: NumberDataInputDef): InputWidget<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'input',
      type: 'number',
      path: fieldDef.dataPath!,
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

  private mapToActionWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(controllerDef: ActionDef): ActionWidget<StateKeys, FormData> {
    return {
      uid: '',
      kind: 'action', // data
      type: 'button',
      disabled: controllerDef.disabled,
      label: controllerDef.label,
      on: controllerDef.on,
    };
  }

  private applyItemConfig<FormData extends Record<string, any> = any>(
    type: GuiItemsShortcutType,
    item: InputDef | ActionDef,
    currentConfig: FormConfig<FormData>
  ): InputDef | ActionDef {
    switch (type) {
      case GuiItemsShortcutType.INPUTS:
        return this.applyInputConfig(item as InputDef, currentConfig);
      case GuiItemsShortcutType.ACTIONS:
        return this.applyActionConfig(item as ActionDef, currentConfig);
    }
  }

  private applyInputConfig<FormData extends Record<string, any> = any>(
    item: InputDef,
    currentConfig: FormConfig<FormData>,
  ): InputDef {
    return {
      ...item,
      ...(currentConfig.suppressAutomaticLabels ? {} : { label: item.label ?? item.dataPath }),
    };
  }

  private applyActionConfig<FormData extends Record<string, any> = any>(
    item: ActionDef,
    currentConfig: FormConfig<FormData>,
  ): ActionDef {
    return {
      ...item,
    };
  }
}

const formConfigDecorator = new FormConfigDecorator(objectUtils);
export default formConfigDecorator;
