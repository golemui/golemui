import { Form } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { mount } from 'cypress/react';
import { FormComponent } from './lib/components/Form';

const mountReact = (formDef: Form<string>) => {
  mount(<FormComponent formDef={formDef} />);
};

mountAndTest(mountReact);
