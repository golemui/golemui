import { Form, UiState } from '@golemui/core';
import formMapperService, { FormDefMapper } from './mapper/formDefMapper.service';
import { FormDefFacade, FormEvents, ValidDxElement } from './formDef.domain';
import { FormConfig } from './fomConfig.domain';
import dxElementService, { DxElementService } from './dx/dxElement.service';
import { UnrolledLayout, ValidUnrolledElement, } from './dx/dx.domain';
import { ValidGuiShortcut } from './dx/gui/gui.domain';
import { _guiSubmitButton } from './dx/gui/shortcuts/guiSubmitButton.impl';

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
  ) {}

  processFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    formDefRaw: FormDefFacade,
    formConfig?: FormConfig<FORM_DATA>,
  ): Form<STATE_KEYS, FORM_DATA> | [Form<STATE_KEYS, FORM_DATA>, FormEvents] {
    const formDef: ValidGuiShortcut[] = Array.isArray(formDefRaw) ? formDefRaw : [formDefRaw];
    const hasAButton = formDef.filter((it) => it.type === 'ITEMS' && it.itemsType === 'ACTIONS').length > 0;
    const withButtonIfNeeded = hasAButton
      ? formDef
      : [...formDef, _guiSubmitButton()];

    const fwFormDef = this.formMapperService.map<STATE_KEYS, FORM_DATA>(
      withButtonIfNeeded,
      formConfig,
    );
    if (formConfig?.onSubmit != null) {
      return [fwFormDef, formConfig.onSubmit as any] as [Form<STATE_KEYS, FORM_DATA>, FormEvents];
    }

    return fwFormDef;
  }

}

const formDefs = new FormDefs(formMapperService);
export default formDefs;
