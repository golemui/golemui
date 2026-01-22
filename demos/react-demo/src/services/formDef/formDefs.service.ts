import { Form, UiState } from '@golemui/core';
import formDefTupleFactory, { FormDefTupleFactory } from './facade/formDefFacadeFactory.service';
import formMapperService, { FormDefMapper } from './mapper/formDefMapper.service';
import {
  DataInputDefsByKey,
  FormDefFacade,
  FormDefTuple,
  HorizontalLayoutShortcut,
  InputTags,
  OneOfDataInputDefs,
  OneOfDataInputDefsCallback,
  ProcessedDataInputDefsByKey,
  ProcessedDataInputsTuple,
  ProcessedValidInputDef,
  ValidShortcutType,
} from './formDef.domain';
import { FormConfig } from './fomConfig.domain';
import sensibleDefaultsService, { SensibleDefaults } from './default/sensibleDefaults.service';

function isHorizontalLayoutShortcut<T extends Record<string, any>>(
  element: unknown,
): element is HorizontalLayoutShortcut<T> {
  return typeof element === 'object' && element !== null && '_horizontalLayout' in element;
}

/**
 * Transforms a developer-friendly form definition into a fully-fledged form definition
 * usable by the framework ({@link Form}<STATE_KEYS, FORM_DATA>).
 *
 * The key interface is {@link FormDefFacade}, which provides a developer-friendly version
 * of the {@link Form} interface.
 *
 * The transformation involves two steps:
 * 1. **Tuplification**: Enriches the facade with sensible defaults and converts it into a
 *    list of tuples that can be consumed by the mapper.
 * 2. **Mapping**: Converts the hydrated tuples into a fully typed Form instance that
 *    the framework can use.
 *
 * The result is a fully defined and typed Form<STATE_KEYS, FORM_DATA>.
 */
export class FormDefs {
  constructor(
    private readonly formDefTupleFactory: FormDefTupleFactory,
    private readonly formMapperService: FormDefMapper,
    private readonly sensibleDefaults: SensibleDefaults,
  ) {}

  processFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FORM_DATA>,
    formConfig?: FormConfig<FORM_DATA>,
  ): Form<STATE_KEYS, FORM_DATA> {
    const tuples = this.convertIntoTuples(formDefRaw);
    return this.formMapperService.map<STATE_KEYS, FORM_DATA>(tuples, formConfig);
  }

  convertIntoTuples<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FORM_DATA>,
  ): FormDefTuple<FORM_DATA>[] {
    const tuples = this.createTuples(formDefRaw);

    return [...tuples, ['controllers', [this.sensibleDefaults.createDefaultSubmitButton()]]];
  }

  private createTuples<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FORM_DATA>,
  ): FormDefTuple<FORM_DATA>[] {
    if (Array.isArray(formDefRaw)) {
      return formDefRaw.map((element) => {
        if (isHorizontalLayoutShortcut<FORM_DATA>(element)) {
          return [`layout`, this.createTuples(element._horizontalLayout)];
        } else {
          const asDataInputDefsByKey = element as DataInputDefsByKey<FORM_DATA>;
          return this.createDataInputsTuple(asDataInputDefsByKey);
        }
      });
    } else {
      return [this.createDataInputsTuple(formDefRaw as DataInputDefsByKey<FORM_DATA>)];
    }
  }

  private createDataInputsTuple<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: DataInputDefsByKey<FORM_DATA>,
  ): ProcessedDataInputsTuple<FORM_DATA> {
    const fieldDefsByKey = this.explodeKeyShortcuts(formDefRaw as DataInputDefsByKey<FORM_DATA>);
    return ['data_inputs', fieldDefsByKey];
  }

  private explodeKeyShortcuts<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: DataInputDefsByKey<FORM_DATA>,
  ): ProcessedDataInputDefsByKey<FORM_DATA> {
    const fieldDefsByKey: Partial<Record<keyof FORM_DATA, ProcessedValidInputDef>> = {};
    const asDataInputDefsByKey = formDefRaw as DataInputDefsByKey<FORM_DATA>;
    Object.entries(asDataInputDefsByKey).forEach(([key, dataInputDef]) => {
      if (!dataInputDef) {
        throw new Error(`Unexpected undefined value for field key: ${key}`);
      }

      if (typeof dataInputDef === 'function') {
        fieldDefsByKey[key as keyof FORM_DATA] = dataInputDef as OneOfDataInputDefsCallback;
      } else if (typeof dataInputDef === 'string') {
        fieldDefsByKey[key as keyof FORM_DATA] =
          this.sensibleDefaults.explodeShortcut(dataInputDef);
      } else if (Array.isArray(dataInputDef)) {
        fieldDefsByKey[key as keyof FORM_DATA] = this.processTags(dataInputDef);
      } else {
        fieldDefsByKey[key as keyof FORM_DATA] = dataInputDef as OneOfDataInputDefs;
      }
    });
    return fieldDefsByKey;
  }

  private processTags(dataInputDef: InputTags): OneOfDataInputDefs {
    const shortcut: ValidShortcutType = dataInputDef[0];
    const shortcutInputDef = this.sensibleDefaults.explodeShortcut(shortcut);

    return {
      ...shortcutInputDef,
      tags: dataInputDef.slice(1),
    };
  }
}

const formDefs = new FormDefs(formDefTupleFactory, formMapperService, sensibleDefaultsService);
export default formDefs;
