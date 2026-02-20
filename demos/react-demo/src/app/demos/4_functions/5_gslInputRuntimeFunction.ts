import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const gslInputRuntimeFunctionDemo: FormDemoDefinition = {
  title: 'Functions / GSL Input RuntimeFunction',
  category: 'Functions',
  description: 'GSL _gslInputs decorator callback returns a RuntimeFunction, promoting all inputs to FunctionWidgets. The placeholder updates dynamically based on runtime data.',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
  formSelectors: () =>
    _gslInputs({
      decorator: (currentDef) => (params) => ({
        placeholder: params?.$form?.name
          ? `${currentDef.path} (editing ${params.$form.name})`
          : `${currentDef.path}`,
      }),
    }),
};
