@Component({
  selector: 'my-golemui-form',
  imports: [FormComponent],
  template: `
    <gui-form
      [config]="config"
    ></gui-form>
  `,
})
export class MyGolemUIForm {
  config = {
    formDef: myForm,
    data: {},
    customWidgetLoaders: GuiAngular.widgetLoaders,
    customValidators: initValidators() as ValidatorFn<Validator>,
  };
}
