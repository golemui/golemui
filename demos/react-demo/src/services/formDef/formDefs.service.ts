import { Form, UiState } from '@golemui/core';
import formDefTupleFactory, { FormDefTupleFactory } from './facade/formDefFacadeFactory.service';
import formMapperService, { FormDefMapper } from './mapper/formDefMapper.service';
import {
  DataInputDef,
  DataInputDefsByKey,
  DataInputsTuple,
  FormDefFacade,
  FormDefTuple,
  HorizontalLayoutShortcut,
  OneOfDataInputDefs,
  OneOfDataInputDefsParams,
  ValidInputDef,
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
  ): DataInputsTuple<FORM_DATA> {
    const fieldDefsByKey = this.explodeKeyShortcuts(formDefRaw as DataInputDefsByKey<FORM_DATA>);

    return ['data_inputs', fieldDefsByKey];
  }

  private explodeKeyShortcuts<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: DataInputDefsByKey<FORM_DATA>,
  ): DataInputDefsByKey<FORM_DATA> {
    const fieldDefsByKey: DataInputDefsByKey<FORM_DATA> = {};
    const asDataInputDefsByKey = formDefRaw as DataInputDefsByKey<FORM_DATA>;
    const mutableFieldDefsByKey = fieldDefsByKey as Record<string, ValidInputDef>;
    Object.keys(asDataInputDefsByKey).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const dataInputDef: ValidInputDef = asDataInputDefsByKey[key]!;
      const typeOfDataInputDef = typeof dataInputDef;
      if (typeOfDataInputDef === 'function') {
        mutableFieldDefsByKey[key] = dataInputDef as (
          params: OneOfDataInputDefsParams,
        ) => OneOfDataInputDefs;
      } else if (typeOfDataInputDef === 'string') {
        mutableFieldDefsByKey[key] = this.sensibleDefaults.explodeShortcut(
          dataInputDef as ValidShortcutType,
        );
      } else if (typeOfDataInputDef === 'object') {
        mutableFieldDefsByKey[key] = dataInputDef as DataInputDef;
      }
    });
    return fieldDefsByKey;
  }
}

const formDefs = new FormDefs(formDefTupleFactory, formMapperService, sensibleDefaultsService);
export default formDefs;
