import { FunctionWidgetParams } from '@golemui/core';
import {
  GslRootDefaults,
  GuiItemTypes,
  MergeResult,
  RuntimeFunction,
  ValidGuiShortcut,
} from './dx.domain';
import { ActionDecorator } from '../shortcuts/actions/actions.domain';
import { getItemTypeHandler } from './itemTypeRegistry';

type OnClickRegistry = Map<string, (data: any) => void>;

export class ActionOnClickService {
  private actionCounter = 0;

  resetCounter(): void {
    this.actionCounter = 0;
  }

  extractOnClickFromMergeResult(
    mergeResult: MergeResult,
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
  ): MergeResult {
    if (mergeResult.kind === 'dynamic') {
      const originalFn = mergeResult.fn;
      const wrappedFn: RuntimeFunction = (params: FunctionWidgetParams<any>) => {
        const result = originalFn(params) as ActionDecorator & Record<string, any>;
        return this.wireOnClick(result, onClickRegistry, rootDefaults);
      };
      return { kind: 'dynamic', fn: wrappedFn };
    }

    const actionDef = mergeResult.def as ActionDecorator & Record<string, any>;
    const wired = this.wireOnClick(actionDef, onClickRegistry, rootDefaults);
    return { kind: 'static', def: wired as ActionDecorator };
  }

  countSubmitButtons(defs: ValidGuiShortcut[]): number {
    let count = 0;
    for (const def of defs) {
      if (def.type !== 'ITEMS') continue;
      const handler = getItemTypeHandler(def.itemType);

      for (const item of def.items) {
        const children = handler.getChildren?.(item);
        if (children) {
          count += this.countSubmitButtons(children);
        }

        if (def.itemType === GuiItemTypes.ACTIONS) {
          if (typeof item === 'function') continue;
          const action = item as ActionDecorator;
          if (action.uid === '#submit' || action.onClick === 'submit') {
            count++;
          }
        }
      }
    }
    return count;
  }

  private wireOnClick(
    actionDef: ActionDecorator & Record<string, any>,
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
  ): Record<string, any> {
    // onClick: 'submit' promotes the button to #submit
    const isSubmit = actionDef.uid === '#submit' || actionDef.onClick === 'submit';
    const actionId = isSubmit ? '#submit' : `action_${this.actionCounter++}`;
    const eventName = isSubmit ? 'submit' : actionId;

    // Resolve the effective onClick callback:
    //   explicit function > rootDefaults.onSubmit (for #submit only) > none
    //   onClick: 'submit' is not a callback — it's a marker, so skip it
    const rawOnClick = actionDef.onClick;
    const explicitCallback = typeof rawOnClick === 'function' ? rawOnClick : undefined;
    const effectiveOnClick = explicitCallback
      ?? (isSubmit ? rootDefaults.onSubmit : undefined);

    if (effectiveOnClick) {
      onClickRegistry.set(eventName, effectiveOnClick);
      const { onClick: _, ...rest } = actionDef;
      return { ...rest, uid: actionId, on: { click: eventName } };
    }

    if (isSubmit) {
      const { onClick: _, ...rest } = actionDef;
      return { ...rest, uid: actionId, on: { click: 'submit' } };
    }

    return { ...actionDef, uid: actionId };
  }
}

const actionOnClickService = new ActionOnClickService();
export default actionOnClickService;
