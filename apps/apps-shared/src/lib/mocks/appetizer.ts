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

const data = {};

const form = defineForm({
  form: [
    {
      uid: 'language',
      kind: 'input',
      type: 'dropdown',
      path: 'language',
      label: {
        key: 'travelPlanner.field.language.label',
        default: 'Language',
      },
      size: 2,
      validator: {
        type: 'string',
        required: true,
        messages: {
          required: {
            key: 'travelPlanner.field.language.required',
            default: 'Language is required',
          },
          invalid: {
            key: 'travelPlanner.field.language.required',
            default: 'Language is required',
          },
        },
      },
      defaultValue: 'en',
      props: {
        height: 300,
        placeholder: {
          key: 'travelPlanner.field.language.placeholder',
          default: 'Select language',
        },
        labelField: 'label',
        valueField: 'id',
        items: [
          { id: 'en', label: 'English' },
          { id: 'es', label: 'Español' },
          { id: 'fa', label: 'فارسی' },
          { id: 'ja', label: '日本語' },
        ],
      },
      on: {
        change: 'onSelectLanguage',
      },
    },
    {
      uid: '',
      kind: 'layout',
      type: 'grid',
      props: {
        direction: 'row',
        autoFit: true,
        align: 'stretch',
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
          validator: {
            type: 'string',
            required: true,
            messages: {
              required: {
                key: 'travelPlanner.field.departureCountry.required',
                default: 'Departure Country is required',
              },
              invalid: {
                key: 'travelPlanner.field.departureCountry.required',
                default: 'Departure Country is required',
              },
            },
          },
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
          on: {
            change: 'fieldChange',
          },
        },
        {
          uid: 'budget',
          kind: 'input',
          type: 'currency',
          path: 'budget',
          label: {
            key: 'travelPlanner.field.budget.label',
            default: 'Travel Budget',
          },
          props: {
            step: 100,
            placeholder: (data: FunctionWidgetParams<any> | undefined) =>
              coins[data?.$form?.departureCountry ?? 'US'],
            currency: (data: FunctionWidgetParams<any> | undefined) =>
              coins[data?.$form?.departureCountry ?? 'US'],
          },
          validator: {
            type: 'number',
            required: true,
            minimum: 100,
            messages: {
              invalid: {
                key: 'travelPlanner.field.budget.required',
                default: 'Budget is required',
              },
              minimum: {
                key: 'travelPlanner.field.budget.minimum',
                default: 'Budget must be at least $100',
              },
            },
          },
          on: {
            change: 'fieldChange',
          },
        },
      ],
    },
    {
      uid: '',
      kind: 'layout',
      type: 'grid',
      props: {
        direction: 'row',
        autoFit: true,
        align: 'end',
      },
      children: [
        {
          uid: 'passengers',
          kind: 'input',
          type: 'number',
          path: 'passengers',
          defaultValue: 1,
          size: 1,
          label: {
            key: 'travelPlanner.field.passengers.label',
            default: 'Passengers',
          },
          props: {
            minimum: 1,
            maximum: 10,
          },
          validator: {
            type: 'number',
            required: true,
            minimum: 1,
            maximum: 10,
            messages: {
              invalid: {
                key: 'travelPlanner.field.passengers.invalid',
                default: 'Passengers field is required and must be between 1 and 10',
              },
              minimum: {
                key: 'travelPlanner.field.passengers.minimum',
                default: 'Passengers field must be at least 1',
              },
              maximum: {
                key: 'travelPlanner.field.passengers.maximum',
                default: 'Passengers field must be at most 10',
              },
            },
          },
        },
        {
          uid: 'pets',
          kind: 'input',
          type: 'number',
          path: 'pets',
          defaultValue: 1,
          size: 1,
          label: {
            key: 'travelPlanner.field.pets.label',
            default: 'Pets',
          },
          props: {
            minimum: 1,
            maximum: 3,
          },
          validator: {
            type: 'number',
            required: true,
            minimum: 1,
            maximum: 3,
            messages: {
              invalid: {
                key: 'travelPlanner.field.pets.invalid',
                default: 'Pets is required and must be between 1 and 3',
              },
              minimum: {
                key: 'travelPlanner.field.pets.minimum',
                default: 'Pets must be at least 1',
              },
              maximum: {
                key: 'travelPlanner.field.pets.maximum',
                default: 'Pets must be at most 3',
              },
            },
          },
          include: { when: '$form.includePets === true' },
        },
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
          uid: 'includePets',
          kind: 'input',
          type: 'toggle',
          path: 'includePets',
          size: 3,
          label: {
            key: 'travelPlanner.field.includePets',
            default: 'Include Pets',
          },
          on: {
            change: 'fieldChange',
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
      validator: {
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 3,
        messages: {
          invalid: {
            key: 'travelPlanner.field.preferredDates.required',
            default: 'Preferred dates are required, select at least one date',
          },
          minItems: {
            key: 'travelPlanner.field.preferredDates.minItems',
            default: 'Please select at least one date',
          },
          maxItems: {
            key: 'travelPlanner.field.preferredDates.maxItems',
            default: 'Please select no more than three dates',
          },
        },
      },
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
      },
      on: {
        change: 'fieldChange',
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
          language: {
            label: 'Language',
            placeholder: 'Select language',
            required: 'Language is required',
          },
          departureCountry: {
            label: 'Departure Country',
            placeholder: 'Select a Country',
            required: 'Departure Country is required',
          },
          budget: {
            label: 'Travel Budget',
            required: 'Budget is required',
            minimum: 'Budget must be at least $100',
          },
          passengers: {
            label: 'Passengers',
            invalid: 'Passengers field is required and must be between 1 and 10',
            minimum: 'Passengers field must be at least 1',
            maximum: 'Passengers field must be at most 10',
          },
          pets: {
            label: 'Pets',
            invalid: 'Pets is required and must be between 1 and 3',
            minimum: 'Pets must be at least 1',
            maximum: 'Pets must be at most 3',
          },
          includePets: 'Include Pets',
          preferredDates: {
            label: 'Select Preferred Dates',
            nextMonthAriaLabel: 'Next Month',
            prevMonthAriaLabel: 'Previous Month',
            required: 'Preferred dates are required, select at least one date',
            minItems: 'Please select at least one date',
            maxItems: 'Please select no more than three dates',
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
          language: {
            label: 'Idioma',
            placeholder: 'Seleccione un idioma',
            required: 'El idioma es obligatorio',
          },
          departureCountry: {
            label: 'País de origen',
            placeholder: 'Seleccione un país',
            required: 'El país de origen es obligatorio',
          },
          budget: {
            label: 'Presupuesto de viaje',
            required: 'El presupuesto es obligatorio',
            minimum: 'El presupuesto debe ser de al menos $100',
          },
          passengers: {
            label: 'Pasajeros',
            invalid:
              'Los pasajeros son obligatorios y deben ser entre 1 y 10',
            minimum: 'Debe haber al menos 1 pasajero',
            maximum: 'Debe haber como máximo 10 pasajeros',
          },
          pets: {
            label: 'Mascotas',
            invalid:
              'Las mascotas son obligatorias y deben ser entre 1 y 3',
            minimum: 'Debe haber al menos 1 mascota',
            maximum: 'Debe haber como máximo 3 mascotas',
          },
          includePets: 'Incluir mascotas',
          preferredDates: {
            label: 'Seleccionar fechas preferidas',
            nextMonthAriaLabel: 'Mes siguiente',
            prevMonthAriaLabel: 'Mes anterior',
            required:
              'Las fechas preferidas son obligatorias, seleccione al menos una fecha',
            minItems: 'Por favor, seleccione al menos una fecha',
            maxItems: 'Por favor, seleccione no más de tres fechas',
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
          language: {
            label: '言語',
            placeholder: '言語を選択',
            required: '言語は必須です',
          },
          departureCountry: {
            label: '出発国',
            placeholder: '国を選択',
            required: '出発国は必須です',
          },
          budget: {
            label: '旅行予算',
            required: '予算は必須です',
            minimum: '予算は最低$100必要です',
          },
          passengers: {
            label: '乗客',
            invalid: '乗客数は必須で、1〜10の間で入力してください',
            minimum: '乗客数は最低1人必要です',
            maximum: '乗客数は最大10人までです',
          },
          pets: {
            label: 'ペット',
            invalid: 'ペット数は必須で、1〜3の間で入力してください',
            minimum: 'ペット数は最低1匹必要です',
            maximum: 'ペット数は最大3匹までです',
          },
          includePets: 'ペット同伴',
          preferredDates: {
            label: '希望日の選択',
            nextMonthAriaLabel: '翌月',
            prevMonthAriaLabel: '前月',
            required:
              '希望日は必須です。少なくとも1つの日付を選択してください',
            minItems: '少なくとも1つの日付を選択してください',
            maxItems: '3つ以内の日付を選択してください',
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
          language: {
            label: 'زبان',
            placeholder: 'انتخاب زبان',
            required: 'زبان الزامی است',
          },
          departureCountry: {
            label: 'کشور مبدا',
            placeholder: 'یک کشور را انتخاب کنید',
            required: 'کشور مبدا الزامی است',
          },
          budget: {
            label: 'بودجه سفر',
            required: 'بودجه الزامی است',
            minimum: 'بودجه باید حداقل ۱۰۰ دلار باشد',
          },
          passengers: {
            label: 'مسافران',
            invalid: 'تعداد مسافران الزامی است و باید بین ۱ تا ۱۰ باشد',
            minimum: 'تعداد مسافران باید حداقل ۱ نفر باشد',
            maximum: 'تعداد مسافران حداکثر ۱۰ نفر می‌تواند باشد',
          },
          pets: {
            label: 'حیوانات خانگی',
            invalid:
              'تعداد حیوانات خانگی الزامی است و باید بین ۱ تا ۳ باشد',
            minimum: 'تعداد حیوانات خانگی باید حداقل ۱ باشد',
            maximum: 'تعداد حیوانات خانگی حداکثر ۳ می‌تواند باشد',
          },
          includePets: 'همراه با حیوان خانگی',
          preferredDates: {
            label: 'انتخاب تاریخ‌های مورد نظر',
            nextMonthAriaLabel: 'ماه بعد',
            prevMonthAriaLabel: 'ماه قبل',
            required:
              'تاریخ‌های مورد نظر الزامی است، حداقل یک تاریخ انتخاب کنید',
            minItems: 'لطفاً حداقل یک تاریخ انتخاب کنید',
            maxItems: 'لطفاً بیش از سه تاریخ انتخاب نکنید',
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
