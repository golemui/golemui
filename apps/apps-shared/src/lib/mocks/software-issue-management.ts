import { type Form } from '@golemui/core';
import { type Example } from './types';
import softwareIssueManagementForm from './software-issue-management.form.json';

const data = {
  projects: [
    {
      name: 'GolemUI',
      deliveryDate: '2026-06-30',
      budget: 100000,
      description:
        '**GolemUI The Declarative Form Engine:**\n\nThe New Paradigm for building forms. Stop coding UI-coupled forms and start defining semantic, serializable schemas.',
    },
  ],
  developers: [
    { name: 'John Doe', position: 'pm', holidays: [{ start: '2026-05-29' }] },
    {
      name: 'Jane Smith',
      position: 'ui_ux',
      holidays: [{ start: '2026-05-29', end: '2026-06-01' }],
    },
    { name: 'Alice Johnson', position: 'frontend', holidays: [] },
    {
      name: 'Bob Brown',
      position: 'backend',
      holidays: [
        { start: '2026-07-01', end: '2026-07-15' },
        { start: '2026-12-20', end: '2026-12-31' },
      ],
    },
    { name: 'Charlie Davis', position: 'fullstack', holidays: [] },
    { name: 'David Wilson', position: 'devops', holidays: [] },
  ],
  issues: [
    {
      name: 'Add new toggle component',
      type: 'feature',
      projectId: 'GolemUI',
      assigneeId: 'John Doe',
      estDelivery: '2026-06-30',
      highPriority: false,
    },
    {
      name: 'Use custom font',
      type: 'improvement',
      projectId: 'GolemUI',
      assigneeId: 'Jane Smith',
      estDelivery: '2026-06-30',
      highPriority: false,
    },
    {
      name: 'Fix rendering issue in small screens',
      type: 'bug',
      projectId: 'GolemUI',
      assigneeId: 'Alice Johnson',
      estDelivery: '2026-06-30',
      highPriority: true,
    },
    {
      name: 'Add reactive functions docs',
      type: 'documentation',
      projectId: 'GolemUI',
      assigneeId: 'Bob Brown',
      estDelivery: '2026-06-30',
      highPriority: false,
    },
    {
      name: 'Add tests to Astro components',
      type: 'test',
      projectId: 'GolemUI',
      assigneeId: 'Charlie Davis',
      estDelivery: '2026-06-30',
      highPriority: false,
    },
    {
      name: 'Deploy website',
      type: 'chore',
      projectId: 'GolemUI',
      assigneeId: 'David Wilson',
      estDelivery: '2026-06-30',
      highPriority: false,
    },
  ],
};

// TODO: the "Project" and "Assign To" dropdowns of the form have no items. They must list
// `$form.projects` and `$form.developers`, and a form definition has no way yet to give a prop
// an array from the form data.

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
            required: 'Las fechas preferidas son obligatorias, seleccione al menos una fecha',
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
            required: '希望日は必須です。少なくとも1つの日付を選択してください',
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
            required: 'تاریخ‌های مورد نظر الزامی است، حداقل یک تاریخ انتخاب کنید',
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

export const softwareIssueManagement: Example = {
  data,
  form: softwareIssueManagementForm as unknown as Form<string>,
  resources,
};
