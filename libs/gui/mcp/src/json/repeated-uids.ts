import { collectWidgetUids } from '@golemui/core/internals';
import type { FormattedError } from './errors';

type WidgetUidEntry = ReturnType<typeof collectWidgetUids>[number];

/**
 * Finds the widgets whose uid an earlier widget of the same repeater depth already has. The form
 * keeps the widgets of one depth in one map: depth 0 is everything outside repeater templates,
 * depth 1 is every template of a top-level repeater, and so on. The uids and the depths come from
 * `collectWidgetUids` of `@golemui/core`.
 *
 * @param formDefinition - The JSON form definition, `{ form: [...] }`.
 * @returns One `duplicateUid` error for each widget whose uid repeats, on that widget.
 */
export function findRepeatedUids(formDefinition: unknown): FormattedError[] {
  const errors: FormattedError[] = [];
  const firstWidgets = new Map<string, WidgetUidEntry>();
  for (const widget of collectWidgetUids(formDefinition)) {
    // A depth has no colon, so the key names one depth and one uid.
    const depthAndUid = `${widget.repeaterDepth}:${widget.uid}`;
    const firstWidget = firstWidgets.get(depthAndUid);
    if (firstWidget === undefined) {
      firstWidgets.set(depthAndUid, widget);
    } else {
      errors.push(repeatedUidError(widget, firstWidget));
    }
  }
  return errors;
}

function repeatedUidError(widget: WidgetUidEntry, firstWidget: WidgetUidEntry): FormattedError {
  const uidOrigin =
    widget.origin === 'derived'
      ? ' (this input has no `uid`, so the form derives it from `path` and `type`)'
      : widget.origin === 'position'
        ? ' (this widget has no `uid`, so the form derives it from its position)'
        : '';
  const firstOwner =
    firstWidget.origin === 'formRoot'
      ? 'the root layout that the form creates around the `form` array'
      : `the widget at \`${firstWidget.pointer}\``;
  const effect =
    widget.repeaterDepth === 0
      ? 'The form reports error code 21 when it starts.'
      : 'In each row, one widget replaces the other, with no message.';
  return {
    path: widget.pointer,
    keyword: 'duplicateUid',
    message: `The uid \`${widget.uid}\`${uidOrigin} is already the uid of ${firstOwner}. ${effect}`,
    suggestion:
      firstWidget.origin === 'formRoot'
        ? 'Give this widget another `uid`.'
        : 'Give one of the two widgets another `uid`.',
    params: { uid: widget.uid, firstWidgetPath: firstWidget.pointer },
  };
}
