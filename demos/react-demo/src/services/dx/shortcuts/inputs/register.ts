import {
  InputWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector } from '../../core/dx.domain';
import { registerItemType, ItemTypeHandler, ParsedEntry } from '../../core/itemTypeRegistry';
import {
  InputDecorator,
  InputEntry,
  InputSensibleDefaultsConfig,
  GslInputsConfig,
  BooleanDataInputDecorator,
  NumberDataInputDecorator,
  TextDataInputDecorator,
} from './inputs.domain';
import inputSensibleDefaultsService from './inputSensibleDefaults.service';

const BASE_INPUT_SENSIBLE_DEFAULTS: InputSensibleDefaultsConfig = {
  suppressAutomaticLabels: false,
  suppressAutomaticPlaceholders: false,
};

function rollUpSensibleDefaults(leafSelectors: GslLeafSelector[]): InputSensibleDefaultsConfig {
  let result: InputSensibleDefaultsConfig = { ...BASE_INPUT_SENSIBLE_DEFAULTS };

  for (const leaf of leafSelectors) {
    const cfg = leaf.config as GslInputsConfig;
    if (cfg.suppressAutomaticLabels != null) {
      result = { ...result, suppressAutomaticLabels: cfg.suppressAutomaticLabels };
    }
    if (cfg.suppressAutomaticPlaceholders != null) {
      result = { ...result, suppressAutomaticPlaceholders: cfg.suppressAutomaticPlaceholders };
    }
  }

  return result;
}

function applySensibleDefaults(
  def: InputDecorator,
  config: InputSensibleDefaultsConfig,
): InputDecorator {
  let result = inputSensibleDefaultsService.processAutomaticLabels(def, config);
  result = inputSensibleDefaultsService.processAutomaticPlaceholders(result, config);
  return result;
}

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

function parseEntry(entry: InputEntry): ParsedEntry<InputDecorator> {
  return {
    baseDef: entry.def,
    path: entry.key,
  };
}

const handler: ItemTypeHandler<InputEntry, InputDecorator, InputSensibleDefaultsConfig> = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
};

registerItemType('INPUTS', handler);
