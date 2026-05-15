function App() {
  const formDef = myForm;
  const validators: ValidatorFn<Validator> = initValidators();
  return (
    <>
      <GuiForm
        config={{
          formDef,
          data: {},
          customValidators: validators,
        }}
      />
    </>
  );
}
