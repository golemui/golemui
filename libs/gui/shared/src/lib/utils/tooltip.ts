/** A widget's tooltip, as its button renders it. */
export type WidgetTooltip = {
  /** The text of the tooltip. */
  text: string;
  /** The id of the tooltip, `${domId}_tooltip`. */
  id: string;
  /**
   * `label` when the text is also the button's name, because the button shows no label and has
   * no `ariaLabel`: the button takes the text as its `aria-label`, and the tooltip describes
   * nothing. `description` otherwise: the button's `aria-describedby` names the tooltip.
   */
  type: 'description' | 'label';
};

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * The tooltip of a widget's button, or undefined when it has none.
 *
 * @example
 * widgetTooltip('checkout-delete', 'Delete', undefined, undefined);
 * // { text: 'Delete', id: 'checkout-delete_tooltip', type: 'label' }
 */
export function widgetTooltip(
  domId: string,
  tooltip: unknown,
  label: unknown,
  ariaLabel: unknown,
): WidgetTooltip | undefined {
  if (!isText(tooltip)) return undefined;
  const named = !!label || isText(ariaLabel);
  return { text: tooltip, id: `${domId}_tooltip`, type: named ? 'description' : 'label' };
}
