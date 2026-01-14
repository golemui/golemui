import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ListItem, ListProps } from '../field.props';
import { addErrors, addLabel, ControlTemplateData } from '../utils/templates';
import { OptionValue } from './one-of';

@customElement('gui-list')
export class GuiListControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: OptionValue | undefined = undefined;

  @property({ type: Array }) items: ListItem<unknown>[] = [];
  @property({ type: String }) valueField = 'value';

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<OptionValue> & ListProps<unknown> = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      items: this.items,
      valueField: this.valueField,
    };

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-field">
        <slot></slot>
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  valueChanged(event: Event | undefined) {
    event?.stopPropagation();

    if (!this.readOnly) {
      const target = event?.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: target.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  onBlur() {
    this.dispatchEvent(
      new CustomEvent('blur', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-list': GuiListControl;
  }
}
