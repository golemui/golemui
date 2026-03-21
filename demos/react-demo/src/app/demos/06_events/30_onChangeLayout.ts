import { FormDemoDefinition } from '../../../formRegistry.domain';
import { DemoLogFn } from '../../../../utils/demoLog';
import { _guiTabs, _guiInputs } from '@golemui/gui-shared';

export const onChangeLayoutDemo: FormDemoDefinition = {
  title: '30. onChange — Layout',
  category: 'Ch6: Events',
  description:
    'Events work on layouts too, not just inputs. The tabs layout fires onChange '
    + 'when switching tabs. The callback receives event.detail with the tab index. '
    + 'Watch the Log panel to see the tab switch events.',
  formDef: (log: DemoLogFn) =>
    _guiTabs(
      {
        'Personal': [
          _guiInputs({ firstName: 'string', lastName: 'string' }),
        ],
        'Professional': [
          _guiInputs({ company: 'string', role: 'string' }),
        ],
        'Contact': [
          _guiInputs({ email: 'string', phone: 'string' }),
        ],
      },
      {
        onChange: (event) => {
          log('onChange', 'Switched to tab index:', event.detail);
        },
      },
    ),
  formConfig: () => ({ suppressAutomaticSubmit: true }),
};
