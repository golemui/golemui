import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const dynamicCalendarTextareaDemo: FormDemoDefinition = {
  title: '34. Dynamic Calendar & Textarea',
  category: 'Ch7: Dynamic',
  description:
    'Callbacks work on every widget type — not just inputs and buttons. '
    + 'Here the calendar disables dates before today, and the textarea placeholder adapts to the form state.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.calendar('startDate', (params) => ({
      minDate: new Date().toISOString().slice(0, 10),
      label: params?.$form?.name ? `Start date for ${params.$form.name}` : 'Start date',
    })),
    gui.inputs.textarea('message', (params) => ({
      placeholder: params?.$form?.name ? `Message for ${params.$form.name}...` : 'Your message...',
    })),
  ],
};
