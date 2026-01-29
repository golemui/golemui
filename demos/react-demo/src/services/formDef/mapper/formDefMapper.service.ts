import {
  ControlField,
  DisplayField,
  Form,
  FunctionField,
  FunctionFieldParams,
  InteractiveField,
  LayoutField,
  UiState,
} from '@golemui/core';
import { ControllerDef, OneOfDataInputDefs } from '../formDef.domain';
import { FormConfig } from '../fomConfig.domain';
import formItemsMapper, { FormItemsMapper } from './formItemsMapper.service';
import dxUnrollingService, { DxUnrollingService } from '../dx/dxUnrolling.service';
import { UnrolledController, UnrolledField, ValidUnrolledElement } from '../dx/dx.domain';

type FormField<StateKeys extends UiState = never, FormData extends Record<string, any> = any> =
  | DisplayField<StateKeys, FormData>
  | ControlField<any, StateKeys, FormData>
  | LayoutField<StateKeys, FormData>
  | InteractiveField<StateKeys, FormData>;

export interface ReadyToMapToGolemFormItem {
  type: 'controller' | 'field';
  unrolledElement: UnrolledField | UnrolledController;
  value: OneOfDataInputDefs | ControllerDef;
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
  ): (
    | DisplayField<StateKeys, FormData>
    | ControlField<any, StateKeys, FormData>
    | LayoutField<StateKeys, FormData>
    | InteractiveField<StateKeys, FormData>
    | FunctionField<StateKeys, FormData>
  )[] {
    return unrolledResults.flatMap((item) => this.mapToFormFields(item, formConfig));
  }

  private createLayout<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    children: (
      | DisplayField<StateKeys, FormData>
      | ControlField<any, StateKeys, FormData>
      | LayoutField<StateKeys, FormData>
      | InteractiveField<StateKeys, FormData>
      | FunctionField<StateKeys, FormData>
    )[],
    direction: 'vertical' | 'horizontal' = 'vertical',
  ): LayoutField<StateKeys, FormData> {
    return {
      uid: '',
      children,
      kind: 'layout',
      widget: 'stack',
      props: {
        direction: direction,
      },
    };
  }

  private mapToFormFields<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    unrolledElement: ValidUnrolledElement,
    formConfig?: FormConfig<FormData>,
  ): (
    | FormField<StateKeys, FormData>
    | FunctionField<StateKeys, FormData>
    | LayoutField<StateKeys, FormData>
  )[] {
    if (this.dxUnrollingService.isUnrolledLayout(unrolledElement)) {
      const children: (
        | FormField<StateKeys, FormData>
        | FunctionField<StateKeys, FormData>
        | LayoutField<StateKeys, FormData>
      )[] = this.doMap(unrolledElement.children, formConfig);
      return [this.createLayout(children, unrolledElement.layoutKey)];
    }
    if (dxUnrollingService.isUnrolledItems(unrolledElement)) {
      return unrolledElement.items.map((itemElement) => {
        const itemDef = itemElement.value;
        if (typeof itemDef === 'function') {
          return ((params: FunctionFieldParams<FormData>) => {
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
          }) as FunctionField<StateKeys, FormData>;
        }
        return this.mapToFormItem(
          {
            unrolledElement: itemElement,
            value: itemElement.value as OneOfDataInputDefs | ControllerDef,
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
  ): FormField<StateKeys, FormData> {
    return this.formItemsMapper.mapItem(toMap, formConfig);
  }
}

const formMapperService = new FormDefMapper(formItemsMapper, dxUnrollingService);
export default formMapperService;
