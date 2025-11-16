import styles from './form.page.module.scss';

import { allowedNames, loggerMiddleware, signin, signinData } from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import * as React from '@golemui/react';
import * as Vanilla from '@golemui/react-vanilla';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import { useState } from 'react';

function onFormEvent(event: Core.FormEvent) {
  console.groupCollapsed(`onFormEvent('${event.name}')`);
  console.log(event.data);
  console.groupEnd();
}

const vanillaFieldLoaders = {
  ...Vanilla.vanillaFieldLoaders,
  heading: async () =>
    (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
};
const formDef = signin;
const formData = signinData;
const middlewares = [Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap), loggerMiddleware];
const customValidators: Core.CustomValidatorSchemas = {
  allowedNames,
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
      <React.FormComponent
        formDef={formDef}
        data={formData}
        fieldLoader={vanillaFieldLoaders}
        middlewares={middlewares}
        customValidators={customValidators}
        onFormError={onFormError}
        onFormEvent={onFormEvent}
      />
    </div>
  );
}

export default FormPage;
