function App() {
  const formDef = myForm;
  const validators: ValidatorFn<Validator> = initValidators();
  return (
    <>
      <FormComponent
        formDef={formDef}
        data={{}}
        fieldLoader={{ ...vanillaFieldLoaders }}
        validators={validators}
      />
    </>
  );
}
