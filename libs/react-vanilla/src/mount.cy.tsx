import { mount } from 'cypress/react';
import { runAlertComponentTests, runValidatorsComponentTests } from '@golemui/ui-testing';
import { FormComponent } from './lib/components/Form';

const mountReact = (formDef: Record<string, any>) => {
  mount(<FormComponent formDef={formDef} />);
};

runAlertComponentTests(mountReact);
runValidatorsComponentTests(mountReact);
