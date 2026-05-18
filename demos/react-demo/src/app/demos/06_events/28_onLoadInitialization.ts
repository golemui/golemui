import { type FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

const timezones = [
  { label: 'UTC-8 (Pacific)', value: 'America/Los_Angeles' },
  { label: 'UTC-5 (Eastern)', value: 'America/New_York' },
  { label: 'UTC+0 (London)', value: 'Europe/London' },
  { label: 'UTC+1 (Paris)', value: 'Europe/Paris' },
  { label: 'UTC+9 (Tokyo)', value: 'Asia/Tokyo' },
];

export const onLoadInitializationDemo: FormDemoDefinition = {
  title: '28. onLoad — Initialization',
  category: 'Ch6: Events',
  description:
    'The timezone select starts empty and populates when the form loads. ' +
    'The onLoad callback simulates fetching options from an external source ' +
    'and uses event.update to populate them on mount.',
  formDef: () => [
    gui.inputs.textInput('username'),
    gui.inputs.select('timezone', {
      label: 'Timezone',
      options: [],
      onLoad: (event) => {
        event.update({ path: 'timezone', options: timezones });
      },
    }),
  ],
  formConfig: () => ({ suppressAutomaticSubmit: true }),
};
