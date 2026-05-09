function App() {
  const formDef = myForm;
  const validators: ValidatorFn<Validator> = initValidators();
  return (
    <>
      <GuiForm
        formDef={formDef}
        data={{}}
        validators={validators}
      />
    </>
  );
}
