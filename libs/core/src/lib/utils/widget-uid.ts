// The uid rule of a form. This module imports nothing, so a tool that checks form definitions can
// use the same rule without loading the form decoders.

/** The position uid of the root layout that holds the widgets of a form. */
export const ROOT_POSITION_UID = '#0';

/**
 * The position uid of a child of a layout.
 *
 * @param parentPositionUid - The position uid of the layout.
 * @param childIndex - The index of the child in the `children` of the layout.
 * @returns The position uid of the child, for example `#0.2` for the third widget of the form.
 */
export function childPositionUid(parentPositionUid: string, childIndex: number): string {
  return `${parentPositionUid}.${childIndex}`;
}

/**
 * The position uid of the template of a repeater.
 *
 * @param repeaterPositionUid - The position uid of the repeater.
 * @returns The position uid of the template, for example `#0.1.t`.
 */
export function templatePositionUid(repeaterPositionUid: string): string {
  return `${repeaterPositionUid}.t`;
}

/**
 * The uid of a function widget without a uid. The `f` segment keeps it different from the plain
 * position uids: a function used again in a second form keeps the uid of its first decode, and
 * that uid must not be equal to a position uid of the second form.
 *
 * @param positionUid - The position uid of the function widget.
 * @returns The uid, for example `#0.3.f`.
 */
export function functionWidgetPositionUid(positionUid: string): string {
  return `${positionUid}.f`;
}

/**
 * The uid of an input without a uid. It does not depend on the position, so two inputs with the
 * same `path` and `type` get the same uid.
 *
 * @param path - The `path` of the input.
 * @param type - The `type` of the input.
 * @returns The uid, for example `email-textinput`.
 */
export function derivedInputUid(path: string, type: string): string {
  return `${path}-${type}`;
}

/**
 * Where the uid of a widget comes from. `formRoot` is the root layout that the form creates
 * around the `form` array of a JSON definition.
 */
export type WidgetUidOrigin = 'written' | 'derived' | 'position' | 'formRoot';

/** The uid that the form gives one widget of a JSON form definition. */
export type WidgetUidEntry = {
  uid: string;
  /**
   * 0 outside repeater templates, 1 in the template of a repeater of depth 0, 2 in the template
   * of a repeater of depth 1, and so on. The form keeps the widgets of one depth in one map,
   * with the keys `uid`, `uid[row]`, `uid[row][row]` and so on, so a uid must not repeat inside
   * one depth.
   */
  repeaterDepth: number;
  /** The JSON Pointer of the widget, for example `/form/0/props/template/children/1`. */
  pointer: string;
  origin: WidgetUidOrigin;
};

/**
 * Lists the uid that the form gives each widget of a JSON form definition: the written `uid`,
 * else {@link derivedInputUid} for an input, else the position uid. It skips a chunk reference,
 * because its widgets are not in the definition, and `props["template.<state>"]`, because the
 * form gives its widgets no uid. It also skips a widget that the form cannot decode: a `uid` that
 * is not a string, or an input without a written uid whose `path` or `type` is not a string.
 *
 * @param formDefinition - A JSON form definition, `{ form: [...] }`.
 * @returns One entry for each widget, in the order of the definition, the root layout first.
 *
 * @example
 * collectWidgetUids({ form: [{ kind: 'input', type: 'textinput', path: 'email' }] });
 * // [
 * //   { uid: '#0', repeaterDepth: 0, pointer: '/form', origin: 'formRoot' },
 * //   { uid: 'email-textinput', repeaterDepth: 0, pointer: '/form/0', origin: 'derived' },
 * // ]
 */
export function collectWidgetUids(formDefinition: unknown): WidgetUidEntry[] {
  const entries: WidgetUidEntry[] = [];
  const form = isJsonObject(formDefinition) ? formDefinition['form'] : undefined;
  if (!Array.isArray(form)) {
    return entries;
  }
  entries.push({ uid: ROOT_POSITION_UID, repeaterDepth: 0, pointer: '/form', origin: 'formRoot' });
  form.forEach((widget, index) => {
    collectFromWidget(
      widget,
      `/form/${index}`,
      childPositionUid(ROOT_POSITION_UID, index),
      0,
      entries,
    );
  });
  return entries;
}

function collectFromWidget(
  widget: unknown,
  pointer: string,
  positionUid: string,
  repeaterDepth: number,
  entries: WidgetUidEntry[],
): void {
  if (!isJsonObject(widget) || '$ref' in widget) {
    return;
  }
  const uidAndOrigin = uidOf(widget, positionUid);
  if (uidAndOrigin !== undefined) {
    entries.push({ ...uidAndOrigin, repeaterDepth, pointer });
  }

  const children = widget['children'];
  if (widget['kind'] === 'layout' && Array.isArray(children)) {
    children.forEach((child, index) => {
      collectFromWidget(
        child,
        `${pointer}/children/${index}`,
        childPositionUid(positionUid, index),
        repeaterDepth,
        entries,
      );
    });
  }

  const props = widget['props'];
  if (widget['kind'] === 'input' && widget['type'] === 'repeater' && isJsonObject(props)) {
    collectFromWidget(
      props['template'],
      `${pointer}/props/template`,
      templatePositionUid(positionUid),
      repeaterDepth + 1,
      entries,
    );
  }
}

function uidOf(
  widget: Record<string, unknown>,
  positionUid: string,
): Pick<WidgetUidEntry, 'uid' | 'origin'> | undefined {
  const { uid, kind, path, type } = widget;
  if (typeof uid === 'string' && uid !== '') {
    return { uid, origin: 'written' };
  }
  if (uid !== undefined && uid !== '') {
    return undefined;
  }
  if (kind !== 'input') {
    return { uid: positionUid, origin: 'position' };
  }
  if (typeof path === 'string' && typeof type === 'string') {
    return { uid: derivedInputUid(path, type), origin: 'derived' };
  }
  return undefined;
}

// Not the `isPlainObject` of `./object`, because this module imports nothing. A JSON value needs
// no prototype check.
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
