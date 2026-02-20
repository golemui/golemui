import {
  GslIdSelector,
  GslItemType,
  GslSelector,
  GslScopeSelector,
  GslScopeSelectorType,
  GslWidgetSelector,
  GslWidgetSelectorType,
  ResolvedSelectors,
} from './dx.domain';
import { InputSensibleDefaultsConfig, GslInputsConfig } from '../shortcuts/inputs/inputs.domain';
import { ActionSensibleDefaultsConfig } from '../shortcuts/actions/actions.domain';
import { LayoutSensibleDefaultsConfig } from '../shortcuts/layouts/layouts.domain';

const BASE_INPUT_SENSIBLE_DEFAULTS: InputSensibleDefaultsConfig = {
  suppressAutomaticLabels: false,
  suppressAutomaticPlaceholders: false,
};

export class SelectorResolver {

  resolve(
    itemType: GslItemType,
    itemTags: string[],
    itemUid: string | undefined,
    allSelectors: GslSelector[],
  ): ResolvedSelectors {

    const scopeSelectors = allSelectors.filter(
      (s): s is GslScopeSelector => s.kind === 'scope',
    );
    const idSelectors = allSelectors.filter(
      (s): s is GslIdSelector => s.kind === 'id',
    );

    const widgetSelectorType = this.itemTypeToWidgetSelectorType(itemType);
    const widgetSelectors: GslWidgetSelector[] = [];

    // ROOT selectors first (lowest priority)
    for (const scope of scopeSelectors) {
      if (scope.scopeType === GslScopeSelectorType.ROOT) {
        for (const child of scope.children) {
          if (child.selectorType === widgetSelectorType) {
            widgetSelectors.push(child);
          }
        }
      }
    }

    // TAG selectors next (in array order = increasing priority)
    for (const scope of scopeSelectors) {
      if (scope.scopeType === GslScopeSelectorType.TAG && scope.tag != null && itemTags.includes(scope.tag)) {
        for (const child of scope.children) {
          if (child.selectorType === widgetSelectorType) {
            widgetSelectors.push(child);
          }
        }
      }
    }

    // Matching ID selectors (highest priority among selectors)
    const matchingIdSelectors = itemUid
      ? idSelectors.filter((s) => s.id === itemUid)
      : [];

    // Roll up sensible defaults from all applicable widget selectors
    const aggregatedInputSensibleDefaults = this.rollUpInputSensibleDefaults(widgetSelectors);
    const aggregatedActionSensibleDefaults: ActionSensibleDefaultsConfig = {};
    const aggregatedLayoutSensibleDefaults: LayoutSensibleDefaultsConfig = {};

    return {
      widgetSelectors,
      idSelectors: matchingIdSelectors,
      aggregatedInputSensibleDefaults,
      aggregatedActionSensibleDefaults,
      aggregatedLayoutSensibleDefaults,
    };
  }

  private itemTypeToWidgetSelectorType(itemType: GslItemType): GslWidgetSelectorType | null {
    switch (itemType) {
      case 'INPUTS': return GslWidgetSelectorType.INPUTS;
      case 'ACTIONS': return GslWidgetSelectorType.ACTIONS;
      case 'LAYOUT': return null;
    }
  }

  private rollUpInputSensibleDefaults(
    widgetSelectors: GslWidgetSelector[],
  ): InputSensibleDefaultsConfig {
    let result: InputSensibleDefaultsConfig = { ...BASE_INPUT_SENSIBLE_DEFAULTS };

    for (const ws of widgetSelectors) {
      if (ws.selectorType === GslWidgetSelectorType.INPUTS) {
        const cfg = ws.config as GslInputsConfig;
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
