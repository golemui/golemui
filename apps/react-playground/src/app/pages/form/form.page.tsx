import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import * as React from '@golemui/react';
import * as Vanilla from '@golemui/react-vanilla';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { useState } from 'react';
import styles from './form.page.module.scss';

async function onFormEvent(event: Core.FormEvent) {
  AppsShared.onFormEvent(event);
}

const vanillaFieldLoaders = {
  ...Vanilla.vanillaFieldLoaders,
  heading: async () =>
    (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
};
const formDef = AppsShared.kitchenSink;
const formData = AppsShared.kitchenSinkData;
const middlewares = [
  Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(ValidatorsVanilla.jsonSchemaValidators)),
  AppsShared.loggerMiddleware,
];
const validators: Core.ValidatorFn<ValidatorsVanilla.Validator> = ValidatorsVanilla.initValidators({
  allowedNames: AppsShared.allowedNames,
});

export function FormPage() {
  const [error, setError] = useState('');

  function onFormError(storeError: Core.FormStoreError) {
    if (storeError.kind === 'validation') {
      setError('Validation errors: ' + storeError.errors);
    } else if (storeError.kind === 'fatal') {
      setError('Fatal error: ' + storeError.error);
    }
  }

  return (
    <div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <React.FormComponent
        formDef={formDef}
        data={formData}
        fieldLoader={vanillaFieldLoaders}
        middlewares={middlewares}
        validators={validators}
        validateOn="change"
        onFormError={onFormError}
        onFormEvent={onFormEvent}
      />
    </div>
  );
}

export default FormPage;
