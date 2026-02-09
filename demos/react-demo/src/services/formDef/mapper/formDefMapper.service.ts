import {
  ActionWidget,
  DisplayWidget,
  Form,
  FunctionWidget,
  FunctionWidgetParams,
  InputWidget,
  LayoutWidget,
  UiState,
} from '@golemui/core';
import { ActionDef, ActionDefCallback, ActionDefOrCallback, InputDef } from '../formDef.domain';
import { FormConfig, PartialInputDefCallback } from '../fomConfig.domain';
import formConfigDecorator, { FormConfigDecorator } from './formConfigDecorator.service';
import {
  GuiItemsShortcutType,
  ReadyToMapInputDef,
  ReadyToMapItemDef,
  ValidGuiShortcut,
} from '../dx/gui/gui.domain';
import { InputDefOrCallback } from '../dx/gui/shortcuts/guiFields.impl';

export type FormWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> =
  | DisplayWidget<StateKeys, FormData>
  | FunctionWidget<StateKeys, FormData>
  | InputWidget<any, StateKeys, FormData>
  | LayoutWidget<StateKeys, FormData>
  | ActionWidget<StateKeys, FormData>;
export class FormDefMapper {
  constructor(private readonly formConfigDecorator: FormConfigDecorator) {}

  map<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    guiShortcuts: ValidGuiShortcut[],
    formConfig?: FormConfig<FormData>,
  ): Form<StateKeys, FormData> {
    const formFields = this.flatMapWidgets(guiShortcuts, formConfig);
    return {
      form: this.createLayout(formFields),
    };
  }

  private flatMapWidgets<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    guiShortcuts: ValidGuiShortcut[],
    formConfig: FormConfig<FormData> | undefined,
  ): FormWidget<StateKeys, FormData>[] {
    return guiShortcuts.flatMap((item) => this.mapWidget(item, formConfig));
  }

  private mapWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    guiShortcut: ValidGuiShortcut,
    formConfig?: FormConfig<FormData>,
  ): FormWidget<StateKeys, FormData>[] {
    if (guiShortcut.type === 'LAYOUT') {
      const children: FormWidget<StateKeys, FormData>[] = this.flatMapWidgets(
        guiShortcut.children,
        formConfig,
      );
      return [this.createLayout(children, guiShortcut.layoutNestedProps.direction)];
    }
    if (guiShortcut.type === 'ITEMS') {
      return guiShortcut.items.map((readyToMapFieldOrAction) => {
        return this.mapItem(guiShortcut.itemsType, readyToMapFieldOrAction, formConfig);
      });
    }
    throw new Error(`Unexpected gui shortcut type`);
  }

  private createLayout<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    children: FormWidget<StateKeys, FormData>[],
    direction: 'vertical' | 'horizontal' = 'vertical',
  ): LayoutWidget<StateKeys, FormData> {
    return {
      uid: '',
      children,
      kind: 'layout',
      type: 'stack',
      props: {
        direction: direction,
      },
    };
  }

  private mapItem<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    itemType: GuiItemsShortcutType,
    readyToMapFieldOrAction: ReadyToMapItemDef,
    formConfig?: FormConfig<FormData>,
  ): FormWidget<StateKeys, FormData> {
    let baseProvider: InputDefOrCallback | ActionDefOrCallback;
    if (itemType === GuiItemsShortcutType.INPUTS) {
      const asReadyToMapInput = readyToMapFieldOrAction as ReadyToMapInputDef;
      baseProvider = asReadyToMapInput.inputDefOrCallback;
    } else {
      baseProvider = readyToMapFieldOrAction as ActionDefOrCallback;
    }
    if (typeof baseProvider === 'function') {
      return ((params: FunctionWidgetParams<FormData>) => {
        return this.mapCallbackItem(
          readyToMapFieldOrAction,
          params,
          baseProvider,
          itemType,
          formConfig,
        );
      }) as FunctionWidget<StateKeys, FormData>;
    }
    const baseValue = this.parseValue(readyToMapFieldOrAction);
    const result = this.formConfigDecorator.preProcess(baseValue, itemType, formConfig);
    if (result.containsCallbacks) {
      throw new Error(`TBI, nesting functions is not supported yet!`);
    }
    return this.formConfigDecorator.postProcess(result, baseValue, itemType);
  }

  private mapCallbackItem<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    readyToMapFieldOrAction: ReadyToMapItemDef,
    params: FunctionWidgetParams<FormData>,
    baseProvider: PartialInputDefCallback | ActionDefCallback,
    itemType: GuiItemsShortcutType,
    formConfig: FormConfig<FormData> | undefined,
  ): FormWidget<StateKeys, FormData> {
    console.log(`item dynamic definition`, params);
    const hasErrors = params != null && params?.errors != null && params.errors.length > 0;
    const hotMapping = baseProvider({ error: hasErrors });
    const item = itemType === GuiItemsShortcutType.ACTIONS
      ? hotMapping
      : this.parseFieldKey(
        hotMapping as InputDef,
        (readyToMapFieldOrAction as ReadyToMapInputDef).key,
      );
    const mapControlField = this.formConfigDecorator.processFormConfiguration(
      item as ActionDef | InputDef,
      itemType,
      formConfig,
    );
    console.log(`item final config`, mapControlField);
    return mapControlField;
  }

  private parseValue(readyToMapFieldOrAction: ReadyToMapItemDef): ActionDef | InputDef {
    if ('key' in readyToMapFieldOrAction && 'inputDefOrCallback' in readyToMapFieldOrAction) {
      const inputDefOrCallback = readyToMapFieldOrAction.inputDefOrCallback;
      if (typeof inputDefOrCallback === 'function') {
        throw new Error('Callback functions should be handled before parseValue is called');
      }
      return this.parseFieldKey(inputDefOrCallback, readyToMapFieldOrAction.key);
    }
    // It's a ReadyToMapActionDef (ActionDef | ActionDefCallback)
    if (typeof readyToMapFieldOrAction === 'function') {
      throw new Error('Callback functions should be handled before parseValue is called');
    }
    return readyToMapFieldOrAction;
  }
  private parseFieldKey(inputDefOrCallback: InputDef, key: string): InputDef {
    return {
      ...inputDefOrCallback,
      path: key,
    };
  }
}

const formMapperService = new FormDefMapper(formConfigDecorator);
export default formMapperService;
