const BUILDER_PROP_BY_EVENT: Record<string, string> = {
  click: 'onClick',
  change: 'onChange',
  load: 'onLoad',
  filter: 'onFilter',
  blur: 'onBlur',
};

/**
 * Describes the handler of an `on` key of a widget, with the name that the builder gives it.
 *
 * @param onKey - A key of `on`, for example `click` or `click.register`.
 * @param widget - The widget that has the handler.
 * @returns For example `onClick handler of the button "save"`, or
 *   `onClick handler of the button "save" for the state "register"`.
 */
export function describeHandler(onKey: string, widget: Record<string, unknown>): string {
  const separatorIndex = onKey.indexOf('.');
  const eventName = separatorIndex < 0 ? onKey : onKey.slice(0, separatorIndex);
  const builderProp = BUILDER_PROP_BY_EVENT[eventName] ?? eventName;
  const handlerText = `${builderProp} handler of the ${describeWidget(widget)}`;
  if (separatorIndex < 0) {
    return handlerText;
  }
  return `${handlerText} for the state "${onKey.slice(separatorIndex + 1)}"`;
}

/**
 * Describes a widget in a diagnostic message: its type with its uid, its path or its label.
 *
 * @param widget - A widget, as the builder or the JSON form holds it.
 * @returns For example `textinput "email"`, or `button` for a widget with no uid, path or label.
 */
export function describeWidget(widget: Record<string, unknown>): string {
  const type = typeof widget['type'] === 'string' ? widget['type'] : 'widget';
  for (const candidate of [widget['uid'], widget['path'], widget['label']]) {
    if (typeof candidate === 'string' && candidate !== '') {
      return `${type} "${candidate}"`;
    }
  }
  return type;
}
