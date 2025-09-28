import styles from './form.page.module.scss';

import * as Core from '@formforge/core';
import * as React from '@formforge/react';
import * as Vanilla from '@formforge/react-vanilla';
import { useState } from 'react';
import { loggerMiddleware } from '../../middlewares/logger.middleware';
import { signin } from '../../mocks';

function onFormEvent(event: Core.FormEvent) {
  console.groupCollapsed(`onFormEvent('${event.name}')`);
  console.log(event.data);
  console.groupEnd();
}

const vanillaFieldLoaders = {
  ...Vanilla.vanillaFieldLoaders,
  heading: async () =>
    (await import('../../custom-fields/heading/heading.component'))
      .HeadingComponent,
};
const formDef = signin;
const middlewares = [loggerMiddleware];

export function FormPage() {
  const [error, setError] = useState('');

  function onFormError(storeError: Core.FormStoreError) {
    setError('');
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
        fieldLoader={vanillaFieldLoaders}
        middlewares={middlewares}
        onFormError={onFormError}
        onFormEvent={onFormEvent}
      />
    </div>
  );
}

export default FormPage;
