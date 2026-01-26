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
import {
  ControllerDef,
  ControllerDefCallback,
  ControllersDefFacade,
  FormDefTuple,
  ProcessedDataInputDefsByKey,
} from '../formDef.domain';
import { FormConfig } from '../fomConfig.domain';
import dataInputsMapper, { DataInputsMapper } from './dataInputsMapper.service';

type FormField<StateKeys extends UiState = never, FormData extends Record<string, any> = any> =
  | DisplayField<StateKeys, FormData>
  | ControlField<any, StateKeys, FormData>
  | LayoutField<StateKeys, FormData>
  | InteractiveField<StateKeys, FormData>;

export class FormDefMapper {
  constructor(private readonly dataInputsMapper: DataInputsMapper) {}

  map<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    formTuples: FormDefTuple<FormData>[],
    formConfig?: FormConfig<FormData>,
  ): Form<StateKeys, FormData> {
    // const formTuples = this.extractTuples(formDefFacade);

    const formFields: (FormField<StateKeys, FormData> | FunctionField<StateKeys, FormData>)[] =
      formTuples.flatMap((item) => this.mapTupleToFormFields(item, formConfig));
    return {
      form: this.createLayout(formFields),
    };
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

  private mapTupleToFormFields<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    item: FormDefTuple<FormData>,
    formConfig?: FormConfig<FormData>,
  ): (
    | FormField<StateKeys, FormData>
    | FunctionField<StateKeys, FormData>
    | LayoutField<StateKeys, FormData>
  )[] {
    const typeRaw = item[0];
    switch (typeRaw) {
      case 'data_inputs':
        return this.dataInputMapper(item[1], formConfig);
      case 'controllers':
        return this.controllerDefsMapper(item[1]);
      case 'layout':
        return [this.layoutMapper(item[1])];
      default:
        throw new Error(`Unsupported form element type "${typeRaw}"`);
    }
  }

  private layoutMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(itemElement: FormDefTuple<FormData>[]): LayoutField<StateKeys, FormData> {
    const children = itemElement.flatMap((item) => this.mapTupleToFormFields(item));
    return this.createLayout(children, 'horizontal');
  }

  private dataInputMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    dataInput: ProcessedDataInputDefsByKey<FormData>,
    formConfig?: FormConfig<FormData>,
  ): (ControlField<any, StateKeys, FormData> | FunctionField<StateKeys, FormData>)[] {
    return Object.entries(dataInput).map(([key, fieldDefRaw]) => {
      if (!fieldDefRaw) {
        throw new Error(`Definition for field "${key}" is missing`);
      }

      if (typeof fieldDefRaw === 'function') {
        return ((params: FunctionFieldParams<FormData>) => {
          console.log(`dataInputMapper dynamic definition`, params);
          const hasErrors = params != null && params?.errors != null && params.errors.length > 0;
          const hotMapping = fieldDefRaw({ error: hasErrors });
          const mapControlField = this.dataInputsMapper.mapControlField<StateKeys, FormData>(
            key,
            hotMapping,
            formConfig,
          );
          console.log(`mapControlField`, mapControlField);
          return mapControlField;
        }) as FunctionField<StateKeys, FormData>;
      }
      return this.dataInputsMapper.mapControlField<StateKeys, FormData>(
        key,
        fieldDefRaw,
        formConfig,
      );
    });
  }

  private controllerDefsMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    controllersDefRaw: ControllersDefFacade,
  ): (FunctionField<StateKeys, FormData> | InteractiveField<StateKeys, FormData>)[] {
    const interactiveDefs: (ControllerDef | ControllerDefCallback)[] = Array.isArray(
      controllersDefRaw,
    )
      ? controllersDefRaw
      : [controllersDefRaw];

    return interactiveDefs.map<
      FunctionField<StateKeys, FormData> | InteractiveField<StateKeys, FormData>
    >(
      (
        interactiveDefRaw,
      ): FunctionField<StateKeys, FormData> | InteractiveField<StateKeys, FormData> => {
        if (typeof interactiveDefRaw === 'function') {
          return ((params: FunctionFieldParams<FormData>) => {
            console.log(`controller dynamic definition`, params);
            const hasErrors = params != null && params?.errors != null && params.errors.length > 0;
            const controllerDefCall = interactiveDefRaw as ControllerDefCallback;
            const result = controllerDefCall({ error: hasErrors});
            console.log(`controllerDefCall`, result);
            return result;
          }) as FunctionField<StateKeys, FormData>;
        }

        const interactiveDef = interactiveDefRaw as ControllerDef;

        return {
          uid: '',
          kind: 'interactive', // data
          widget: 'button',
          disabled: interactiveDef.disabled,
          label: interactiveDef.label,
          ...(interactiveDef.on != null ? { on: interactiveDef.on } : {}),
        };
      },
    );
  }
}

const formMapperService = new FormDefMapper(dataInputsMapper);
export default formMapperService;
