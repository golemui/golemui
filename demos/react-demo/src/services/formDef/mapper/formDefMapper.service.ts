import {
  ActionWidget,
  DisplayWidget,
  Form,
  FunctionWidget,
  FunctionWidgetParams,
  InputWidget,
  LayoutWidget,
  UiState,
} from '@golemui/core';
import { ActionDef, OneOfDataInputDefs } from '../formDef.domain';
import { FormConfig } from '../fomConfig.domain';
import formItemsMapper, { FormItemsMapper } from './formItemsMapper.service';
import dxUnrollingService, { DxUnrollingService } from '../dx/dxUnrolling.service';
import UnrolledController, { UnrolledField, ValidUnrolledElement } from '../dx/dx.domain';

export type FormWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any> =
  | DisplayWidget<StateKeys, FormData>
  | FunctionWidget<StateKeys, FormData>
  | InputWidget<any, StateKeys, FormData>
  | LayoutWidget<StateKeys, FormData>
  | ActionWidget<StateKeys, FormData>;

export interface ReadyToMapToGolemFormItem {
  type: 'controller' | 'field';
  unrolledElement: UnrolledField | UnrolledController;
  value: OneOfDataInputDefs | ActionDef;
  isCallback: boolean;
}

export class FormDefMapper {
  constructor(
    private readonly formItemsMapper: FormItemsMapper,
    private readonly dxUnrollingService: DxUnrollingService,
  ) {}

  map<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    unrolledResults: ValidUnrolledElement[],
    formConfig?: FormConfig<FormData>,
  ): Form<StateKeys, FormData> {
    const formFields = this.doMap(unrolledResults, formConfig);
    return {
      form: this.createLayout(formFields),
    };
  }

  private doMap<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    unrolledResults: ValidUnrolledElement[],
    formConfig: FormConfig<FormData> | undefined,
  ): FormWidget<StateKeys, FormData>[] {
    return unrolledResults.flatMap((item) => this.mapToFormWidget(item, formConfig));
  }

  private createLayout<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    children: FormWidget<StateKeys, FormData>[],
    direction: 'vertical' | 'horizontal' = 'vertical',
  ): LayoutWidget<StateKeys, FormData> {
    return {
      uid: '',
      children,
      kind: 'layout',
      type: 'stack',
      props: {
        direction: direction,
      },
    };
  }

  private mapToFormWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    unrolledElement: ValidUnrolledElement,
    formConfig?: FormConfig<FormData>,
  ): FormWidget<StateKeys, FormData>[] {
    if (this.dxUnrollingService.isUnrolledLayout(unrolledElement)) {
      const children: FormWidget<StateKeys, FormData>[] = this.doMap(unrolledElement.children, formConfig);
      return [this.createLayout(children, unrolledElement.layoutKey)];
    }
    if (dxUnrollingService.isUnrolledItems(unrolledElement)) {
      return unrolledElement.items.map((itemElement) => {
        const itemDef = itemElement.value;
        if (typeof itemDef === 'function') {
          return ((params: FunctionWidgetParams<FormData>) => {
            console.log(`item dynamic definition`, params);
            const hasErrors = params != null && params?.errors != null && params.errors.length > 0;
            const hotMapping = itemDef({ error: hasErrors });
            const mapControlField = this.mapToFormItem(
              {
                unrolledElement: itemElement,
                value: hotMapping,
                isCallback: true,
                type: unrolledElement.type === 'controllers' ? 'controller' : 'field',
              },
              formConfig,
            );
            console.log(`item final config`, mapControlField);
            return mapControlField;
          }) as FunctionWidget<StateKeys, FormData>;
        }
        return this.mapToFormItem(
          {
            unrolledElement: itemElement,
            value: itemElement.value as OneOfDataInputDefs | ActionDef,
            isCallback: false,
            type: unrolledElement.type === 'controllers' ? 'controller' : 'field',
          },
          formConfig,
        );
      });
    }
    throw new Error(`Unexpected error`);
  }

  private mapToFormItem<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    toMap: ReadyToMapToGolemFormItem,
    formConfig?: FormConfig<FormData>,
  ): FormWidget<StateKeys, FormData> {
    return this.formItemsMapper.mapItem(toMap, formConfig);
  }
}

const formMapperService = new FormDefMapper(formItemsMapper, dxUnrollingService);
export default formMapperService;
