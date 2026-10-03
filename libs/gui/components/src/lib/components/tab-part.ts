import { ReactiveElement } from 'lit';

/**
 * The parts of `gui-tabs` render nothing: the app renders their content, and `gui-tabs` gives
 * them their roles, ids and state.
 */
export abstract class GuiTabsPart extends ReactiveElement {
  /** The ARIA role of the part. */
  protected abstract readonly partRole: string;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', this.partRole);
  }
}
