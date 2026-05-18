import { type FormWidget, type FunctionWidgetParams, type NonFunctionWidget, type UiState } from '@golemui/core';
import { type GslItemType, type MergeResult } from './dx.domain';
import { getItemTypeHandler } from './itemTypeRegistry';

export class WidgetMapper {
  mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    mergeResult: MergeResult,
    itemType: GslItemType,
  ): FormWidget<StateKeys, FormData> {
    if (mergeResult.kind === 'dynamic') {
      const fn = mergeResult.fn;
      return ((params: FunctionWidgetParams<FormData>) => {
        const runtimeDef = fn(params);
        return this.mapStaticDef<StateKeys, FormData>(runtimeDef, itemType);
      }) as FormWidget<StateKeys, FormData>;
    }

    return this.mapStaticDef<StateKeys, FormData>(mergeResult.def, itemType);
  }

  mapStaticDef<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    def: Record<string, any>,
    itemType: GslItemType,
  ): NonFunctionWidget<StateKeys, FormData> {
    const widget = getItemTypeHandler(itemType).mapToWidget<StateKeys, FormData>(def);
    return this.applyBaseWidgetFields(widget, def);
  }

  /**
   * Injects BaseWidget-level fields that all widget types share.
   * Centralized here so individual mappers don't need to repeat the pattern.
   */
  private applyBaseWidgetFields<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    widget: NonFunctionWidget<StateKeys, FormData>,
    def: Record<string, any>,
  ): NonFunctionWidget<StateKeys, FormData> {
    if (def['size'] != null) {
      (widget as any).size = def['size'];
    }
    if (def['defaultValue'] != null && (widget as any).kind === 'input') {
      (widget as any).defaultValue = def['defaultValue'];
    }
    if (def['on'] != null) {
      (widget as any).on = def['on'];
    }
    if (def['include'] != null) {
      (widget as any).include = def['include'];
    }
    if (def['exclude'] != null) {
      (widget as any).exclude = def['exclude'];
    }
    return widget;
  }
}

const widgetMapper = new WidgetMapper();
export default widgetMapper;
