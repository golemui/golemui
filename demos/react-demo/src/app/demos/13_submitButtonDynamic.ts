import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/guiFields.impl';

export const configureDynamicButton: FormDemoDefinition = {
  title: 'Should let us configure a dynamic submit button',
  description: 'Should let us configure a dynamic submit button',
  formDef: ()=>[
    _guiFields({
      name: 'string',
      age: ({ error }: any) => ({
        label: error ? 'Age must be at least 18' : 'Age',
        type: 'number',
        placeholder: 'age >= 18',
        validator: {
          minimum: 18,
        },
      }),
    }),
    [
      '_submitButton',
      ({ error }) => ({
        label: 'Submit tweaked!',
        disabled: error,
      }),
    ],
    _guiFields({
      gender: 'string',
    }),
  ],
  formConfig: {
    onSubmit: (data: any) => alert(JSON.stringify(data)),
  },
  warnings: ['The button does not receive errors from other parts of the form'],
};
