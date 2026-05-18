import { type Form } from '@golemui/core';
import { type Example } from './types';

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false, // Toggles the UI state
    notes: '',
  },
};

/**
 * i18next Resource Bundle
 */

const resources = {
  // English (Default)
  en: {
    translation: {
      consultation: {
        header: {
          onsite: 'Book Office Consultation',
          remote: 'Book Online Session',
        },
        mode: {
          label: 'I prefer a remote Zoom meeting',
        },
        system: {
          message: '{{message}}',
        },
        field: {
          name: 'Full Name',
          date: 'Select a Date',
          deposit: 'Room Reservation Deposit',
        },
        placeholder: {
          name: 'e.g. Jane Doe',
        },
        info: {
          onsite: 'Please arrive at our Main St. office 10 minutes early.',
          remote: 'A Zoom link will be sent to your email upon confirmation.',
        },
        btn: {
          submit: 'Confirm Booking',
          tooltip: 'Submit booking for {{name}}',
        },
      },
    },
  },

  // Spanish (Español)
  es: {
    translation: {
      consultation: {
        header: {
          onsite: 'Reserva de Consulta en Oficina',
          remote: 'Reserva de Sesión Online',
        },
        mode: {
          label: 'Prefiero una reunión remota por Zoom',
        },
        system: {
          message: '{{message}}',
        },
        field: {
          name: 'Nombre Completo',
          date: 'Selecciona una Fecha',
          deposit: 'Depósito de Reserva de Sala',
        },
        placeholder: {
          name: 'p.ej. Juan Pérez',
        },
        info: {
          onsite: 'Por favor, llegue a nuestra oficina de Main St. 10 minutos antes.',
          remote: 'Se enviará un enlace de Zoom a su correo tras la confirmación.',
        },
        btn: {
          submit: 'Confirmar Reserva',
          tooltip: 'Enviar reserva para {{name}}',
        },
      },
    },
  },

  // Japanese (日本語)
  ja: {
    translation: {
      consultation: {
        header: {
          onsite: 'オフィスでの相談を予約',
          remote: 'オンラインセッションを予約',
        },
        mode: {
          label: 'Zoomでのリモート会議を希望します',
        },
        system: {
          message: '{{message}}',
        },
        field: {
          name: '氏名',
          date: '日付を選択',
          deposit: '部屋予約のデポジット',
        },
        placeholder: {
          name: '例: 山田 太郎',
        },
        info: {
          onsite: 'メインストリートのオフィスに10分前にお越しください。',
          remote: '確認後、Zoomのリンクがメールで送信されます。',
        },
        btn: {
          submit: '予約を確定する',
          tooltip: '{{name}} 様の予約を送信',
        },
      },
    },
  },

  // Farsi (فارسی) - RTL Language support required in UI
  fa: {
    translation: {
      consultation: {
        header: {
          onsite: 'رزرو وقت ملاقات حضوری',
          remote: 'رزرو جلسه آنلاین',
        },
        mode: {
          label: 'جلسه آنلاین (ریموت) در زوم را ترجیح می‌دهم',
        },
        system: {
          message: '{{message}}',
        },
        field: {
          name: 'نام و نام خانوادگی',
          date: 'انتخاب تاریخ',
          deposit: 'بیعانه رزرو اتاق',
        },
        placeholder: {
          name: 'مثلا: علی علوی',
        },
        info: {
          onsite: 'لطفا ۱۰ دقیقه قبل از وقت تعیین شده در دفتر ما در خیابان اصلی حضور داشته باشید.',
          remote: 'پس از تایید نهایی، لینک زوم به ایمیل شما ارسال می‌شود.',
        },
        btn: {
          submit: 'تایید نهایی رزرو',
          tooltip: 'ثبت رزرو به نام {{name}}',
        },
      },
    },
  },
};

export const translations: Example = {
  data,
  meta: {
    systemMessage: 'System maintenance is scheduled for tomorrow',
    connectionStatus: 'online',
  },
  form: async () => {
    const baseUrl = new URL('/assets/mocks/translations.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
