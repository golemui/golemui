import {
  type FormWidget,
  isFunctionWidget,
  isInputWidget,
  isLayoutWidget,
  type LayoutWidget,
} from '../form-widget';

/**
 * Assigns a position-based uid to every widget in the tree that has none.
 *
 * The generated format is a dot-separated index path prefixed with '#', with a
 * 't' segment for a repeater template, e.g. '#0.2.t.1' is the second template
 * child of the repeater found at position 2 of the root layout. The format must
 * never contain '[<digits>]' because repeater item uids append '[index]' and
 * are parsed back with a regex.
 *
 * @param root - The decoded root widget of a form. Widgets with an explicit uid
 * are left untouched, function widgets are skipped because the decoder assigns
 * their uid directly on the function object.
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
