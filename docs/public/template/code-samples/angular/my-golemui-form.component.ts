@Component({
  selector: 'my-golemui-form',
  imports: [FormComponent],
  template: `
    <gui-form
      [formDef]="formDef"
      [data]="{}"
      [fieldLoaders]="vanillaFieldLoaders"
      [validators]="validators"
    ></gui-form>
  `,
})
export class MyGolemUIForm {
  formDef = myForm;
  vanillaFieldLoaders = {
    ...vanillaFieldLoaders,
  };
  validators: ValidatorFn<Validator> = initValidators();
}
