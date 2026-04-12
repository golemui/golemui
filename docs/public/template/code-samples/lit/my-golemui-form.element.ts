@customElement('my-golemui-form')
export class MyGolemUIForm extends LitElement {
  formDef = myForm;
  validators: ValidatorFn<Validator> = initValidators();

  override createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <gui-form
        .formDef=${this.formDef}
        .data=${{}}
        .customWidgetLoaders=${GuiLit.widgetLoaders}
        .customValidators=${this.validators}
      ></gui-form>
    `;
  }
}
