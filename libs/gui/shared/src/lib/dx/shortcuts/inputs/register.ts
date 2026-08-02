// Complexity: COMPLEX — batch factory with 3 sub-types (text, number, boolean).
// This is NOT representative of a typical shortcut. If you're learning the system,
// start with alert/ (minimal) or date-picker/ (standard keyed type).
import { type InputWidget, type NonFunctionWidget, type UiState } from '@golemui/core';
import { createShortcutType } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import {
  type InputDecorator,
  type InputEntry,
  type GslInputsConfig,
  type BooleanDataInputDecorator,
  type NumberDataInputDecorator,
  type TextDataInputDecorator,
} from './inputs.domain';

function mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
  def: InputDecorator,
): NonFunctionWidget<StateKeys, FormData> {
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
    ...(fieldDef.validator != null
      ? { validator: buildTypedValidator(fieldDef.validator as any, 'boolean') }
      : {}),
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
    validator: buildTypedValidator(fieldDef.validator as any, 'string') as any,
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
    validator: buildTypedValidator(fieldDef.validator as any, 'number') as any,
  };
}

export const inputsShortcutType = createShortcutType<InputEntry, InputDecorator, GslInputsConfig>({
  itemType: 'INPUTS',
  kind: 'input',
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

export const _gslInputs = inputsShortcutType.gsl;
export const _gslInputByUid = inputsShortcutType.gslByUid;
