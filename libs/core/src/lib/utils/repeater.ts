import { FormField, isControlField } from '../FormField';
import { DotPath, Uid } from '../shared';

export function makeRepeaterItemConfig(
  field: FormField<string>,
  repeaterIndex: number,
): FormField<string> {
  const uid = toRepeaterItemUid(field.uid, repeaterIndex);
  if (isControlField(field)) {
    return {
      ...field,
      uid,
      path: toRepeaterItemPath(field.path, repeaterIndex),
    };
  } else {
    return {
      ...field,
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
