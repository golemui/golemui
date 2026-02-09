import {
  ActionDef,
  ActionDefCallback,
  BooleanDataInputDef,
  DynamicItemDefParams,
  InputDef,
  NumberDataInputDef,
  TextDataInputDef,
  WidgetItemDef,
} from '../formDef.domain';
import {
  ActionHints,
  FormActionConfigCallback,
  FormActionConfigLike,
  FormConfig,
  FormInputConfigCallback,
  FormInputConfigLike,
  PartialInputDefCallback,
  ItemHints,
} from '../fomConfig.domain';
import { ActionWidget, FormWidget, InputWidget, UiState } from '@golemui/core';
import objectUtils, { ObjectUtils } from '../../../utils/objectUtils.service';
import { GuiItemsShortcutType } from '../dx/gui/gui.domain';

const BASE_CONFIG: FormConfig<any> = {
  suppressAutomaticLabels: false,
};
export interface PreProcessResult {
  accumulatedHints: Partial<ActionHints<any> | ItemHints>;
  containsCallbacks: boolean;
  applicableConfigsInPriorityOrder: FormConfig<FormData>[];
  accumulatedDef: InputDef | ActionDef;
}

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
    const preProcessResult = this.preProcess(item, type, formConfig);
    return this.postProcess(preProcessResult, item, type);
  }

  public preProcess<FormData extends Record<string, any> = any>(
    item: InputDef | ActionDef,
    type: GuiItemsShortcutType,
    formConfig?: FormConfig<FormData>,
  ): PreProcessResult {
    const applicableConfigsInPriorityOrder: FormConfig<FormData>[] =
      formConfig != null ? [formConfig] : [];
    if (item?.tags && item.tags.length > 0) {
      const valueTags = item.tags as string[];
      valueTags
        .map((tag) => formConfig?.tags?.[tag])
        .filter((result) => result != null)
        .forEach((config) => applicableConfigsInPriorityOrder.push(config));
    }

    applicableConfigsInPriorityOrder.push(BASE_CONFIG);

    let accumulatedHints: Partial<ActionHints<FormData> | ItemHints> = {};
    let containsCallbacks = false;
    let accumulatedDef: InputDef | ActionDef = item;
    //We reverse the order of the configs to ensure that the most powerful one is applied last
    applicableConfigsInPriorityOrder.reverse().forEach((newConfig) => {
      accumulatedHints = this.objectUtils.deepMerge(accumulatedHints, newConfig);
      const result = this.applyDefaultConfig(type, accumulatedDef, newConfig);
      if (typeof result === 'function') {
        containsCallbacks = true;
      } else {
        accumulatedDef = this.objectUtils.deepMerge(accumulatedDef, result);
      }
    });

    return {
      accumulatedHints,
      containsCallbacks,
      applicableConfigsInPriorityOrder,
      accumulatedDef,
    };
  }

  public postProcess<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    preProcessResult: PreProcessResult,
    item: TextDataInputDef | NumberDataInputDef | BooleanDataInputDef | ActionDef,
    type: GuiItemsShortcutType,
  ): FormWidget<StateKeys, FormData> {
    if (preProcessResult.containsCallbacks) {
      throw new Error(`TBI, nesting functions is not supported yet! Whoever called preProcess should check this first!`);
    }
    // The most powerful configuration should be the one hardcoded in the formDef
    const accumulatedDef = this.objectUtils.deepMerge(preProcessResult.accumulatedDef, item);

    switch (type) {
      //Finally we apply the accumulated hints to the item
      case GuiItemsShortcutType.INPUTS:
        return this.mapToInputWidget(
          this.applyInputHints(accumulatedDef as InputDef, preProcessResult.accumulatedHints),
        );
      case GuiItemsShortcutType.ACTIONS:
        return this.mapToActionWidget(
          this.applyActionHints(accumulatedDef as ActionDef, preProcessResult.accumulatedHints),
        );
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
      path: fieldDef.path!,
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
      path: fieldDef.path!,
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
      path: fieldDef.path!,
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
  private applyInputHints<FormData extends Record<string, any> = any>(
    item: InputDef,
    currentConfig: FormConfig<FormData>,
  ): InputDef {
    if (item.label != null) {
      return item;
    }
    return {
      ...item,
      ...(currentConfig.suppressAutomaticLabels ? { label: '' } : { label: item.path }),
    };
  }

  private applyActionHints<FormData extends Record<string, any> = any>(
    item: ActionDef,
    currentConfig: FormConfig<FormData>,
  ): ActionDef {
    return {
      ...item,
    };
  }

  private checkDefaultConfigIsCallback<FormData extends Record<string, any> = any>(
    type: GuiItemsShortcutType,
    config: FormConfig<FormData>,
  ): boolean {
    if (type === GuiItemsShortcutType.INPUTS) {
      return typeof config.defaultInputDef === 'function';
    }
    if (type === GuiItemsShortcutType.ACTIONS) {
      return typeof config.defaultActionDef === 'function';
    }
    return false;
  }

  private applyDefaultConfig<FormData extends Record<string, any> = any>(
    type: GuiItemsShortcutType,
    accumulatedDef: InputDef | ActionDef,
    newConfig: FormConfig<FormData>,
  ): WidgetItemDef | ActionDefCallback | PartialInputDefCallback {
    let defaultValue: FormActionConfigLike | FormInputConfigLike | undefined;
    if (type === GuiItemsShortcutType.INPUTS) {
      defaultValue = newConfig.defaultInputDef;
    }
    if (type === GuiItemsShortcutType.ACTIONS) {
      defaultValue = newConfig.defaultActionDef;
    }
    if (defaultValue == null) {
      return accumulatedDef;
    }
    if (typeof defaultValue === 'object') {
      return this.objectUtils.deepMerge(accumulatedDef, newConfig.defaultInputDef);
    }

    const asCallback: FormActionConfigCallback | FormInputConfigCallback = defaultValue;
    const result = asCallback(accumulatedDef as any);

    if (typeof result === 'function') {
      return result;
    }

    return this.objectUtils.deepMerge(accumulatedDef, result);
  }
}

const formConfigDecorator = new FormConfigDecorator(objectUtils);
export default formConfigDecorator;
