import { type Subscription } from 'rxjs';

/**
 * Unsubscribes every entry and empties the array.
 *
 * Emptying it matters because a Lit element runs `disconnectedCallback` on a DOM move and
 * subscribes again on the next `connectedCallback`. Without the reset the array keeps every
 * dead subscription across reconnects.
 *
 * @param subscriptions - The array to unsubscribe and reset. Modified in place.
 */
export function unsubscribeAll(subscriptions: Subscription[]): void {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
  subscriptions.length = 0;
}
