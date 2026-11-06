import { isServer, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { trackMessages } from './utils/messages';

let uidCounter = 0;

/**
 * Base class of the GolemUI elements: gives every element an id to derive the ids of its
 * inner parts (the control, its label, hint and errors) from, and keeps its strings in sync with
 * `configureMessages()`.
 */
export abstract class GuiElement extends LitElement {
  private explicitUid: string | undefined = undefined;
  private generatedUid: string | undefined = undefined;

  /**
   * The id of the element's control. The ids of its label, hint and errors derive from it.
   *
   * Optional: when it is not set, the element generates one from its tag name and a page-wide
   * counter, e.g. `gui-textinput-3`. Generated ids depend on creation order, so a
   * server-rendered element must set `uid` or its ids will not match after hydration.
   */
  @property({ type: String })
  get uid(): string {
    return this.explicitUid || (this.generatedUid ??= `${this.localName}-${++uidCounter}`);
  }

  set uid(value: string | undefined) {
    this.explicitUid = value;
  }

  /**
   * Goes in front of every DOM id the element renders, so two elements with the same `uid` in
   * different forms render different ids. GolemUI Forms sets it to the form's `formName`.
   *
   * Only ids and the references to them (`for`, `aria-describedby`…) take it: `data-cy`
   * attributes and event details keep the bare `uid`.
   */
  @property({ type: String, attribute: 'id-prefix' }) idPrefix: string | undefined = undefined;

  /** The id of the element's control: `uid`, behind `idPrefix` when it is set. */
  get domId(): string {
    return this.idPrefix ? `${this.idPrefix}-${this.uid}` : this.uid;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Re-renders with the new strings when the app's translate function changes. Not on the
    // server, where elements are never disconnected and would be kept forever.
    if (!isServer) trackMessages(this, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    trackMessages(this, false);
  }
}
