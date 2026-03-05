import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _gslTag, _gslInputs } from '../../../services/dx';

export const runtimePromotionDemo: FormDemoDefinition = {
  title: '14. Runtime Promotion',
  category: 'Ch3: Selectors',
  description:
    'The most powerful pattern. A selector\'s decorator callback can return a runtime function instead of a static override. '
    + 'This promotes every matched widget to a FunctionWidget — it re-renders reactively. '
    + 'Three levels: static object → callback on current state → callback returning runtime function.',
  formDef: () =>
    _guiInputs({
      name: 'string',
      email: ['string', 'personalized'],
      age: ['number', 'personalized'],
    }),
  formSelectors: () =>
    _gslTag('personalized', _gslInputs({
      decorator: (cur) => (params) => ({
        placeholder: params?.$form?.name
          ? `${cur.path} for ${params.$form.name}`
          : `Enter ${cur.path}`,
      }),
    })),
};
