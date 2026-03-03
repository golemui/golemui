import {
  InputWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector } from '../../core/dx.domain';
import { registerItemType, ItemTypeHandler } from '../../core/itemTypeRegistry';
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
  def: Record<string, any>,
  config: Record<string, any>,
): Record<string, any> {
  const inputDef = def as InputDecorator;
  const inputConfig = config as InputSensibleDefaultsConfig;
  let result = inputSensibleDefaultsService.processAutomaticLabels(inputDef, inputConfig);
  result = inputSensibleDefaultsService.processAutomaticPlaceholders(result, inputConfig);
  return result;
}

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: Record<string, any>): NonFunctionWidget<StateKeys, FormData> {
  const fieldDef = def as InputDecorator;
  switch (fieldDef.type) {
    case 'text':
      return mapTextInputDef<StateKeys, FormData>(fieldDef as TextDataInputDecorator);
    case 'number':
      return mapNumberInputDef<StateKeys, FormData>(fieldDef as NumberDataInputDecorator);
    case 'boolean':
      return mapBooleanInputDef<StateKeys, FormData>(fieldDef as BooleanDataInputDecorator);
    default:
      throw new Error(`Unsupported field type "${(fieldDef as any).type}"`);
  }
}

function mapBooleanInputDef<
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

function mapTextInputDef<
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

function mapNumberInputDef<
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

function parseEntry(entry: any): { baseDef: any; path?: string } {
  const inputEntry = entry as InputEntry;
  return {
    baseDef: inputEntry.def,
    path: inputEntry.key,
  };
}

const handler: ItemTypeHandler = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
};

registerItemType('INPUTS', handler);
