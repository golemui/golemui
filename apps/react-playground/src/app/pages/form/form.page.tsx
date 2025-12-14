import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import { FormComponent } from '@golemui/react-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { useState } from 'react';
import styles from './form.page.module.scss';

async function onFormEvent(event: Core.FormEvent) {
  AppsShared.onFormEvent(event);
}

const formDef = AppsShared.kitchenSink;
const formData = AppsShared.kitchenSinkData;

const vanillaFieldLoaders = {
  heading: async () =>
    (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
};
const middlewares = [AppsShared.loggerMiddleware];
const validators: ValidatorsVanilla.CustomValidatorSchemas = {
  allowedNames: AppsShared.allowedNames,
};

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
      <FormComponent
        formDef={formDef}
        data={formData}
        fieldLoaders={vanillaFieldLoaders}
        middlewares={middlewares}
        validators={validators}
        validateOn="eager"
        formError={onFormError}
        formEvent={onFormEvent}
      />
    </div>
  );
}

export default FormPage;
