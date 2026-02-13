import { Form, UiState } from '@golemui/core';
import formMapperService, { FormMapper } from './mapper/formDefMapper.service';
import { DxDefinitions, FormEvents } from './formDef.domain';
import { DxSelectors } from './dxSelectors.domain';
import { ValidGuiShortcut } from './shortcuts/gui/gui.domain';
import { _guiSubmitButton } from './shortcuts/gui/shortcuts/guiSubmitButton.impl';

/**
 * Transforms a developer-friendly form definition into a fully-fledged form definition
 * usable by the framework ({@link Form}<STATE_KEYS, FORM_DATA>).
 *
 * The key interface is {@link DxDefinitions}, which provides a developer-friendly version
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
export class DxService {
  constructor(
    private readonly formMapperService: FormMapper,
  ) {}

  processDxFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    dxDefinitionsRaw: DxDefinitions,
    dxSelectors?: DxSelectors<FORM_DATA>,
  ): Form<STATE_KEYS, FORM_DATA> | [Form<STATE_KEYS, FORM_DATA>, FormEvents] {
    const dxDefinitions: ValidGuiShortcut[] = Array.isArray(dxDefinitionsRaw) ? dxDefinitionsRaw : [dxDefinitionsRaw];
    const hasAButton =
      dxDefinitions.filter((it) => it.type === 'ITEMS' && it.itemsType === 'ACTIONS').length > 0;
    const dxDefsWithButtonIfNeeded = hasAButton ? dxDefinitions : [...dxDefinitions, _guiSubmitButton()];

    return this.formMapperService.map<STATE_KEYS, FORM_DATA>(dxDefsWithButtonIfNeeded, dxSelectors);
  }

}

const formDefs = new DxService(formMapperService);
export default formDefs;
