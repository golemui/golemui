import {
  GslAggregatedSelector,
  GslLeafSelector,
  GslSelector,
  ResolvedSelectors,
} from './dx.domain';
import type { WidgetItemDecorator } from '../formDef.domain';
import { InputSensibleDefaultsConfig, GslInputsConfig } from '../shortcuts/inputs/inputs.domain';
import { ActionSensibleDefaultsConfig } from '../shortcuts/actions/actions.domain';
import { LayoutSensibleDefaultsConfig } from '../shortcuts/layouts/layouts.domain';
import { DisplaySensibleDefaultsConfig } from '../shortcuts/display/display.domain';

const BASE_INPUT_SENSIBLE_DEFAULTS: InputSensibleDefaultsConfig = {
  suppressAutomaticLabels: false,
  suppressAutomaticPlaceholders: false,
};

export class SelectorResolver {

  resolve(
    decorator: WidgetItemDecorator,
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

    // Roll up sensible defaults from all matching leaf selectors
    const aggregatedInputSensibleDefaults = this.rollUpInputSensibleDefaults(leafSelectors);
    const aggregatedActionSensibleDefaults: ActionSensibleDefaultsConfig = {};
    const aggregatedLayoutSensibleDefaults: LayoutSensibleDefaultsConfig = {};
    const aggregatedDisplaySensibleDefaults: DisplaySensibleDefaultsConfig = {};

    return {
      leafSelectors,
      aggregatedInputSensibleDefaults,
      aggregatedActionSensibleDefaults,
      aggregatedLayoutSensibleDefaults,
      aggregatedDisplaySensibleDefaults,
    };
  }

  private collectFromAggregated(
    agg: GslAggregatedSelector,
    decorator: WidgetItemDecorator,
    out: GslLeafSelector[],
  ): void {
    if (!agg.matcher(decorator)) return;

    for (const child of agg.children) {
      this.collectFromLeaf(child, decorator, out);
    }
  }

  private collectFromLeaf(
    leaf: GslLeafSelector,
    decorator: WidgetItemDecorator,
    out: GslLeafSelector[],
  ): void {
    if (leaf.selectorType !== decorator.itemType) return;
    if (!leaf.matcher(decorator)) return;
    out.push(leaf);
  }

  private rollUpInputSensibleDefaults(
    leafSelectors: GslLeafSelector[],
  ): InputSensibleDefaultsConfig {
    let result: InputSensibleDefaultsConfig = { ...BASE_INPUT_SENSIBLE_DEFAULTS };

    for (const leaf of leafSelectors) {
      if (leaf.selectorType === 'INPUTS') {
        const cfg = leaf.config as GslInputsConfig;
        if (cfg.suppressAutomaticLabels != null) {
          result = { ...result, suppressAutomaticLabels: cfg.suppressAutomaticLabels };
        }
        if (cfg.suppressAutomaticPlaceholders != null) {
          result = { ...result, suppressAutomaticPlaceholders: cfg.suppressAutomaticPlaceholders };
        }
      }
    }

    return result;
  }
}

const selectorResolver = new SelectorResolver();
export default selectorResolver;
