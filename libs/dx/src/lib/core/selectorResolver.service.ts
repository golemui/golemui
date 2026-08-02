import {
  type GslAggregatedSelector,
  type GslLeafSelector,
  type GslSelector,
  type ResolvedSelectors,
} from './dx.domain';
import type { DxCommonFields, DxInternalFields } from './dxBase.types';
import { type ItemTypeRegistry, type ShortcutItemKind } from './itemTypeRegistry';

type DecoratorForMatching = DxInternalFields & DxCommonFields;

// Umbrella selector types match by widget kind, not by exact itemType
// (per spec: "Type selectors match all widgets of a given kind").
//
// `gui.selectors.inputs` (umbrella) fires on every input-kind widget —
// textInputs, textareas, calendars, etc. — while `gui.selectors.calendars`
// (specific) only fires on CALENDAR itemType.
//
// The umbrella names double as the item type of the base batch (e.g. `INPUTS`
// is both an umbrella and the item type of the text, number, and boolean
// shortcuts). Membership comes from the kind declared at registration; an
// item type registered without a kind never matches an umbrella selector.
const KIND_BY_UMBRELLA_SELECTOR: Record<string, ShortcutItemKind> = {
  INPUTS: 'input',
  ACTIONS: 'action',
  DISPLAYS: 'display',
  LAYOUTS: 'layout',
};

export class SelectorResolver {
  constructor(private readonly registry: ItemTypeRegistry) {}

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

  private selectorMatchesItemType(selectorType: string, itemType: string): boolean {
    const umbrellaKind = KIND_BY_UMBRELLA_SELECTOR[selectorType];
    if (umbrellaKind) {
      return this.registry.getItemTypeKind(itemType) === umbrellaKind;
    }
    return selectorType === itemType;
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
    if (!this.selectorMatchesItemType(leaf.selectorType, decorator.itemType ?? '')) return;
    if (!leaf.matcher(decorator)) return;
    out.push(leaf);
  }

  private rollUpSensibleDefaults(
    leafSelectors: GslLeafSelector[],
  ): Record<string, Record<string, any>> {
    // Group leaves by every itemType they apply to.
    // Umbrella leaves contribute to every itemType registered under their kind
    // (per spec: `gui.selectors.inputs({...})` propagates to all input types).
    // Specific leaves contribute only to their own itemType.
    const byType = new Map<string, GslLeafSelector[]>();
    const push = (itemType: string, leaf: GslLeafSelector) => {
      const list = byType.get(itemType) ?? [];
      list.push(leaf);
      byType.set(itemType, list);
    };

    for (const leaf of leafSelectors) {
      const umbrellaKind = KIND_BY_UMBRELLA_SELECTOR[leaf.selectorType];
      if (umbrellaKind) {
        for (const itemType of this.registry.getItemTypesOfKind(umbrellaKind)) {
          push(itemType, leaf);
        }
      } else {
        push(leaf.selectorType, leaf);
      }
    }

    // Delegate rollup to each registered handler — keyed by itemType so
    // widgetMerger's per-decorator lookup (`resolved.sensibleDefaults[itemType]`)
    // finds the right rollup.
    const result: Record<string, Record<string, any>> = {};
    for (const [itemType, leaves] of byType) {
      if (this.registry.hasItemTypeHandler(itemType)) {
        result[itemType] = this.registry
          .getItemTypeHandler(itemType)
          .rollUpSensibleDefaults(leaves);
      }
    }
    return result;
  }
}
