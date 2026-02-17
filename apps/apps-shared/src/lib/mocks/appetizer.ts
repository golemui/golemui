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
      type: 'stack',
      props: {
        direction: 'horizontal',
        gap: 50,
      },
      children: [
        {
          uid: 'departureCountry',
          kind: 'input',
          type: 'dropdown',
          path: 'departureCountry',
          label: {
            key: 'travelPlanner.field.departureCountry',
            default: 'Departure Country',
          },
          props: {
            size: 4,
            height: 300,
            itemHeight: 60,
            itemRenderer: 'countryItemRenderer',
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
            size: 4,
            step: 100,
            placeholder: (data: FunctionWidgetParams<any> | undefined) =>
              coins[data?.$form?.departureCountry ?? 'US'],
            currency: (data: FunctionWidgetParams<any> | undefined) =>
              coins[data?.$form?.departureCountry ?? 'US'],
          },
          validator: { type: 'number', required: true, minimum: 100 },
        },
        {
          uid: 'passengers',
          kind: 'input',
          type: 'number',
          path: 'passengers',
          label: {
            key: 'travelPlanner.field.passengers',
            default: 'Number of Passengers',
          },
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
          label: {
            key: 'travelPlanner.field.pets',
            default: 'Number of Pets',
          },
          props: {
            minimum: 1,
            maximum: 3,
          },
          validator: { type: 'number', required: true, minimum: 1, maximum: 3 },
          include: { when: '$form.includePets === true' },
        },
      ],
    },
    {
      uid: '',
      kind: 'layout',
      type: 'stack',
      props: {
        direction: 'horizontal',
        align: 'end',
      },
      children: [
        {
          uid: 'includePets',
          kind: 'input',
          type: 'toggle',
          path: 'includePets',
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
      props: {
        minDate: minDate,
        icon: 'material-icons material-icons-calendar_month',
        prevMonthIcon: 'material-icons material-icons-chevron_left',
        nextMonthIcon: 'material-icons material-icons-chevron_right',
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
      props: {
        size: 0,
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
          departureCountry: 'Departure Country',
          budget: 'Travel Budget',
          passengers: 'Number of Passengers',
          pets: 'Number of Pets',
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
          departureCountry: 'País de origen',
          budget: 'Presupuesto de viaje',
          passengers: 'Número de pasajeros',
          pets: 'Número de mascotas',
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
          departureCountry: '出発国',
          budget: '旅行予算',
          passengers: '乗客人数',
          pets: 'ペットの数',
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
          departureCountry: 'کشور مبدا',
          budget: 'بودجه سفر',
          passengers: 'تعداد مسافران',
          pets: 'تعدادی حیوان خانگی',
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
