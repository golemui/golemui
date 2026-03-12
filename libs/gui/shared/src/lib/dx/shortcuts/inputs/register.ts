import {
  InputWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import {
  processAutoLabel,
  processAutoPlaceholder,
} from '../../core/sharedSensibleDefaults.service';
import {
  InputDecorator,
  InputEntry,
  GslInputsConfig,
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
  const props = extractWidgetProps(fieldDef);
  return {
    uid: fieldDef.uid ?? '',
    kind: 'input',
    type: 'toggle',
    path: fieldDef.path ?? '',
    ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
    ...(fieldDef.disabled != null ? { disabled: fieldDef.disabled } : {}),
    ...(fieldDef.readonly != null ? { readonly: fieldDef.readonly } : {}),
    props,
  };
}

function mapTextInputDef<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(fieldDef: TextDataInputDecorator): InputWidget<any, StateKeys, FormData> {
  const textProps = extractWidgetProps(fieldDef);
  return {
    uid: fieldDef.uid ?? '',
    kind: 'input',
    type: 'textinput',
    path: fieldDef.path ?? '',
    ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
    ...(fieldDef.disabled != null ? { disabled: fieldDef.disabled } : {}),
    ...(fieldDef.readonly != null ? { readonly: fieldDef.readonly } : {}),
    props: {
      placeholder: textProps.placeholder ?? '',
      ...textProps,
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
  const numberProps = extractWidgetProps(fieldDef);
  return {
    uid: fieldDef.uid ?? '',
    kind: 'input',
    type: 'number',
    path: fieldDef.path ?? '',
    ...(fieldDef.label != null ? { label: fieldDef.label } : {}),
    ...(fieldDef.disabled != null ? { disabled: fieldDef.disabled } : {}),
    ...(fieldDef.readonly != null ? { readonly: fieldDef.readonly } : {}),
    props: {
      placeholder: numberProps.placeholder ?? '',
      ...numberProps,
    },
    validator: {
      type: 'number',
      ...fieldDef.validator,
    },
  };
}

export const { gsl: _gslInputs, gslById: _gslInputById } =
  defineShortcutType<InputEntry, InputDecorator, GslInputsConfig>({
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
