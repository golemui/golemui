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
      uid: 'budget',
      kind: 'input',
      type: 'currency',
      path: 'budget',
      defaultValue: 10000,
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
          departureCountry: {
            label: 'País de origen',
            placeholder: 'Seleccione un país',
          },
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
          departureCountry: {
            label: '出発国',
            placeholder: '国を選択',
          },
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
          departureCountry: {
            label: 'کشور مبدا',
            placeholder: 'یک کشور را انتخاب کنید',
          },
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

export const validationDemo: Example = {
  data,
  form,
  resources,
};
