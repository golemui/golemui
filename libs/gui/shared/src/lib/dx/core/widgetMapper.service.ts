import {
  FormWidget,
  FunctionWidgetParams,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import {
  GslItemType,
  MergeResult,
} from './dx.domain';
import { getItemTypeHandler } from './itemTypeRegistry';

export class WidgetMapper {

  mapToWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
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

  mapStaticDef<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    def: Record<string, any>,
    itemType: GslItemType,
  ): NonFunctionWidget<StateKeys, FormData> {
    return getItemTypeHandler(itemType).mapToWidget<StateKeys, FormData>(def);
  }
}

const widgetMapper = new WidgetMapper();
export default widgetMapper;
