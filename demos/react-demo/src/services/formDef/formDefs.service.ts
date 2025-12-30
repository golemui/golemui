import { Form, UiState } from '@golemui/core';
import formDefFacadeFactory, { FormDefFacadeFactory } from './facade/formDefFacadeFactory.service';
import formMapperService, { FormDefMapper } from './mapper/formDefMapper.service';
import { FormDefFacade } from './formDef.domain';
import formDefParser, { FormDefParser } from './parser/formDefParser.service';

/**
 * Transforms a developer-friendly form definition into a fully-fledged form definition
 * usable by the framework ({@link Form}<STATE_KEYS, FORM_DATA>).
 *
 * The key interface is {@link FormDefFacade}, which provides a developer-friendly version
 * of the {@link Form} interface.
 *
 * The transformation involves two steps:
 * 1. **Hydration**: Enriches the facade with sensible defaults. This step may be skipped
 *    if a complete facade is provided.
 * 2. **Mapping**: Converts the hydrated facade into a fully typed Form instance that
 *    the framework can use.
 *
 * Users can provide a full, partial, or no facade.
 * The result is a fully defined and typed Form<STATE_KEYS, FORM_DATA>.
 */
export class FormDefs {
  constructor(
    private readonly formDefFacadeFactory: FormDefFacadeFactory,
    private readonly formMapperService: FormDefMapper,
    private readonly formDefParser: FormDefParser,
  ) {}

  processFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FORM_DATA> | null,
  ): Form<STATE_KEYS, FORM_DATA> {
    const formDefFacade = this.hydrate(formDefRaw);
    return this.formMapperService.map<STATE_KEYS, FORM_DATA>(formDefFacade);
  }

  hydrate<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FORM_DATA> | null,
  ) {
    const fieldDefsByKey = this.formDefParser.extractDataInputDefs(formDefRaw);
    const uncompressed = this.formDefFacadeFactory.create<FORM_DATA>(fieldDefsByKey);
    return this.compress(uncompressed);
  }

  private compress<FORM_DATA extends Record<string, any> = any>(
    uncompressed: FormDefFacade<FORM_DATA>,
  ): FormDefFacade<FORM_DATA> {
    if (!Array.isArray(uncompressed)) {
      return uncompressed;
    }

    const compressed: FormDefFacade<FORM_DATA> = [];
    let currentDataInputs: any = {};

    for (const tuple of uncompressed) {
      if (Array.isArray(tuple) && tuple[0] === 'data_inputs') {
        // Merge data_inputs into the current accumulator
        currentDataInputs = { ...currentDataInputs, ...tuple[1] };
      } else {
        // If we have accumulated data_inputs, push them first
        if (Object.keys(currentDataInputs).length > 0) {
          compressed.push(['data_inputs', currentDataInputs]);
          currentDataInputs = {};
        }
        // Push the non-data_inputs tuple
        compressed.push(tuple);
      }
    }

    // Don't forget any remaining data_inputs
    if (Object.keys(currentDataInputs).length > 0) {
      compressed.push(['data_inputs', currentDataInputs]);
    }

    return compressed;
  }
}

const formDefs = new FormDefs(formDefFacadeFactory, formMapperService, formDefParser);
export default formDefs;
