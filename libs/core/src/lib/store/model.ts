import * as Field from '../Field';
import * as Form from '../Form';
import { Uid } from '../shared';

export type FormStoreError =
  | { kind: 'none' }
  | { kind: 'fatal'; error: string }
  | { kind: 'validation'; errors: string[] };

export type State = {
  formName: string;
  formDef: Form.Form;
  formMeta: Record<Uid, Record<string, any>>;
  fields: Record<Uid, Field.FormField>;
  fieldFlags: Record<Uid, Field.Flags>;
  fieldMeta: Record<Uid, Record<string, any>>;
  data: Record<string, any>;
  error: FormStoreError;
};

export const createInitialState = (): State => ({
  formName: '',
  formDef: Form.FormSchema.parse({
    form: Field.stack([] as Field.FormField[]),
  }) as Form.Form,
  formMeta: {},
  fields: {},
  fieldFlags: {},
  fieldMeta: {},
  data: {},
  error: { kind: 'none' },
});

export type MiddlewareAPI<S, A> = {
  getState: () => S;
  dispatch: (action: A) => void;
};

export type Middleware<S, A> = (
  api: MiddlewareAPI<S, A>,
) => (next: (action: A) => void) => (action: A) => void;
