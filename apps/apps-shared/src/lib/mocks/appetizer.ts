import type { FunctionWidgetParams } from '@golemui/core';
import type { DxDefinitions } from '@golemui/gui-shared';
import { gui } from '@golemui/gui-shared';
import type { Resource } from 'i18next';

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

const data: Record<string, unknown> = {};

const formDef: DxDefinitions = [
  gui.inputs.dropdown('language', {
    uid: 'language',
    label: { key: 'travelPlanner.field.language.label', default: 'Language' },
    size: 2,
    defaultValue: 'en',
    height: 300,
    placeholder: {
      key: 'travelPlanner.field.language.placeholder',
      default: 'Select language',
    } as unknown as string,
    labelField: 'label',
    valueField: 'id',
    items: [
      { id: 'en', label: 'English' },
      { id: 'es', label: 'Español' },
      { id: 'fa', label: 'فارسی' },
      { id: 'ja', label: '日本語' },
    ],
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
    onChange: 'onSelectLanguage',
  }),

  gui.layouts.grid(
    [
      gui.inputs.dropdown('departureCountry', {
        uid: 'departureCountry',
        label: {
          key: 'travelPlanner.field.departureCountry.label',
          default: 'Departure Country',
        },
        size: 2,
        height: 300,
        itemHeight: 60,
        itemRenderer: 'countryItemRenderer',
        placeholder: {
          key: 'travelPlanner.field.departureCountry.placeholder',
          default: 'Select a Country',
        } as unknown as string,
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
        onChange: 'fieldChange',
      }),
      gui.inputs.currency('budget', {
        label: {
          key: 'travelPlanner.field.budget.label',
          default: 'Travel Budget',
        },
        step: 100,
        placeholder: ((d: FunctionWidgetParams<any> | undefined) =>
          coins[d?.$form?.departureCountry ?? 'US']) as unknown as string,
        currency: ((d: FunctionWidgetParams<any> | undefined) =>
          coins[d?.$form?.departureCountry ?? 'US']) as unknown as string,
        validator: {
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
        onChange: 'fieldChange',
      }),
    ],
    { direction: 'row', autoFit: true, align: 'stretch' },
  ),

  gui.layouts.grid(
    [
      gui.inputs.numberInput('passengers', {
        defaultValue: 1,
        size: 1,
        label: {
          key: 'travelPlanner.field.passengers.label',
          default: 'Passengers',
        },
        minimum: 1,
        maximum: 10,
        validator: {
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
      }),
      gui.inputs.numberInput('pets', {
        defaultValue: 1,
        size: 1,
        label: {
          key: 'travelPlanner.field.pets.label',
          default: 'Pets',
        },
        minimum: 1,
        maximum: 3,
        validator: {
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
      }),
    ],
    { direction: 'row', autoFit: true, align: 'end' },
  ),

  gui.layouts.flex(
    [
      gui.inputs.booleanInput('includePets', {
        size: 3,
        label: {
          key: 'travelPlanner.field.includePets',
          default: 'Include Pets',
        },
        onChange: 'fieldChange',
      }),
    ],
    { direction: 'column', align: 'end', justify: 'end' },
  ),

  gui.inputs.rangeCalendar('preferredDates', {
    label: {
      key: 'travelPlanner.field.preferredDates.label',
      default: 'Select Preferred Dates',
    },
    size: 3,
    minDate,
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    prevMonthAriaLabel: {
      key: 'travelPlanner.field.preferredDates.prevMonthAriaLabel',
      default: 'Previous Month',
    } as unknown as string,
    nextMonthAriaLabel: {
      key: 'travelPlanner.field.preferredDates.nextMonthAriaLabel',
      default: 'Next Month',
    } as unknown as string,
    validator: {
      required: true,
      minItems: 1,
      maxItems: 3,
      messages: {
        required: {
          key: 'travelPlanner.field.preferredDates.required',
          default: 'Preferred dates are required',
        },
        invalid: {
          key: 'travelPlanner.field.preferredDates.required',
          default: 'Preferred dates are required',
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
    onChange: 'fieldChange',
  }),

  gui.actions.button({
    uid: 'btn-submit',
    label: {
      key: 'travelPlanner.btn.submit',
      default: 'Search My Trip',
    },
    onClick: () => 'handleSubmit',
  }),
];

/**
 * i18next Resource Bundle
 */

const resources: Resource = {
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
            required: 'Preferred dates are required',
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
            invalid: 'Los pasajeros son obligatorios y deben ser entre 1 y 10',
            minimum: 'Debe haber al menos 1 pasajero',
            maximum: 'Debe haber como máximo 10 pasajeros',
          },
          pets: {
            label: 'Mascotas',
            invalid: 'Las mascotas son obligatorias y deben ser entre 1 y 3',
            minimum: 'Debe haber al menos 1 mascota',
            maximum: 'Debe haber como máximo 3 mascotas',
          },
          includePets: 'Incluir mascotas',
          preferredDates: {
            label: 'Seleccionar fechas preferidas',
            nextMonthAriaLabel: 'Mes siguiente',
            prevMonthAriaLabel: 'Mes anterior',
            required: 'Las fechas preferidas son obligatorias',
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
            required: '希望日が必要です',
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
            invalid: 'تعداد حیوانات خانگی الزامی است و باید بین ۱ تا ۳ باشد',
            minimum: 'تعداد حیوانات خانگی باید حداقل ۱ باشد',
            maximum: 'تعداد حیوانات خانگی حداکثر ۳ می‌تواند باشد',
          },
          includePets: 'همراه با حیوان خانگی',
          preferredDates: {
            label: 'انتخاب تاریخ‌های مورد نظر',
            nextMonthAriaLabel: 'ماه بعد',
            prevMonthAriaLabel: 'ماه قبل',
            required: 'تاریخ‌های مورد نظر الزامی است',
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

export const appetizer = {
  data,
  formDef,
  resources,
};
