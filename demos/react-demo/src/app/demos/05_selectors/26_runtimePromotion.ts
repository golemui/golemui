import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const runtimePromotionDemo: FormDemoDefinition = {
  title: '26. Runtime Promotion',
  category: 'Ch5: Selectors',
  description:
    "The most powerful pattern. A selector's decorator callback can return a runtime function instead of a static override. " +
    'This promotes every matched widget to a FunctionWidget — it re-renders reactively. ' +
    'Three levels: static object → callback on current state → callback returning runtime function.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.textInput('email', {}, ['personalized']),
    gui.inputs.numberInput('age', {}, ['personalized']),
  ],
  formSelectors: () => [
    gui.selectors.tag('personalized').inputs({
      override: (cur) => (params) => ({
        placeholder: params?.$form?.name
          ? `${cur.path} for ${params.$form.name}`
          : `Enter ${cur.path}`,
      }),
    }),
  ],
};
