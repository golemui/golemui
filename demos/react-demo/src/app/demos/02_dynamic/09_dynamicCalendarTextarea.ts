import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _guiCalendar, _guiTextarea } from '../../../services/dx';

export const dynamicCalendarTextareaDemo: FormDemoDefinition = {
  title: '9. Dynamic Calendar & Textarea',
  category: 'Ch2: Dynamic',
  description:
    'Callbacks work on every widget type — not just inputs and buttons. '
    + 'Here the calendar disables dates before today, and the textarea placeholder adapts to the form state.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiCalendar('startDate', (params) => ({
      minDate: new Date().toISOString().slice(0, 10),
      label: params?.$form?.name ? `Start date for ${params.$form.name}` : 'Start date',
    })),
    _guiTextarea('message', (params) => ({
      placeholder: params?.$form?.name ? `Message for ${params.$form.name}...` : 'Your message...',
    })),
  ],
};
