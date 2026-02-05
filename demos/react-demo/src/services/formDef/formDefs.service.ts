import { Form, UiState } from '@golemui/core';
import formMapperService, { FormDefMapper } from './mapper/formDefMapper.service';
import { FormDefFacade, FormEvents, ValidDxElement } from './formDef.domain';
import { FormConfig } from './fomConfig.domain';
import dxElementService, { DxElementService } from './dx/dxElement.service';
import UnrolledController, {
  UnrolledControllers,
  UnrolledFields,
  UnrolledLayout,
  ValidUnrolledElement,
} from './dx/dx.domain';
import { GuiShortcutType, ValidGuiShortcut } from './dx/gui/gui.domain';
import { _guiSubmitButton } from './dx/gui/fields/guiSubmitButton.impl';

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
    formDefRaw: FormDefFacade,
    formConfig?: FormConfig<FORM_DATA>,
  ): Form<STATE_KEYS, FORM_DATA> | [Form<STATE_KEYS, FORM_DATA>, FormEvents] {
    const formDef: ValidGuiShortcut[] = Array.isArray(formDefRaw) ? formDefRaw : [formDefRaw];
    const unrolledItems: ValidUnrolledElement[] = formDef.map((it) => this.unrollGuiShortcut(it));
    const hasAButton = unrolledItems.filter(it=>it.type === 'controllers').length > 0;
    const withButtonIfNeeded = hasAButton ? unrolledItems : [...unrolledItems, this.unrollGuiShortcut(_guiSubmitButton())];

    const fwFormDef = this.formMapperService.map<STATE_KEYS, FORM_DATA>(withButtonIfNeeded, formConfig);
    if (formConfig?.onSubmit != null) {
      return [fwFormDef, formConfig.onSubmit as any] as [Form<STATE_KEYS, FORM_DATA>, FormEvents];
    }

    return fwFormDef;
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

  private unrollGuiShortcut(raw: ValidGuiShortcut): ValidUnrolledElement {
    switch (raw.type) {
      case GuiShortcutType.FIELDS:
        return {
          items: raw.fields.map((it) => ({
            key: it.key,
            type: 'field',
            value: it.processedField,
          })),
          type: 'fields',
        } as UnrolledFields;

      case GuiShortcutType.LAYOUT:
        return {
          type: 'layout',
          children: raw.children.map((it) => this.unrollGuiShortcut(it)),
          layoutKey: raw.layoutNestedProps.orientation,
        } as UnrolledLayout;

      case GuiShortcutType.CONTROLLERS:
        return {
          type: 'controllers',
          items: raw.controllers.map(
            (it) =>
              ({
                type: 'controller',
                value: it,
              }) as UnrolledController,
          ),
        } as UnrolledControllers;

      default:
        throw new Error(`Unexpected error`);
    }
  }
}

const formDefs = new FormDefs(formMapperService, dxElementService);
export default formDefs;
