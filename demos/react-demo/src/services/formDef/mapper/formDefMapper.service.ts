import {
  ControlField,
  DisplayField,
  Form,
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
  FormDefFacadeLike,
  FormDefTuple,
  NumberDataInputDef,
  OneOfDataInputDefs,
  TextDataInputDef,
} from '../formDef.domain';
import sensibleDefaults, { SensibleDefaults } from '../default/sensibleDefaults.service';

type FormField<StateKeys extends UiState = never, FormData extends Record<string, any> = any> =
  | DisplayField<StateKeys, FormData>
  | ControlField<any, StateKeys, FormData>
  | LayoutField<StateKeys, FormData>
  | InteractiveField<StateKeys, FormData>;

export class FormDefMapper {
  constructor(private readonly sensibleDefaults: SensibleDefaults) {}

  map<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    formDefFacade: FormDefFacade<FormData>,
  ): Form<StateKeys, FormData> {
    const formTuples = this.extractTuples(formDefFacade);

    const formFields: FormField<StateKeys, FormData>[] = formTuples.flatMap((item) =>
      this.mapTupleToFormFields(item),
    );

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
  >(item: FormDefTuple<FormData>): FormField<StateKeys, FormData>[] {
    const typeRaw = item[0];
    switch (typeRaw) {
      case 'data_inputs':
        return this.dataInputMapper(item[1]);
      case 'controllers':
        return this.controllerDefsMapper(item[1]);
      default:
        throw new Error(`Unsupported form element type "${typeRaw}"`);
    }
  }

  private mapFormDefsToFormTuples<FormData extends Record<string, any> = any>(
    item: FormDefFacadeLike<FormData>,
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
  >(dataInput: DataInputDefsByKey<FormData>): ControlField<any, StateKeys, FormData>[] {
    return Object.entries(dataInput).map(([key, fieldDefRaw]) => {
      if (!fieldDefRaw) {
        throw new Error(`Definition for field "${key}" is missing`);
      }

      const fieldDef: OneOfDataInputDefs =
        typeof fieldDefRaw === 'string'
          ? this.sensibleDefaults.explodeShortcut(fieldDefRaw)
          : fieldDefRaw;
      switch (fieldDef.type) {
        case 'text':
          return this.textFieldDefMapper(key, fieldDef);
        case 'number':
          return this.numberFieldDefMapper(key, fieldDef);
        default:
          throw new Error(`Unsupported field type "${(fieldDefRaw as OneOfDataInputDefs).type}"`);
      }
    });
  }

  private textFieldDefMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: TextDataInputDef): ControlField<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'control', // data
      widget: 'textinput',
      path: key,
      validator: {
        type: 'string',
        ...fieldDef.validator,
      },
    };
  }

  private numberFieldDefMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: NumberDataInputDef): ControlField<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'control', // data
      widget: 'number',
      path: key,
      validator: {
        type: 'number',
        ...fieldDef.validator,
      },
    };
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
        label: 'test',
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

const formMapperService = new FormDefMapper(sensibleDefaults);
export default formMapperService;
