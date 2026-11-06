/**
 * The DOM id of a widget part, scoped to its form: the form's `formName` in front of the widget
 * uid. Two forms on one page that share a field then render different ids, so a label, hint or
 * error message never points at the other form's control.
 *
 * Only DOM ids take the prefix. The uid stays the logical id of the widget: the store, form
 * events and `data-cy` attributes use it as it is.
 *
 * @param formName - The form's `formName`. Empty when the form has none yet, which leaves the
 *   uid as it is.
 * @param uid - The widget uid, or any id built from it, row indexes included.
 * @example
 * toDomId('signup', 'email-textinput'); // 'signup-email-textinput'
 * toDomId('', 'email-textinput');       // 'email-textinput'
 */
export function toDomId(formName: string | undefined, uid: string): string {
  return formName ? `${formName}-${uid}` : uid;
}
