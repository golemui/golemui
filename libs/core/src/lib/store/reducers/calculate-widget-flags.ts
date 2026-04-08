import {
  FormWidget,
  InputWidget,
  isActionWidget,
  isFunctionWidget,
  isInputWidget,
  LayoutWidget,
  NonFunctionWidget,
} from '../../form-widget';
import { flattenForm } from '../../utils/form';
import { expressionIsTrue } from '../../utils/justin';
import { get } from '../../utils/object';
import {
  makeRepeaterItemConfig,
  toRepeaterItemUid,
  transformRepeaterItemWhenExpression,
} from '../../utils/repeater';
import { State } from '../model';
import { hasWhen } from './utils';

export const calculateWidgetFlags = (state: State): State => {
  return {
    ...state,
    widgetFlags: {
      ...calculateFlags(state),
      ...calculateRepeaterFlags(state),
    },
  };
};

function calculateFlags(state: State): State['widgetFlags'] {
  return (
    Object.values(state.flatForm)
      // TODO: use filterMap
      // Filters repeater items, because we process them already in calculateRepeaterFlags
      .filter((widget) => !widget.uid?.includes('['))
      .map((widget) => {
        if (isFunctionWidget(widget)) {
          const widget_ = widget({
            $form: state.data,
            errors: undefined,
            touched: undefined,
            translate: undefined,
          });
          widget_.uid = widget.uid!;
          return widget_;
        }
        return widget;
      })
      .filter((widget) => {
        if (widget.include && ('in' in widget.include || 'when' in widget.include)) {
          return true;
        }
        if (widget.exclude && ('from' in widget.exclude || 'when' in widget.exclude)) {
          return true;
        }
        if ((isInputWidget(widget) || isActionWidget(widget)) && hasWhen(widget.disabled)) {
          return true;
        }
        if (isInputWidget(widget) && hasWhen(widget.readonly)) {
          return true;
        }
        return false;
      })
      .reduce(
        (flags, widget) => {
          flags[widget.uid] = flags[widget.uid] || {};

          // show
          if (widget.include && 'in' in widget.include) {
            flags[widget.uid].hidden = !widget.include.in.some((widgetState) =>
              state.currentStates.includes(widgetState),
            );
          } else if (widget.include && 'when' in widget.include) {
            flags[widget.uid].hidden = !expressionIsTrue(
              widget.include.when,
              state.data,
              state.meta,
            );
          }

          // hide
          if (widget.exclude && 'from' in widget.exclude) {
            flags[widget.uid].hidden = widget.exclude.from.some((widgetState) =>
              state.currentStates.includes(widgetState),
            );
          } else if (widget.exclude && 'when' in widget.exclude) {
            flags[widget.uid].hidden = expressionIsTrue(
              widget.exclude.when,
              state.data,
              state.meta,
            );
          }

          // TODO: We have to document that (disabled|readonly).when is NOT compatible with states e.g. `{'disabled.register': {when: '...'}}`
          //       It's either boolean, states + boolean or when.

          // disabled
          if (isInputWidget(widget) || isActionWidget(widget)) {
            if (hasWhen(widget.disabled)) {
              flags[widget.uid].disabled = expressionIsTrue(
                (widget.disabled as { when: string }).when,
                state.data,
                state.meta,
              );
            }
          }

          // readonly
          if (isInputWidget(widget) && hasWhen(widget.readonly)) {
            flags[widget.uid].readonly = expressionIsTrue(
              (widget.readonly as { when: string }).when,
              state.data,
              state.meta,
            );
          }

          return flags;
        },
        {} as State['widgetFlags'],
      )
  );
}

// -----------------------
//
// Repeater flags
//
// -----------------------

// TODO: this is Golem specific. We should either move this to a middleware or make the repeater contract part of the core
function calculateRepeaterFlags(state: State): State['widgetFlags'] {
  // TODO: should we collect the active repeater templates on addWidget so we don't have to iterate so much?
  return Object.values(state.flatForm)
    .filter((w): w is NonFunctionWidget<string> => !isFunctionWidget(w) && w.type === 'repeater')
    .reduce(
      (flags, repeater) => ({
        ...flags,
        ...expandRepeaterFlags(state, repeater as RepeaterContract, []),
      }),
      {} as State['widgetFlags'],
    );
}

type RepeaterContract = InputWidget<string> & {
  type: 'repeater';
  props: {
    template: LayoutWidget<string>;
  };
};

function expandRepeaterFlags(
  state: State,
  repeaterWidget: RepeaterContract,
  outerIndexes: number[],
): State['widgetFlags'] {
  const template = repeaterWidget.props.template;
  const arrayData = get(state.data, (repeaterWidget as any).path as string);
  if (!Array.isArray(arrayData)) {
    return {};
  }

  const flags: State['widgetFlags'] = {};

  arrayData.forEach((_, i) => {
    const currentIndexes = [...outerIndexes, i];

    flattenForm([template as FormWidget<never>]).forEach((widget) => {
      let resolved: NonFunctionWidget<string>;
      // TODO: repeater items are not decoded, so they dont have uid, type or kind!!!
      if (isFunctionWidget(widget)) {
        resolved = widget({
          $form: state.data,
          errors: undefined,
          touched: undefined,
          translate: undefined,
        });
        resolved.uid = widget.uid as string;
      } else {
        resolved = widget as NonFunctionWidget<string>;
      }

      if (resolved.type === 'repeater') {
        const indexedNestedRepeater = makeRepeaterItemConfig(
          resolved,
          currentIndexes,
        ) as RepeaterContract;
        // recurse and mutate flags
        Object.assign(flags, expandRepeaterFlags(state, indexedNestedRepeater, currentIndexes));
        return;
      }

      const uid = toRepeaterItemUid(resolved.uid, currentIndexes);
      flags[uid] = flags[uid] || {};

      // TODO: this is partially duplicating the logic in calculateFlags(). Is it worth abstracting?

      // show
      if (resolved.include && 'in' in resolved.include) {
        flags[uid].hidden = !resolved.include.in.some((s) => state.currentStates.includes(s));
      } else if (resolved.include && 'when' in resolved.include) {
        flags[uid].hidden = !expressionIsTrue(
          transformRepeaterItemWhenExpression(resolved.include.when, currentIndexes),
          state.data,
          state.meta,
        );
      }

      // hide
      if (resolved.exclude && 'from' in resolved.exclude) {
        flags[uid].hidden = resolved.exclude.from.some((s) => state.currentStates.includes(s));
      } else if (resolved.exclude && 'when' in resolved.exclude) {
        flags[uid].hidden = expressionIsTrue(
          transformRepeaterItemWhenExpression(resolved.exclude.when, currentIndexes),
          state.data,
          state.meta,
        );
      }

      // disabled
      if ((isInputWidget(resolved) || isActionWidget(resolved)) && hasWhen(resolved.disabled)) {
        flags[uid].disabled = expressionIsTrue(
          transformRepeaterItemWhenExpression(
            (resolved.disabled as { when: string }).when,
            currentIndexes,
          ),
          state.data,
          state.meta,
        );
      }

      // readonly
      if (isInputWidget(resolved) && hasWhen(resolved.readonly)) {
        flags[uid].readonly = expressionIsTrue(
          transformRepeaterItemWhenExpression(
            (resolved.readonly as { when: string }).when,
            currentIndexes,
          ),
          state.data,
          state.meta,
        );
      }
    });
  });

  return flags;
}
