import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/guiFields.impl';

export const mixingLayouts: FormDemoDefinition = {
  title: 'Mixing Layouts',
  description: 'Basic layout mixing',
  formDef: () => [
    _guiFields({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
    [
      '_horizontalLayout',
      [
        _guiFields({
          married: 'number',
          withChildren: 'number',
        }),
      ],
    ],
    _guiFields({
      occupation: 'string',
    }),
  ],
};
