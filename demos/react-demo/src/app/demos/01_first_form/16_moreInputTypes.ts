import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiPassword,
  _guiCheckbox,
  _guiDateInput,
  _guiCurrency,
  _guiRangeCalendar,
  _guiInputs,
  _gslRoot,
} from '../../../services/dx';

export const moreInputTypesDemo: FormDemoDefinition = {
  title: '16. More Input Types',
  category: 'Ch1: First Form',
  description:
    'Password, checkbox, date input, currency, and range calendar — each created with a single factory call.',
  formDef: () => [
    _guiInputs({ name: 'string', email: 'string' }),
    _guiPassword('password'),
    _guiCheckbox('agreeToTerms'),
    _guiDateInput('birthday'),
    _guiCurrency('salary', { currency: 'EUR' }),
    _guiRangeCalendar('vacationDates'),
  ],
  formSelectors: () =>
    _gslRoot({
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
