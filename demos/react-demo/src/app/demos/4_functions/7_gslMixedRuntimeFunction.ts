import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiButton } from '../../../services/dx/shortcuts/actions/guiActions.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';
import { _gslActions } from '../../../services/dx/shortcuts/actions/gslActions.impl';

export const gslMixedRuntimeFunctionDemo: FormDemoDefinition = {
  title: 'Functions / GSL Mixed RuntimeFunctions',
  category: 'Functions',
  description: 'Both _gslInputs and _gslActions decorators return RuntimeFunctions, promoting all inputs and the submit button to FunctionWidgets.',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiButton({ onClick: 'submit' }),
  ],
  formSelectors: () => [
    _gslInputs({
      decorator: (currentDef) => (params) => ({
        placeholder: params?.$form?.name
          ? `${currentDef.path} (for ${params.$form.name})`
          : `${currentDef.path}`,
      }),
    }),
    _gslActions({
      decorator: () => (params) => ({
        label: params?.$form?.name ? `Save ${params.$form.name}` : 'Save',
        disabled: !params?.$form?.name,
      }),
    }),
  ],
};
