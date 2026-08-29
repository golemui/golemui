import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

/**
 * Attribute value for `[attr.defer-hydration]` on a `gui-*` custom element.
 *
 * A server render emits the attribute, and the element does not render itself while the
 * attribute is present (the elements implement the defer-hydration protocol). The
 * first client change detection pass binds `null`, which removes the attribute and lets
 * the element render. A client-only render binds `null` from the start, so the attribute
 * never appears there.
 *
 * Must be called in an injection context, for example a field initializer.
 */
export function deferHydrationAttr(): '' | null {
  return isPlatformServer(inject(PLATFORM_ID)) ? '' : null;
}
