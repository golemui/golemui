/**
 * The id of a widget's tooltip, which the `aria-describedby` of its button names.
 *
 * @example
 * tooltipId('checkout-delete'); // 'checkout-delete_tooltip'
 */
export function tooltipId(domId: string): string {
  return `${domId}_tooltip`;
}

/** The text of a widget's `tooltip` prop, or undefined when it shows none. */
export function tooltipText(tooltip: unknown): string | undefined {
  return typeof tooltip === 'string' && tooltip.trim() !== '' ? tooltip : undefined;
}
