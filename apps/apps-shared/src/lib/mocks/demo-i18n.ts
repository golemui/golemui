import { Form } from '@golemui/core';
import { Example } from './types';

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false,
    notes: '',
  },
};

/**
 * i18next Resource Bundle
 */
const resources = {
  // English
  en: {
    translation: {
      travelPlanner: {
        field: {
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
  form: async () => {
    const baseUrl = new URL('/assets/mocks/demo-i18n.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
