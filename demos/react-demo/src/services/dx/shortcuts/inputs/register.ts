import {
  InputWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { defineShortcutType } from '../../core/defineShortcutType';
import {
  processAutoLabel,
  processAutoPlaceholder,
} from '../../core/sharedSensibleDefaults.service';
import {
  InputDecorator,
  InputEntry,
  InputSensibleDefaultsConfig,
  BooleanDataInputDecorator,
  NumberDataInputDecorator,
  TextDataInputDecorator,
} from './inputs.domain';

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: InputDecorator): NonFunctionWidget<StateKeys, FormData> {
  switch (def.type) {
    case 'text':
      return mapTextInputDef<StateKeys, FormData>(def as TextDataInputDecorator);
    case 'number':
      return mapNumberInputDef<StateKeys, FormData>(def as NumberDataInputDecorator);
    case 'boolean':
      return mapBooleanInputDef<StateKeys, FormData>(def as BooleanDataInputDecorator);
    default:
      throw new Error(`Unsupported field type "${(def as any).type}"`);
  }
}

function mapBooleanInputDef<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(fieldDef: BooleanDataInputDecorator): InputWidget<any, StateKeys, FormData> {
  return {
    uid: fieldDef.uid ?? '',
    kind: 'input',
    type: 'toggle',
    path: fieldDef.path ?? '',
    ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
    ...(fieldDef.disabled != null ? { disabled: fieldDef.disabled } : {}),
    ...(fieldDef.readonly != null ? { readonly: fieldDef.readonly } : {}),
    props: {
      ...fieldDef.props,
    },
  };
}

function mapTextInputDef<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(fieldDef: TextDataInputDecorator): InputWidget<any, StateKeys, FormData> {
  return {
    uid: fieldDef.uid ?? '',
    kind: 'input',
    type: 'textinput',
    path: fieldDef.path ?? '',
    ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
    ...(fieldDef.disabled != null ? { disabled: fieldDef.disabled } : {}),
    ...(fieldDef.readonly != null ? { readonly: fieldDef.readonly } : {}),
    props: {
      placeholder: fieldDef.placeholder ?? '',
      ...fieldDef.props,
    },
    validator: {
      type: 'string',
      ...fieldDef.validator,
    },
  };
}

function mapNumberInputDef<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(fieldDef: NumberDataInputDecorator): InputWidget<any, StateKeys, FormData> {
  return {
    uid: fieldDef.uid ?? '',
    kind: 'input',
    type: 'number',
    path: fieldDef.path ?? '',
    ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
    ...(fieldDef.disabled != null ? { disabled: fieldDef.disabled } : {}),
    ...(fieldDef.readonly != null ? { readonly: fieldDef.readonly } : {}),
    props: {
      placeholder: fieldDef.placeholder ?? '',
      ...fieldDef.props,
    },
    validator: {
      type: 'number',
      ...fieldDef.validator,
    },
  };
}

defineShortcutType<InputEntry, InputDecorator, InputSensibleDefaultsConfig>({
  itemType: 'INPUTS',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: {
      suppressAutomaticLabels: false,
      suppressAutomaticPlaceholders: false,
    },
    fields: ['suppressAutomaticLabels', 'suppressAutomaticPlaceholders'],
    apply: (def, config) => {
      let result = processAutoLabel(def, config);
      result = processAutoPlaceholder(result, config);
      return result;
    },
  },
  mapToWidget,
});
