import { defineForm } from '@golemui/core';

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false, // Toggles the UI state
    notes: '',
  },
};

const form = defineForm({
  states: {
    remote: '$form.details.isRemote === true',
  },
  form: [
    {
      uid: 'renderer-',
      kind: 'display',
      widget: 'renderer',
      props: {
        render: (api) => {
          console.log('render', api);
          return <h1>JAJA</h1>;
        },
      },
    },
    // 1. Dynamic Heading based on state
    {
      uid: 'header-1',
      kind: 'display',
      widget: 'heading',
      props: {
        text: {
          key: 'consultation.header.onsite',
        },
        'text.remote': {
          key: 'consultation.header.remote',
        },
      },
    },

    // 2. Mode Toggle (The State Switcher)
    {
      uid: 'toggle-mode',
      kind: 'control',
      widget: 'toggle',
      path: 'details.isRemote',
      label: {
        key: 'consultation.mode.label',
        default: 'I prefer a remote Zoom meeting',
      },
    },

    // 3. Client Name Input
    {
      uid: 'input-name',
      kind: 'control',
      widget: 'textinput',
      path: 'details.clientName',
      label: {
        key: 'consultation.field.name',
      },
      props: {
        placeholder: {
          key: 'consultation.placeholder.name',
          default: 'e.g. Jane Doe',
        },
      },
      validator: { type: 'string', required: true, minLength: 2 },
    },

    // 4. Calendar Control (The Requested Widget)
    {
      uid: 'input-date',
      kind: 'control',
      widget: 'calendar',
      path: 'details.date',
      label: {
        key: 'consultation.field.date',
        default: 'Select a Date',
      },
      props: {
        icon: 'material-icons material-icons-calendar_month',
        prevMonthIcon: 'material-icons material-icons-chevron_left',
        nextMonthIcon: 'material-icons material-icons-chevron_right',
      },
      validator: { type: 'string', required: true, format: 'date-time' },
    },

    // 5. Dynamic Info Alert (Changes content based on context)
    {
      uid: 'info-location',
      kind: 'display',
      widget: 'alert',
      props: {
        text: {
          key: 'consultation.info.onsite',
          default: 'Please arrive at our Main St. office 10 minutes early.',
        },
        level: 'info',
        'text.remote': {
          key: 'consultation.info.remote',
          default: 'A Zoom link will be sent to your email upon confirmation.',
        },
        'level.remote': 'warning',
      },
    },

    // 6. Conditional Currency (Only for on-site deposits)
    {
      uid: 'input-deposit',
      kind: 'control',
      widget: 'currency',
      path: 'depositAmount',
      label: {
        key: 'consultation.field.deposit',
        default: 'Room Reservation Deposit',
      },
      props: {
        currency: 'EUR',
      },
      exclude: { from: ['remote'] },
    },

    // 7. Submit Action
    {
      uid: 'btn-submit',
      kind: 'interactive',
      widget: 'button',
      on: {
        click: 'handleSubmit',
      },
      label: {
        key: 'consultation.btn.submit',
        default: 'Confirm Booking',
      },
      props: {
        title: {
          key: 'consultation.btn.tooltip',
          default: 'Submit booking for {{name}}',
          params: {
            name: '$form.details.clientName',
          },
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
      consultation: {
        header: {
          onsite: 'Book Office Consultation',
          remote: 'Book Online Session',
        },
        mode: {
          label: 'I prefer a remote Zoom meeting',
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

export const translations = {
  data,
  form,
  resources,
};
