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
  DataInputDefsByKey,
  FormDefFacade,
  FormDefTuple,
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
    formDefFacade: FormDefFacade<FormData>,
    formConfig?: FormConfig<FormData>,
  ): Form<StateKeys, FormData> {
    const formTuples = this.extractTuples(formDefFacade);

    const formFields: (FormField<StateKeys, FormData> | FunctionField<StateKeys, FormData>)[] =
      formTuples.flatMap((item) => this.mapTupleToFormFields(item, formConfig));

    return {
      form: {
        uid: '',
        children: formFields,
        kind: 'layout',
        widget: 'stack',
        props: {
          direction: 'horizontal',
        },
      },
    };
  }

  private mapTupleToFormFields<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    item: FormDefTuple<FormData>,
    formConfig?: FormConfig<FormData>,
  ): (FormField<StateKeys, FormData> | FunctionField<StateKeys, FormData>)[] {
    const typeRaw = item[0];
    switch (typeRaw) {
      case 'data_inputs':
        return this.dataInputMapper(item[1], formConfig);
      case 'controllers':
        return this.controllerDefsMapper(item[1]);
      default:
        throw new Error(`Unsupported form element type "${typeRaw}"`);
    }
  }

  private mapFormDefsToFormTuples<FormData extends Record<string, any> = any>(
    item: FormDefTuple<FormData>,
  ): FormDefTuple<FormData> {
    if (Array.isArray(item)) {
      return item;
    } else {
      return ['data_inputs', item];
    }
  }

  private dataInputMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    dataInput: DataInputDefsByKey<FormData>,
    formConfig?: FormConfig<FormData>,
  ): (ControlField<any, StateKeys, FormData> | FunctionField<StateKeys, FormData>)[] {
    return Object.entries(dataInput).map(([key, fieldDefRaw]) => {
      if (!fieldDefRaw) {
        throw new Error(`Definition for field "${key}" is missing`);
      }

      if (typeof fieldDefRaw === 'function') {
        return ((params: FunctionFieldParams<FormData>) => {
          const hasErrors = params == null || params.errors == null || params.errors.length === 0;
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
  >(controllersDefRaw: ControllersDefFacade): InteractiveField<StateKeys, FormData>[] {
    const interactiveDefs: (ControllerDef | ControllerDefCallback)[] = Array.isArray(
      controllersDefRaw,
    )
      ? controllersDefRaw
      : [controllersDefRaw];

    return interactiveDefs.map<InteractiveField<StateKeys, FormData>>((interactiveDefRaw) => {
      if (typeof interactiveDefs === 'function') {
        throw new Error('Controller callbacks are not supported yet');
      }

      const interactiveDef = interactiveDefRaw as ControllerDef;

      return {
        uid: '',
        kind: 'interactive', // data
        widget: 'button',
        disabled: interactiveDef.disabled,
        label: 'Submit',
      };
    });
  }

  private extractTuples<FormData extends Record<string, any> = any>(
    formDefFacade: FormDefFacade<FormData>,
  ): FormDefTuple<FormData>[] {
    if (!Array.isArray(formDefFacade)) {
      return [['data_inputs', formDefFacade]];
    }
    return formDefFacade.map((item) => this.mapFormDefsToFormTuples(item));
  }
}

const formMapperService = new FormDefMapper(dataInputsMapper);
export default formMapperService;
