import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButton } from '../../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';
import { _gslActions } from '../../../services/dx/shortcuts/gsl/gslActions.impl';

export const gslActionRuntimeFunctionDemo: FormDemoDefinition = {
  title: 'Functions / GSL Action RuntimeFunction',
  category: 'Functions',
  description: 'GSL _gslActions decorator callback returns a RuntimeFunction, promoting the button to a FunctionWidget. The button label updates dynamically based on runtime data.',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiButton({ onClick: 'submit' }),
  ],
  formSelectors: () =>
    _gslActions({
      decorator: () => (params) => ({
        label: params?.$form?.name ? `Submit for ${params.$form.name}` : 'Submit',
      }),
    }),
};
