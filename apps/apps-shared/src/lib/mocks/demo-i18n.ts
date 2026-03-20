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
    isRemote: false,
    notes: '',
  },
};

const form = defineForm({
  form: [
    {
      uid: '',
      kind: 'layout',
      type: 'flex',
      props: {
        direction: 'row',
        gap: 50,
      },
      children: [
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
            size: 1,
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
            default: 'Passengers',
          },
          defaultValue: 1,
          props: {
            minimum: 1,
            maximum: 10,
          },
          validator: { type: 'number', required: true, minimum: 1, maximum: 10 },
        },
      ],
    },
    {
      uid: '',
      kind: 'layout',
      type: 'flex',
      props: {
        direction: 'row',
        align: 'start',
      },
      children: [
        {
          uid: 'includePets',
          kind: 'input',
          type: 'toggle',
          path: 'includePets',
          label: {
            key: 'travelPlanner.field.includePets.label',
            default: 'Include Pets',
          },
          props: {
            togglePosition: 'left',
            hint: {
              key: 'travelPlanner.field.includePets.hint',
              default: 'Only hosts with pets will be included in the search results.',
            },
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
        size: 1,
        numberOfMonths: 2,
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
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */
const resources = {
  // English
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
          includePets: {
            label: 'Include Pets',
            hint: 'Only hosts with pets will be included in the search results.',
          },
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
          passengers: 'Pasajeros',
          pets: 'Mascotas',
          includePets: {
            label: 'Incluir mascotas',
            hint: 'Solo se incluirán en los resultados de búsqueda los alojamientos que acepten mascotas.',
          },
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
          includePets: {
            label: 'ペット同伴',
            hint: 'ペット可の宿泊先のみが検索結果に表示されます。',
          },
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

  // Farsi (فارسی)
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
          includePets: {
            label: 'همراه با حیوان خانگی',
            hint: 'فقط میزبانانی که حیوان خانگی می‌پذیرند در نتایج جستجو نشان داده می‌شوند.',
          },
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

export const i18nDemo: Example = {
  data,
  form,
  resources,
};
