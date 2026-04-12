function App() {
  const formDef = myForm;
  const validators: ValidatorFn<Validator> = initValidators();
  return (
    <>
      <FormComponent
        formDef={formDef}
        data={{}}
        widgetLoaders={ GuiReact.widgetLoaders }
        validators={validators}
      />
    </>
  );
}
