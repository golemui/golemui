export type Action =
  | {
      type: 'INITIALIZE';
      payload: { formDef: string | Record<string, any>; formName: string };
    }
  | { type: 'SET_DATA'; payload: { data: Record<string, any> } };
