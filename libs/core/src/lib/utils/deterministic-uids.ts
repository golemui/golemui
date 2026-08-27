import {
  type FormWidget,
  isFunctionWidget,
  isInputWidget,
  isLayoutWidget,
  type LayoutWidget,
} from '../form-widget';

/**
 * Assigns a position-based uid to every widget in the tree that has none, e.g. '#0.2.t.1'
 * (dot-separated indexes, 't' for a repeater template, a final 'f' for a function widget).
 * The format must never contain '[<digits>]' because repeater item uids append '[index]'
 * and are parsed back with a regex.
 * A function widget's uid is written onto the function object itself, so a function reused
 * across decodes keeps the uid of its first decode.
 *
 * @example
 * const decodedForm = formDefDecoder.parse(rawFormDef);
 * assignDeterministicUids(decodedForm.form); // uid-less widgets now have '#0.x' uids
 */
export function assignDeterministicUids(root: FormWidget<string>): void {
  assignUidByPosition(root, '#0');
}

function assignUidByPosition(widget: FormWidget<string>, positionUid: string): void {
  if (isFunctionWidget(widget)) {
    // The 'f' segment keeps these uids separate from plain position uids: a function reused in a
    // second form keeps its first-decode uid, which must not equal a position uid of that form.
    if (!widget.uid) {
      widget.uid = `${positionUid}.f`;
    }
    return;
  }
  if (!widget.uid) {
    widget.uid = positionUid;
  }
  if (isLayoutWidget(widget)) {
    widget.children.forEach((child, index) => {
      assignUidByPosition(child, `${positionUid}.${index}`);
    });
  }
  if (isInputWidget(widget) && widget.type === 'repeater') {
    const template = (widget.props as Record<string, unknown> | undefined)?.['template'];
    if (template) {
      assignUidByPosition(template as LayoutWidget<string>, `${positionUid}.t`);
    }
  }
}
