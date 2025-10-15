import './form.element.scss';

export class FormElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    this.innerHTML = `
      <div>
        <ff-form></ff-form>
      </div>
    `;
  }
}
customElements.define('lit-form', FormElement);
