import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

let uidCounter = 0;

/**
 * Base class of the GolemUI elements: gives every element an id to derive the ids of its
 * inner parts (the control, its label, hint and errors) from.
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
}
