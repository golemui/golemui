import {
  ActionDecorator,
  ActionDefCallback,
  BooleanDataInputDecorator,
  InputDecorator,
  NumberDataInputDecorator,
  TextDataInputDecorator,
  WidgetItemDecorator,
} from '../formDef.domain';
import {
  ActionDecoratorCallback,
  ActionWidgetDecoratorsLike,
  FormConfig,
  FormSensibleDefaults,
  InputDecoratorCallback,
  InputSensibleDefaults,
  InputWidgetDecoratorsLike,
  PartialInputDefCallback,
} from '../fomConfig.domain';
import { ActionWidget, FormWidget, InputWidget, UiState } from '@golemui/core';
import objectUtils, { ObjectUtils } from '../../../utils/objectUtils.service';
import { GuiItemsShortcutType } from '../dx/gui/gui.domain';
import formInputHintsDecoratorsService, {
  InputSensibleDefaultsService,
} from './inputSensibleDefaults.service';

export interface PreProcessResult {
  aggregatedSensibleDefaults: FormSensibleDefaults;
  containsCallbacks: boolean;
  applicableConfigsInPriorityOrder: FormConfig<FormData>[];
  accumulatedDef: InputDecorator | ActionDecorator;
}

export const BASE_INPUT_DEFAULTS: InputSensibleDefaults = {
  suppressAutomaticPlaceholders: false,
  suppressAutomaticLabels: false,
};

export class FormConfigDecorator {
  constructor(
    private readonly objectUtils: ObjectUtils,
    private readonly formInputHintsDecoratorsService: InputSensibleDefaultsService,
  ) {}

  processFormConfiguration<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    item: InputDecorator | ActionDecorator,
    type: GuiItemsShortcutType,
    formConfig?: FormConfig<FormData>,
  ): FormWidget<StateKeys, FormData> {
    const preProcessResult = this.preProcess(item, type, formConfig);
    return this.postProcess(preProcessResult, item, type);
  }

  public preProcess<FormData extends Record<string, any> = any>(
    item: InputDecorator | ActionDecorator,
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

    let aggregatedSensibleDefaults: FormSensibleDefaults = {
      inputs: BASE_INPUT_DEFAULTS,
    };
    let containsCallbacks = false;
    let accumulatedDef: InputDecorator | ActionDecorator = item;
    //We reverse the order of the configs to ensure that the most powerful one is applied last

    applicableConfigsInPriorityOrder.reverse().forEach((newConfig) => {
      aggregatedSensibleDefaults = this.objectUtils.deepMerge(
        aggregatedSensibleDefaults,
        newConfig.sensibleDefaults,
      );
      const result = this.applyDefaultConfig(type, accumulatedDef, newConfig);
      if (typeof result === 'function') {
        containsCallbacks = true;
      } else {
        accumulatedDef = this.objectUtils.deepMerge(accumulatedDef, result);
      }
    });

    return {
      aggregatedSensibleDefaults,
      containsCallbacks,
      applicableConfigsInPriorityOrder,
      accumulatedDef,
    };
  }

  public postProcess<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    preProcessResult: PreProcessResult,
    item:
      | TextDataInputDecorator
      | NumberDataInputDecorator
      | BooleanDataInputDecorator
      | ActionDecorator,
    type: GuiItemsShortcutType,
  ): FormWidget<StateKeys, FormData> {
    if (preProcessResult.containsCallbacks) {
      throw new Error(
        `TBI, nesting functions is not supported yet! Whoever called preProcess should check this first!`,
      );
    }
    // The most powerful configuration should be the one hardcoded in the formDef
    const accumulatedDef = this.objectUtils.deepMerge(preProcessResult.accumulatedDef, item);

    switch (type) {
      case GuiItemsShortcutType.INPUTS:
        return this.mapToInputWidget(
          this.applyInputSensibleDefaults(
            accumulatedDef as InputDecorator,
            preProcessResult.aggregatedSensibleDefaults,
          ),
        );
      case GuiItemsShortcutType.ACTIONS:
        return this.mapToActionWidget(
          item as ActionDecorator,
        );
    }
  }

  private mapToInputWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(fieldDef: InputDecorator): InputWidget<any, StateKeys, FormData> {
    switch (fieldDef.type) {
      case 'text':
        return this.mapTextInputDef(fieldDef);
      case 'number':
        return this.mapNumberInputDef(fieldDef);
      case 'boolean':
        return this.mapBooleanInputDef(fieldDef);
      default:
        throw new Error(`Unsupported field type "${(fieldDef as InputDecorator).type}"`);
    }
  }

  private mapBooleanInputDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(fieldDef: BooleanDataInputDecorator): InputWidget<any, StateKeys, FormData> {
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
  >(fieldDef: TextDataInputDecorator): InputWidget<any, StateKeys, FormData> {
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
  >(fieldDef: NumberDataInputDecorator): InputWidget<any, StateKeys, FormData> {
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
  >(controllerDef: ActionDecorator): ActionWidget<StateKeys, FormData> {
    return {
      uid: '',
      kind: 'action', // data
      type: 'button',
      disabled: controllerDef.disabled,
      label: controllerDef.label,
      on: controllerDef.on,
    };
  }
  private applyInputSensibleDefaults(
    item: InputDecorator,
    currentConfig: FormSensibleDefaults,
  ): InputDecorator {
    const inputsSensibleDefaults = currentConfig?.inputs;
    if (inputsSensibleDefaults == null) {
      return item;
    }

    const decorators: ((
      item: InputDecorator,
      currentConfig: InputSensibleDefaults,
    ) => InputDecorator)[] = [];
    decorators.push(
      this.formInputHintsDecoratorsService.processAutomaticLabels.bind(
        this.formInputHintsDecoratorsService,
      ),
    );
    decorators.push(
      this.formInputHintsDecoratorsService.processAutomaticPlaceholders.bind(
        this.formInputHintsDecoratorsService,
      ),
    );
    return decorators.reduce((accumulatedDef, decorator) => {
      const result = decorator(accumulatedDef, inputsSensibleDefaults);
      console.log(`Applying decorator ${decorator.name}`, result);
      return result;
    }, item);
  }

  private applyDefaultConfig<FormData extends Record<string, any> = any>(
    type: GuiItemsShortcutType,
    accumulatedDef: InputDecorator | ActionDecorator,
    newConfig: FormConfig<FormData>,
  ): WidgetItemDecorator | ActionDefCallback | PartialInputDefCallback {
    let defaultValue: ActionWidgetDecoratorsLike | InputWidgetDecoratorsLike | undefined;
    if (type === GuiItemsShortcutType.INPUTS) {
      defaultValue = newConfig.decorators?.inputs;
    }
    if (type === GuiItemsShortcutType.ACTIONS) {
      defaultValue = newConfig.decorators?.actions;
    }
    if (defaultValue == null) {
      return accumulatedDef;
    }
    if (typeof defaultValue === 'object') {
      return this.objectUtils.deepMerge(accumulatedDef, defaultValue);
    }

    const asCallback: ActionDecoratorCallback | InputDecoratorCallback = defaultValue;
    const result = asCallback(accumulatedDef as any);

    if (typeof result === 'function') {
      return result;
    }

    return this.objectUtils.deepMerge(accumulatedDef, result);
  }
}

const formConfigDecorator = new FormConfigDecorator(objectUtils, formInputHintsDecoratorsService);
export default formConfigDecorator;
