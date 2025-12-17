import { Action, Form, Middleware, State } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { mount } from 'cypress/react';
import { FormComponent } from './lib/components/Form';

const mountReact = (formDef: Form<string>, middlewares: Middleware<State, Action>[] = []) => {
  mount(<FormComponent formDef={formDef} middlewares={middlewares} />);
};

mountAndTest(mountReact);
