import { isInputWidget, NonFunctionWidget } from '../form-widget';
import { DotPath, Uid } from '../shared';

export function makeRepeaterItemConfig(
  widget: NonFunctionWidget<string>,
  repeaterIndexes: number[],
): NonFunctionWidget<string> {
  const uid = toRepeaterItemUid(widget.uid, repeaterIndexes);
  if (isInputWidget(widget)) {
    return {
      ...widget,
      uid,
      path: toRepeaterItemPath(widget.path, repeaterIndexes),
    };
  } else {
    return {
      ...widget,
      uid,
    };
  }
}

function toRepeaterItemUid(uid: Uid, repeaterIndexes: number[]): Uid {
  if (repeaterIndexes.length === 0) {
    throw new Error('Repeater indexes cannot be an empty array');
  }
  // converts the array `[1,2,3]` into the string `'[1][2][3]'`
  const indexes = repeaterIndexes.reduce((acc, n) => `${acc}[${n}]`, '');
  return `${uid}${indexes}` as Uid;
}

function toRepeaterItemPath(path: DotPath, repeaterIndexes: number[]): string {
  if (repeaterIndexes.length === 0) {
    throw new Error('Repeater indexes cannot be an empty array');
  }

  const ITEMS_TOKEN = 'items';
  const parts = path.split(`.${ITEMS_TOKEN}`);
  const itemsCount = parts.length - 1;

  if (itemsCount !== repeaterIndexes.length) {
    throw new Error(
      `Path contains ${itemsCount} '${ITEMS_TOKEN}' occurrences, but ${repeaterIndexes.length} indexes were provided.`,
    );
  }

  // Reconstruct the path by joining segments with the corresponding index
  return parts.reduce((acc, part, i) => {
    if (i === 0) {
      return part;
    }
    return `${acc}.${repeaterIndexes[i - 1]}${part}`;
  });
}
