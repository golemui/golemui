import { FormDemoDefinition } from '../../../formRegistry.domain';
import { DemoLogFn } from '../../../../utils/demoLog';
import { gui } from '@golemui/gui-shared';

export const onChangeLayoutDemo: FormDemoDefinition = {
  title: '30. onChange — Layout',
  category: 'Ch6: Events',
  description:
    'Events work on layouts too, not just inputs. The tabs layout fires onChange ' +
    'when switching tabs. The callback receives event.detail with the tab index. ' +
    'Watch the Log panel to see the tab switch events.',
  formDef: (log: DemoLogFn) =>
    gui.layouts.tabs(
      [
        {
          label: 'Personal',
          children: [gui.inputs.textInput('firstName'), gui.inputs.textInput('lastName')],
        },
        {
          label: 'Professional',
          children: [gui.inputs.textInput('company'), gui.inputs.textInput('role')],
        },
        {
          label: 'Contact',
          children: [gui.inputs.textInput('email'), gui.inputs.textInput('phone')],
        },
      ],
      {
        onChange: (event) => {
          log('onChange', 'Switched to tab index:', event.detail);
        },
      },
    ),
  formConfig: () => ({ suppressAutomaticSubmit: true }),
};
