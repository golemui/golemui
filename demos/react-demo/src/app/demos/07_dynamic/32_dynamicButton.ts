import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const dynamicButtonDemo: FormDemoDefinition = {
  title: '32. Dynamic Button',
  category: 'Ch7: Dynamic',
  description:
    "Same callback pattern on actions. The button label adapts to the user's name, " +
    'and it stays disabled until the email field is filled. Any widget factory that accepts props also accepts a callback.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.textInput('email'),
    gui.actions.button((params) => ({
      label: params?.$form?.name ? `Send for ${params.$form.name}` : 'Send',
      disabled: !params?.$form?.email,
      onClick: (_data) => console.log('Submitted'),
    })),
  ],
};
