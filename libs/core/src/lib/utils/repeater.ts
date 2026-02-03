import { isInputWidget, NonFunctionWidget } from '../form-widget';
import { DotPath, Uid } from '../shared';

export function makeRepeaterItemConfig(
  widget: NonFunctionWidget<string>,
  repeaterIndex: number,
): NonFunctionWidget<string> {
  const uid = toRepeaterItemUid(widget.uid, repeaterIndex);
  if (isInputWidget(widget)) {
    return {
      ...widget,
      uid,
      path: toRepeaterItemPath(widget.path, repeaterIndex),
    };
  } else {
    return {
      ...widget,
      uid,
    };
  }
}

function toRepeaterItemUid(uid: Uid, repeaterIndex: number): Uid {
  if (repeaterIndex === -1) {
    throw new Error('-1 is an invalid Repeater index');
  }
  return `${uid}[${repeaterIndex}]` as Uid;
}

function toRepeaterItemPath(path: DotPath, repeaterIndex: number): DotPath {
  if (repeaterIndex === -1) {
    throw new Error('-1 is an invalid Repeater index');
  }
  return path.replace('.items.', `.${repeaterIndex}.`) as DotPath;
}
