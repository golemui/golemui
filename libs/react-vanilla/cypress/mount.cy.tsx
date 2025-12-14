import { mount } from 'cypress/react';
import { runAlertComponentTests } from '@golemui/ui-testing';
import { FormComponent } from '../src/lib/components/Form';

const mountReact = (formDef: Record<string, any>) => {
  mount(<FormComponent formDef={{ formDef }} />);
};

runAlertComponentTests(mountReact);
