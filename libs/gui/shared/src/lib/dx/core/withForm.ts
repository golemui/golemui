import type { FunctionWidgetParams } from '@golemui/core';

/**
 * Runtime functions can run during the build walk / decode probe before form
 * data exists; the FunctionWidgetParams contract guarantees `$form` is an
 * object, so normalize it to at least `{}` — a callback reading
 * `params.$form.field` must get `undefined`, not crash.
 */
export function withForm(params?: FunctionWidgetParams<any>): FunctionWidgetParams<any> {
  return {
    errors: undefined,
    touched: undefined,
    translate: undefined,
    ...(params ?? {}),
    $form: params?.$form ?? {},
  };
}
