import { Form, UiState } from '@golemui/core';
import formMapperService, { FormDefMapper } from './mapper/formDefMapper.service';
import { FormDefFacade, FormEvents, ValidDxElement } from './formDef.domain';
import { FormConfig } from './fomConfig.domain';
import dxElementService, { DxElementService,   } from './dx/dxElement.service';
import { UnrolledLayout, ValidUnrolledElement } from './dx/dx.domain';

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
    private readonly formMapperService: FormDefMapper,
    private readonly dxElementService: DxElementService,
  ) {}

  processFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FORM_DATA>,
    formConfig?: FormConfig<FORM_DATA>,
  ): Form<STATE_KEYS, FORM_DATA> | [Form<STATE_KEYS, FORM_DATA>, FormEvents] {
    const unrolled = this.unrollDxElements(formDefRaw);

    const fwFormDef = this.formMapperService.map<STATE_KEYS, FORM_DATA>(unrolled, formConfig);
    if (formConfig?.onSubmit != null) {
      throw new Error('Not implemented yet');
    }

    return fwFormDef;
  }

  private unrollDxElements<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade<FORM_DATA>,
  ): ValidUnrolledElement[] {
    return formDefRaw.map((element) => {
      return this.unrollDxElement(element);
    });
  }

  private unrollDxElement<FORM_DATA extends Record<string, any> = any>(
    element: ValidDxElement<FORM_DATA>,
  ): ValidUnrolledElement {
    const result = this.dxElementService.assertIsValidDXElementAndUnroll(element);
    if (this.dxElementService.isLayout(result)) {
      const asFacade = result.payload[1] as FormDefFacade<FORM_DATA>;
      const children = this.unrollDxElements(asFacade);
      return {
        type: 'layout',
        children,
        layoutKey: result.descriptor.orientation,
        tags: [],
        source: result,
      } as UnrolledLayout;
    }
    return result;
  }
}

const formDefs = new FormDefs(
  formMapperService,
  dxElementService,
);
export default formDefs;
