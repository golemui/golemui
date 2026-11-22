import { type FormWidget, isInputWidget, isLayoutWidget, type LayoutWidget } from '../form-widget';
import { childPositionUid, ROOT_POSITION_UID, templatePositionUid } from './widget-uid';

/**
 * Assigns a position-based uid to every widget in the tree that has none, e.g. '#0.2.t.1'
 * (dot-separated indexes, 't' for a repeater template).
 * The format must never contain '[<digits>]' because repeater item uids append '[index]'
 * and are parsed back with a regex.
 *
 * @example
 * const decodedForm = formDefDecoder.parse(rawFormDef);
 * assignDeterministicUids(decodedForm.form); // uid-less widgets now have '#0.x' uids
 */
export function assignDeterministicUids(root: FormWidget<string>): void {
  assignUidByPosition(root, ROOT_POSITION_UID);
}

function assignUidByPosition(widget: FormWidget<string>, positionUid: string): void {
  if (!widget.uid) {
    widget.uid = positionUid;
  }
  if (isLayoutWidget(widget)) {
    widget.children.forEach((child, index) => {
      assignUidByPosition(child, childPositionUid(positionUid, index));
    });
  }
  if (isInputWidget(widget) && widget.type === 'repeater') {
    const template = (widget.props as Record<string, unknown> | undefined)?.['template'];
    if (template) {
      assignUidByPosition(template as LayoutWidget<string>, templatePositionUid(positionUid));
    }
  }
}
