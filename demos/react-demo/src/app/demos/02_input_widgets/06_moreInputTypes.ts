import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const moreInputTypesDemo: FormDemoDefinition = {
  title: '6. More Input Types',
  category: 'Ch2: Input Widgets',
  description:
    'Password, checkbox, date input, currency, and range calendar — each created with a single factory call.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.textInput('email'),
    gui.inputs.password('password'),
    gui.inputs.checkbox('agreeToTerms'),
    gui.inputs.dateInput('birthday'),
    gui.inputs.currency('salary', { currency: 'EUR' }),
    gui.inputs.rangeCalendar('vacationDates'),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
