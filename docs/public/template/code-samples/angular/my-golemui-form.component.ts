@Component({
  selector: 'my-golemui-form',
  imports: [FormComponent],
  template: `
    <gui-form
      [formDef]="formDef"
      [data]="{}"
      [fieldLoaders]="widgetLoaders"
      [validators]="validators"
    ></gui-form>
  `,
})
export class MyGolemUIForm {
  formDef = myForm;
  widgetLoaders = GuiAngular.widgetLoaders;
  validators: ValidatorFn<Validator> = initValidators();
}
