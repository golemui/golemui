import {
  ControlField,
  DisplayField,
  Form,
  InteractiveField,
  LayoutField,
  UiState,
} from '@golemui/core';
import {
  ControllersDefFacade,
  DataInputDef,
  DataInputDefsByKey,
  FormDefFacade,
  FormDefFacadeLike,
  FormDefTuple,
} from '../formDef.domain';

type FormField<StateKeys extends UiState = never, FormData extends Record<string, any> = any> =
  | DisplayField<StateKeys, FormData>
  | ControlField<any, StateKeys, FormData>
  | LayoutField<StateKeys, FormData>
  | InteractiveField<StateKeys, FormData>;

export class FormDefMapper {
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
        return this.interactiveInputMapper(item[1]);
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
    return Object.entries(dataInput).map(([key, fieldDef]) => {
      if (!fieldDef) {
        throw new Error(`Definition for field "${key}" is missing`);
      }
      switch (fieldDef.type) {
        case 'text':
          return this.textFieldDefMapper(key, fieldDef);
        case 'number':
          return this.numberFieldDefMapper(key, fieldDef);
        default:
          throw new Error(`Unsupported field type "${fieldDef.type}"`);
      }
    });
  }

  private interactiveInputMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(interactiveDefRaw: ControllersDefFacade): InteractiveField<StateKeys, FormData>[] {
    const interactiveDefs = Array.isArray(interactiveDefRaw)
      ? interactiveDefRaw
      : [interactiveDefRaw];
    return interactiveDefs.map((controllerDef) => this.interactiveDefMapper(controllerDef));
  }

  private textFieldDefMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: DataInputDef): ControlField<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'control', // data
      widget: 'textinput',
      path: key,
      validator: fieldDef.validator,
    };
  }

  private numberFieldDefMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(key: string, fieldDef: any): ControlField<any, StateKeys, FormData> {
    return {
      uid: '',
      kind: 'control', // data
      widget: 'number',
      path: key,
      validator: fieldDef.validator,
    };
  }

  private interactiveDefMapper<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(interactiveDef: ControllersDefFacade): InteractiveField<StateKeys, FormData> {
    return {
      uid: '',
      kind: 'interactive', // data
      widget: 'button',
      disabled: true,
      label: 'test',
    };
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

const formMapperService = new FormDefMapper();
export default formMapperService;
