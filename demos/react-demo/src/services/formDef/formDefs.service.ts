import { Form, UiState } from '@golemui/core';
import formMapperService, { FormDefMapper } from './mapper/formDefMapper.service';
import { FormDefFacade, FormEvents, ValidDxElement } from './formDef.domain';
import { FormConfig } from './fomConfig.domain';
import dxElementService, { DxElementService,   } from './dx/dxElement.service';
import { UnrolledLayout, ValidUnrolledElement } from './dx/dx.domain';
import { FieldsShortcut } from './dx/gui/guiFields.impl';

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
    // Detect if formDefRaw is a FieldsShortcut (tuple with 2 elements) and wrap it in an array
    const normalizedFormDef: ValidDxElement<FORM_DATA>[] = this.isFieldsShortcut(formDefRaw)
      ? [formDefRaw]
      : formDefRaw;

    const unrolled = this.unrollDxElements(normalizedFormDef);
    let withAutoSubmit: ValidUnrolledElement[] = unrolled;
    if (unrolled.filter((it) => it.type === 'controllers').length === 0) {
      withAutoSubmit = [...unrolled, this.unrollDxElement('_submitButton')];
    }

    const fwFormDef = this.formMapperService.map<STATE_KEYS, FORM_DATA>(withAutoSubmit, formConfig);
    if (formConfig?.onSubmit != null) {
      return [fwFormDef, formConfig.onSubmit as any] as [Form<STATE_KEYS, FORM_DATA>, FormEvents];
    }

    return fwFormDef;
  }

  /**
   * Type guard to check if the input is a FieldsShortcut tuple.
   * FieldsShortcut has the structure: [[string, ...string[]], ReadyToMapField[]]
   * This validates:
   * 1. Root is an array with exactly 2 elements
   * 2. First element is an array with at least 1 string element
   * 3. First element of the first array is '_inputDefsByKey'
   * 4. Second element is an array of objects
   */
  private isFieldsShortcut<FORM_DATA extends Record<string, any>>(
    formDefRaw: FormDefFacade<FORM_DATA>,
  ): formDefRaw is FieldsShortcut {
    if (!Array.isArray(formDefRaw)) {
      return false;
    }

    // Must be exactly 2 elements at root level
    if (formDefRaw.length !== 2) {
      return false;
    }

    const [first, second] = formDefRaw;

    // First element must be an array
    if (!Array.isArray(first)) {
      return false;
    }

    // First element must have at least one string element
    if (first.length < 1 || typeof first[0] !== 'string') {
      return false;
    }

    // First element's first item must be '_inputDefsByKey'
    if (first[0] !== '_inputDefsByKey') {
      return false;
    }

    // Second element must be an array
    if (!Array.isArray(second)) {
      return false;
    }

    // Second element should contain ReadyToMapField objects (or be empty)
    if (second.length > 0) {
      const firstItem = second[0];
      // Basic structural check: should be an object with 'key' and 'processedField' properties
      if (
        firstItem == null ||
        typeof firstItem !== 'object' ||
        !('key' in firstItem) ||
        !('processedField' in firstItem)
      ) {
        return false;
      }
    }

    return true;
  }

  private unrollDxElements<FORM_DATA extends Record<string, any> = any>(
    formDefRaw: ValidDxElement<FORM_DATA>[],
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
      const asFacade = result.payload as ValidDxElement<FORM_DATA>[];
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
