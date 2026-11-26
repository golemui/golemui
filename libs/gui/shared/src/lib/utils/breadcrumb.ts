/**
 * @internal Used by the framework breadcrumb widgets, not part of the end-user public API.
 *
 * The parts of the breadcrumb widget the four adapters must render the same way.
 */
import { message } from '@golemui/gui-components/internals';
import type { BreadcrumbItem } from '../widget.props';

/**
 * The name of the trail's `<nav>`: the widget's label, or the Components' `breadcrumb` message
 * ("Breadcrumb"), which `configureMessages` translates.
 *
 * @param label - The widget's label, already translated.
 */
export function breadcrumbLabel(label: unknown): string {
  return typeof label === 'string' && label !== '' ? label : message('breadcrumb');
}

/** The trail's steps, each marked with whether it is the current page: the last one. */
export function breadcrumbTrail(
  items: readonly BreadcrumbItem[] | undefined,
): (BreadcrumbItem & { current: boolean })[] {
  const steps = items ?? [];
  return steps.map((item, index) => ({ ...item, current: index === steps.length - 1 }));
}
