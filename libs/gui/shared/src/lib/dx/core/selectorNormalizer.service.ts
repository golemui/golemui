import {
  type FormConfig,
  type GslLeafSelector,
  type GslSelector,
  type GslSelectorsInput,
} from './dx.domain';

export class SelectorNormalizer {
  /**
   * Ensures the output is always a uniform GslSelector[] of aggregated selectors.
   *
   * Callers can pass flat leaf selectors (single styling rules) or pre-grouped
   * aggregated selectors. This method separates them into two buckets, then wraps
   * any bare leaves into a catch-all aggregated selector so downstream code only
   * deals with one shape.
   */
  normalizeSelectors(input: GslSelectorsInput): GslSelector[] {
    const items = Array.isArray(input) ? input : [input];

    const gslSelectors: GslSelector[] = [];
    const bareLeafSelectors: GslLeafSelector[] = [];

    // Separate leaves (single rules) from aggregated selectors (grouped rules)
    for (const item of items) {
      if (item.kind === 'leaf') {
        bareLeafSelectors.push(item);
      } else {
        gslSelectors.push(item);
      }
    }

    // Wrap bare leaves in a catch-all aggregated selector (matcher: () => true)
    // and prepend them so they act as lowest-precedence defaults — explicit
    // aggregated selectors that come later will override them during merging.
    if (bareLeafSelectors.length > 0) {
      gslSelectors.unshift({
        kind: 'aggregated',
        matcher: () => true,
        children: bareLeafSelectors,
      });
    }

    return gslSelectors;
  }

  extractFormConfig(): FormConfig {
    return {
      suppressAutomaticStack: false,
      suppressAutomaticSubmit: false,
      onSubmit: (data: any) => console.log('Form submitted:', data),
    };
  }
}

const selectorNormalizer = new SelectorNormalizer();
export default selectorNormalizer;
