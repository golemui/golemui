import {
  type GslAggregatedSelector,
  type GslLeafSelector,
  type GslSelector,
  type ResolvedSelectors,
} from './dx.domain';
import type { DxCommonFields, DxInternalFields } from './dxBase.types';
import { getItemTypeHandler, hasItemTypeHandler } from './itemTypeRegistry';

type DecoratorForMatching = DxInternalFields & DxCommonFields;

// Umbrella selector types match by widget kind, not by exact itemType
// (per spec: "Type selectors match all widgets of a given kind").
//
// `gui.selectors.inputs` (umbrella) fires on every input-kind widget —
// textInputs, textareas, calendars, etc. — while `gui.selectors.calendars`
// (specific) only fires on CALENDAR itemType.
//
// When a new itemType is added, list it under its kind here.
const UMBRELLA_ITEMTYPES: Record<string, ReadonlySet<string>> = {
  INPUTS: new Set([
    'INPUTS',
    'TEXTAREA',
    'PASSWORD',
    'SELECT',
    'DROPDOWN',
    'RADIOGROUP',
    'CHECKBOX',
    'CALENDAR',
    'DATE_TIME_CALENDAR',
    'DATE_TIME_PICKER',
    'DATE_INPUT',
    'DATE_PICKER',
    'RANGE_CALENDAR',
    'RANGE_DATE_INPUT',
    'RANGE_TIME_INPUT',
    'RANGE_DATE_PICKER',
    'TIME_INPUT',
    'TIME_PICKER',
    'DATE_TIME_INPUT',
    'CURRENCY',
    'MARKDOWN',
    'LIST',
    'CUSTOM_INPUT',
    'REPEATER',
    'TAGS',
  ]),
  ACTIONS: new Set(['ACTIONS', 'CUSTOM_ACTION']),
  DISPLAYS: new Set(['DISPLAYS', 'ALERTS', 'MARKDOWN_TEXTS', 'CUSTOM_DISPLAY']),
  LAYOUTS: new Set(['LAYOUTS', 'TABS', 'ACCORDION', 'CUSTOM_LAYOUT']),
};

function selectorMatchesItemType(selectorType: string, itemType: string): boolean {
  const umbrella = UMBRELLA_ITEMTYPES[selectorType];
  return umbrella ? umbrella.has(itemType) : selectorType === itemType;
}

export class SelectorResolver {
  resolve(decorator: DecoratorForMatching, allSelectors: GslSelector[]): ResolvedSelectors {
    const leafSelectors: GslLeafSelector[] = [];

    for (const sel of allSelectors) {
      if (sel.kind === 'aggregated') {
        this.collectFromAggregated(sel, decorator, leafSelectors);
      } else {
        this.collectFromLeaf(sel, decorator, leafSelectors);
      }
    }

    // Roll up sensible defaults via registered handlers
    const sensibleDefaults = this.rollUpSensibleDefaults(leafSelectors);

    return {
      leafSelectors,
      sensibleDefaults,
    };
  }

  private collectFromAggregated(
    agg: GslAggregatedSelector,
    decorator: DecoratorForMatching,
    out: GslLeafSelector[],
  ): void {
    if (!agg.matcher(decorator)) return;

    for (const child of agg.children) {
      this.collectFromLeaf(child, decorator, out);
    }
  }

  private collectFromLeaf(
    leaf: GslLeafSelector,
    decorator: DecoratorForMatching,
    out: GslLeafSelector[],
  ): void {
    if (!selectorMatchesItemType(leaf.selectorType, decorator.itemType ?? '')) return;
    if (!leaf.matcher(decorator)) return;
    out.push(leaf);
  }

  private rollUpSensibleDefaults(
    leafSelectors: GslLeafSelector[],
  ): Record<string, Record<string, any>> {
    // Group leaves by every itemType they apply to.
    // Umbrella leaves contribute to every itemType in their kind set
    // (per spec: `gui.selectors.inputs({...})` propagates to all input types).
    // Specific leaves contribute only to their own itemType.
    const byType = new Map<string, GslLeafSelector[]>();
    const push = (itemType: string, leaf: GslLeafSelector) => {
      const list = byType.get(itemType) ?? [];
      list.push(leaf);
      byType.set(itemType, list);
    };

    for (const leaf of leafSelectors) {
      const umbrella = UMBRELLA_ITEMTYPES[leaf.selectorType];
      if (umbrella) {
        for (const itemType of umbrella) push(itemType, leaf);
      } else {
        push(leaf.selectorType, leaf);
      }
    }

    // Delegate rollup to each registered handler — keyed by itemType so
    // widgetMerger's per-decorator lookup (`resolved.sensibleDefaults[itemType]`)
    // finds the right rollup.
    const result: Record<string, Record<string, any>> = {};
    for (const [itemType, leaves] of byType) {
      if (hasItemTypeHandler(itemType)) {
        result[itemType] = getItemTypeHandler(itemType).rollUpSensibleDefaults(leaves);
      }
    }
    return result;
  }
}

const selectorResolver = new SelectorResolver();
export default selectorResolver;
