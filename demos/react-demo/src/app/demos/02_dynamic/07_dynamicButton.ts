import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _guiButton } from '../../../services/dx';

export const dynamicButtonDemo: FormDemoDefinition = {
  title: '7. Dynamic Button',
  category: 'Ch2: Dynamic',
  description:
    'Same callback pattern on actions. The button label adapts to the user\'s name, '
    + 'and it stays disabled until the email field is filled. Any widget factory that accepts props also accepts a callback.',
  formDef: () => [
    _guiInputs({ name: 'string', email: 'string' }),
    _guiButton((params) => ({
      label: params?.$form?.name ? `Send for ${params.$form.name}` : 'Send',
      disabled: !params?.$form?.email,
      onClick: (_data) => console.log('Submitted'),
    })),
  ],
};
