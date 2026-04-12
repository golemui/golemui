@Component({
  selector: 'my-golemui-form',
  imports: [FormComponent],
  template: `
    <gui-form
      [formDef]="formDef"
      [data]="{}"
      [fieldLoaders]="golemWidgetLoaders"
      [validators]="validators"
    ></gui-form>
  `,
})
export class MyGolemUIForm {
  formDef = myForm;
  golemWidgetLoaders = {
    ...golemWidgetLoaders,
  };
  validators: ValidatorFn<Validator> = initValidators();
}
