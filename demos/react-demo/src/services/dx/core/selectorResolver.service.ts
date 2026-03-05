import {
  GslAggregatedSelector,
  GslLeafSelector,
  GslSelector,
  ResolvedSelectors,
} from './dx.domain';
import type { DxCommonFields, DxInternalFields } from './dxBase.types';
import { getItemTypeHandler, hasItemTypeHandler } from './itemTypeRegistry';

type DecoratorForMatching = DxInternalFields & DxCommonFields;

export class SelectorResolver {

  resolve(
    decorator: DecoratorForMatching,
    allSelectors: GslSelector[],
  ): ResolvedSelectors {

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
    if (leaf.selectorType !== decorator.itemType) return;
    if (!leaf.matcher(decorator)) return;
    out.push(leaf);
  }

  private rollUpSensibleDefaults(
    leafSelectors: GslLeafSelector[],
  ): Record<string, Record<string, any>> {
    // Group leaf selectors by their selectorType
    const byType = new Map<string, GslLeafSelector[]>();
    for (const leaf of leafSelectors) {
      const list = byType.get(leaf.selectorType) ?? [];
      list.push(leaf);
      byType.set(leaf.selectorType, list);
    }

    // Delegate rollup to each registered handler
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
