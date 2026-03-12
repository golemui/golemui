import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  DxRuntimeParams,
  _guiInputs,
  _guiTextInput,
  _guiNumberInput,
  _guiCalendar,
  _guiTextarea,
  _guiPassword,
  _guiCheckbox,
  _guiDateInput,
  _guiCurrency,
  _guiRangeCalendar,
  _guiSelect,
  _guiRadiogroup,
  _guiTabs,
  _guiList,
  _guiButton,
  _guiHorizontalStack,
  _guiDisplay,
  _gslTag,
  _gslInputs,
  _gslRoot,
  _gslActionById,
  _gslLayoutById,
} from '@golemui/gui-shared';

export const completeFormDemo: FormDemoDefinition = {
  title: '15. The Complete Form',
  category: 'Ch4: Showcase',
  description:
    'Every feature in one form. Structure, dynamics, selectors, tags, layouts, and displays working together. '
    + 'This is what a production form looks like.',
  formDef: () => [
    () => <h2>Event Registration</h2>,

    _guiTabs({
      Details: [
        _guiHorizontalStack([
          _guiInputs({
            firstName: ['string', 'required'],
            lastName: ['string', 'required'],
          }),
        ]),

        _guiTextInput('email', {
          placeholder: 'you@example.com',
          validator: { required: true, pattern: '^[^@]+@[^@]+$' },
        }, ['required']),

        _guiPassword('password', { hint: 'Use at least 8 characters' }, ['required']),

        _guiCheckbox('agreeToTerms', { checkboxPosition: 'right' }),
      ],
      Event: [
        _guiNumberInput('guests', { minimum: 1, maximum: 10, step: 1 }),
        _guiDateInput('arrivalDate', { icon: 'calendar' }),
        _guiCurrency('budget', { currency: 'EUR', step: 0.5 }),
        _guiRangeCalendar('stayRange', { numberOfMonths: 2 }),

        _guiSelect('dietaryPreference', {
          options: [
            { label: 'No preference', value: 'none' },
            { label: 'Vegetarian', value: 'vegetarian' },
            { label: 'Vegan', value: 'vegan' },
          ],
          placeholder: 'Select diet...',
        }),

        _guiRadiogroup('ticketType', {
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'VIP', value: 'vip' },
          ],
        }),

        _guiList('sessionTopics', {
          items: [
            { template: 'AI & Machine Learning', value: 'ai' },
            { template: 'Web Development', value: 'web' },
            { template: 'Cloud Infrastructure', value: 'cloud' },
          ],
        }),
      ],
    }),

    _guiCalendar('eventDate', (params) => ({
      minDate: new Date().toISOString().slice(0, 10),
      label: params?.$form?.firstName
        ? `Event date for ${params.$form.firstName}`
        : 'Event date',
    })),

    _guiTextarea('notes', (params) => ({
      placeholder: params?.$form?.firstName
        ? `Any notes, ${params.$form.firstName}?`
        : 'Additional notes...',
    })),

    (params: DxRuntimeParams) => params?.$form?.firstName
      ? <p style={{ fontStyle: 'italic' }}>Welcome, {params.$form.firstName}!</p>
      : null,

    _guiDisplay((params: DxRuntimeParams) => {
      if (!params?.errors || params.errors.length > 0) return null;
      return <p style={{ color: 'green' }}>Everything looks valid.</p>;
    }),

    _guiButton((params) => ({
      label: params?.$form?.firstName ? `Register ${params.$form.firstName}` : 'Register',
      disabled: !params?.$form?.email,
      onClick: 'submit',
    })),
  ],
  formSelectors: () => [
    _gslTag('required', _gslInputs({
      decorator: (cur) => ({
        placeholder: `${('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path} *`,
      }),
    })),

    _gslRoot({
      suppressAutomaticSubmit: true,
      onSubmit: (data) => alert(JSON.stringify(data, null, 2)),
    }),

    _gslActionById('#submit', { decorator: { label: 'Complete registration' } }),
    _gslLayoutById('#root', { decorator: { gap: 1 } }),
  ],
};
