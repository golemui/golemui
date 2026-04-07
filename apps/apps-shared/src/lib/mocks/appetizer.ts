import { defineForm, FunctionWidgetParams } from '@golemui/core';
import { Example } from './types';

const minDate = new Date().toISOString().split('T')[0];

const coins: { [key: string]: string } = {
  AU: 'AUD',
  BR: 'BRL',
  CA: 'CAD',
  CN: 'CNY',
  FR: 'EUR',
  DE: 'EUR',
  IN: 'INR',
  IT: 'EUR',
  JP: 'JPY',
  MX: 'MXN',
  KR: 'KRW',
  ES: 'EUR',
  UK: 'UAH',
  US: 'USD',
  GB: 'GBP',
};

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false, // Toggles the UI state
    notes: '',
  },
};

const form = defineForm({
  form: [
    {
      uid: '',
      kind: 'layout',
      type: 'grid',
      props: {
        direction: 'row',
        autoFit: true,
        gap: 50,
      },
      children: [
        {
          uid: 'departureCountry',
          kind: 'input',
          type: 'dropdown',
          path: 'departureCountry',
          label: {
            key: 'travelPlanner.field.departureCountry.label',
            default: 'Departure Country',
          },
          size: 2,
          validator: { type: 'string', required: true },
          props: {
            height: 300,
            itemHeight: 60,
            itemRenderer: 'countryItemRenderer',
            placeholder: {
              key: 'travelPlanner.field.departureCountry.placeholder',
              default: 'Select a Country',
            },
            labelField: 'label',
            valueField: 'id',
            items: [
              { id: 'AU', flag: '🇦🇺', label: 'Australia' },
              { id: 'BR', flag: '🇧🇷', label: 'Brazil' },
              { id: 'CA', flag: '🇨🇦', label: 'Canada' },
              { id: 'CN', flag: '🇨🇳', label: 'China' },
              { id: 'FR', flag: '🇫🇷', label: 'France' },
              { id: 'DE', flag: '🇩🇪', label: 'Germany' },
              { id: 'IN', flag: '🇮🇳', label: 'India' },
              { id: 'IT', flag: '🇮🇹', label: 'Italy' },
              { id: 'JP', flag: '🇯🇵', label: 'Japan' },
              { id: 'MX', flag: '🇲🇽', label: 'Mexico' },
              { id: 'KR', flag: '🇰🇷', label: 'South Korea' },
              { id: 'ES', flag: '🇪🇸', label: 'Spain' },
              { id: 'UK', flag: '🇺🇦', label: 'Ukraine' },
              { id: 'US', flag: '🇺🇸', label: 'United States' },
              { id: 'GB', flag: '🇬🇧', label: 'United Kingdom' },
            ],
          },
        },
        {
          uid: 'budget',
          kind: 'input',
          type: 'currency',
          path: 'budget',
          label: {
            key: 'travelPlanner.field.budget',
            default: 'Travel Budget',
          },
          props: {
            step: 100,
            placeholder: (data: FunctionWidgetParams<any> | undefined) =>
              coins[data?.$form?.departureCountry ?? 'US'],
            currency: (data: FunctionWidgetParams<any> | undefined) =>
              coins[data?.$form?.departureCountry ?? 'US'],
          },
          validator: { type: 'number', required: true, minimum: 100 },
        }
      ],
    },
    {
      uid: '',
      kind: 'layout',
      type: 'flex',
      props: {
        direction: 'column',
        align: 'end',
        justify: 'end',
      },
      children: [
        {
          uid: 'passengers',
          kind: 'input',
          type: 'number',
          path: 'passengers',
          defaultValue: 1,
          label: {
            key: 'travelPlanner.field.passengers',
            default: 'Passengers',
          },
          size: 2,
          props: {
            minimum: 1,
            maximum: 10,
          },
          validator: { type: 'number', required: true, minimum: 1, maximum: 10 },
        },
        {
          uid: 'pets',
          kind: 'input',
          type: 'number',
          path: 'pets',
          defaultValue: 1,
          label: {
            key: 'travelPlanner.field.pets',
            default: 'Pets',
          },
          size: 2,
          props: {
            minimum: 1,
            maximum: 3,
          },
          validator: { type: 'number', required: true, minimum: 1, maximum: 3 },
          include: { when: '$form.includePets === true' },
        },
        {
          uid: 'includePets',
          kind: 'input',
          type: 'toggle',
          path: 'includePets',
          size: 3,
          label: {
            key: 'travelPlanner.field.includePets',
            default: 'Include Pets',
          },
        },
      ],
    },
    {
      uid: 'preferredDates',
      kind: 'input',
      type: 'rangeCalendar',
      path: 'preferredDates',
      label: {
        key: 'travelPlanner.field.preferredDates.label',
        default: 'Select Preferred Dates',
      },
      size: 3,
      validator: { type: 'array', required: true, minItems: 1, maxItems: 3 },
      props: {
        minDate: minDate,
        icon: 'calendar_month',
        prevMonthIcon: 'chevron_left',
        nextMonthIcon: 'chevron_right',
        prevMonthAriaLabel: {
          key: 'travelPlanner.field.preferredDates.prevMonthAriaLabel',
          default: 'Previous Month',
        },
        nextMonthAriaLabel: {
          key: 'travelPlanner.field.preferredDates.nextMonthAriaLabel',
          default: 'Next Month',
        },
        numberOfMonths: 3,
      },
    },
    // Submit Action
    {
      uid: 'btn-submit',
      kind: 'action',
      type: 'button',
      on: {
        click: 'handleSubmit',
      },
      label: {
        key: 'travelPlanner.btn.submit',
        default: 'Search My Trip',
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */

const resources = {
  // English (Default)
  en: {
    translation: {
      travelPlanner: {
        field: {
          departureCountry: {
            label: 'Departure Country',
            placeholder: 'Select a Country',
          },
          budget: 'Travel Budget',
          passengers: 'Passengers',
          pets: 'Pets',
          includePets: 'Include Pets',
          preferredDates: {
            label: 'Select Preferred Dates',
            nextMonthAriaLabel: 'Next Month',
            prevMonthAriaLabel: 'Previous Month',
          },
        },
        btn: {
          submit: 'Search My Trip',
        },
      },
    },
  },

  // Spanish (Español)
  es: {
    translation: {
      travelPlanner: {
        field: {
          departureCountry: {
            label: 'País de origen',
            placeholder: 'Seleccione un país',
          },
          budget: 'Presupuesto de viaje',
          passengers: 'pasajeros',
          pets: 'mascotas',
          includePets: 'Incluir mascotas',
          preferredDates: {
            label: 'Seleccionar fechas preferidas',
            nextMonthAriaLabel: 'Mes siguiente',
            prevMonthAriaLabel: 'Mes anterior',
          },
        },
        btn: {
          submit: 'Buscar mi viaje',
        },
      },
    },
  },

  // Japanese (日本語)
  ja: {
    translation: {
      travelPlanner: {
        field: {
          departureCountry: {
            label: '出発国',
            placeholder: '国を選択',
          },
          budget: '旅行予算',
          passengers: '乗客',
          pets: 'ペット',
          includePets: 'ペット同伴',
          preferredDates: {
            label: '希望日の選択',
            nextMonthAriaLabel: '翌月',
            prevMonthAriaLabel: '前月',
          },
        },
        btn: {
          submit: '旅行を検索する',
        },
      },
    },
  },

  // Farsi (فارسی) - RTL Language support required in UI
  fa: {
    translation: {
      travelPlanner: {
        field: {
          departureCountry: {
            label: 'کشور مبدا',
            placeholder: 'یک کشور را انتخاب کنید',
          },
          budget: 'بودجه سفر',
          passengers: 'مسافران',
          pets: 'حیوانات خانگی',
          includePets: 'همراه با حیوان خانگی',
          preferredDates: {
            label: 'انتخاب تاریخ‌های مورد نظر',
            nextMonthAriaLabel: 'ماه بعد',
            prevMonthAriaLabel: 'ماه قبل',
          },
        },
        btn: {
          submit: 'جستجوی سفر من',
        },
      },
    },
  },
};

export const appetizer: Example = {
  data,
  form,
  resources,
};
