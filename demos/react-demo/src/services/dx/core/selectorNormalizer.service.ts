import {
  GslLeafSelector,
  GslRootDefaults,
  GslSelector,
  GslSelectorsInput,
} from './dx.domain';

export class SelectorNormalizer {

  normalizeSelectors(input: GslSelectorsInput): GslSelector[] {
    const items = Array.isArray(input) ? input : [input];

    const gslSelectors: GslSelector[] = [];
    const bareLeafSelectors: GslLeafSelector[] = [];

    for (const item of items) {
      if (item.kind === 'leaf') {
        bareLeafSelectors.push(item);
      } else {
        gslSelectors.push(item);
      }
    }

    if (bareLeafSelectors.length > 0) {
      gslSelectors.unshift({
        kind: 'aggregated',
        matcher: () => true,
        children: bareLeafSelectors,
      });
    }

    return gslSelectors;
  }

  extractRootDefaults(selectors: GslSelector[]): GslRootDefaults {
    let defaults: GslRootDefaults = {
      suppressAutomaticStack: false,
      suppressAutomaticSubmit: false,
      onSubmit: (data: any) => console.log('Form submitted:', data),
    };
    for (const sel of selectors) {
      if (sel.kind === 'aggregated' && sel.rootDefaults) {
        defaults = { ...defaults, ...sel.rootDefaults };
      }
    }
    return defaults;
  }
}

const selectorNormalizer = new SelectorNormalizer();
export default selectorNormalizer;
