import {
  ActionWidget,
  FormWidget,
  FunctionWidgetParams,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import {
  ActionDecorator,
  BooleanDataInputDecorator,
  InputDecorator,
  NumberDataInputDecorator,
  TextDataInputDecorator,
} from '../formDef.domain';
import {
  GslItemType,
  LayoutDecorator,
  MergeResult,
} from '../shortcuts/gsl/gsl.domain';

export class WidgetMapper {

  mapToWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    mergeResult: MergeResult,
    itemType: GslItemType,
  ): FormWidget<StateKeys, FormData> {

    if (mergeResult.kind === 'dynamic') {
      const fn = mergeResult.fn;
      return ((params: FunctionWidgetParams<FormData>) => {
        const runtimeDef = fn(params);
        return this.mapStaticDef<StateKeys, FormData>(runtimeDef, itemType);
      }) as FormWidget<StateKeys, FormData>;
    }

    return this.mapStaticDef<StateKeys, FormData>(mergeResult.def, itemType);
  }

  mapStaticDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    def: InputDecorator | ActionDecorator | LayoutDecorator,
    itemType: GslItemType,
  ): NonFunctionWidget<StateKeys, FormData> {
    switch (itemType) {
      case 'INPUTS':
        return this.mapToInputWidget<StateKeys, FormData>(def as InputDecorator);
      case 'ACTIONS':
        return this.mapToActionWidget<StateKeys, FormData>(def as ActionDecorator);
      case 'LAYOUT':
        return this.mapToLayoutWidget<StateKeys, FormData>(def as LayoutDecorator);
    }
  }

  private mapToInputWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(fieldDef: InputDecorator): InputWidget<any, StateKeys, FormData> {
    switch (fieldDef.type) {
      case 'text':
        return this.mapTextInputDef<StateKeys, FormData>(fieldDef);
      case 'number':
        return this.mapNumberInputDef<StateKeys, FormData>(fieldDef);
      case 'boolean':
        return this.mapBooleanInputDef<StateKeys, FormData>(fieldDef);
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
      path: fieldDef.path ?? '',
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
      path: fieldDef.path ?? '',
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
      path: fieldDef.path ?? '',
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
      kind: 'action',
      type: 'button',
      disabled: controllerDef.disabled,
      label: controllerDef.label,
      on: controllerDef.on,
    };
  }

  private mapToLayoutWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(layoutDef: LayoutDecorator): LayoutWidget<StateKeys, FormData> {
    return {
      uid: layoutDef.uid ?? '',
      kind: 'layout',
      type: layoutDef.widgetName ?? 'stack',
      props: {
        direction: layoutDef.direction ?? 'vertical',
      },
      children: [],
    };
  }
}

const widgetMapper = new WidgetMapper();
export default widgetMapper;
