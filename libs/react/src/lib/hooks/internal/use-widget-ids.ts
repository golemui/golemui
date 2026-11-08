import { type FormContext } from '@golemui/core';
import { toDomId } from '@golemui/core/internals';
import { useMemo } from 'react';

/**
 * The form's name and the widget's DOM id, computed once per widget and form: every DOM id the
 * widget renders extends `domId`, and `formName` is the `idPrefix` of GolemUI Components.
 */
export function useWidgetIds(
  formContext: FormContext<unknown>,
  uid: string,
): { formName: string; domId: string } {
  const formName = formContext.formName;
  return useMemo(() => ({ formName, domId: toDomId(formName, uid) }), [formName, uid]);
}
