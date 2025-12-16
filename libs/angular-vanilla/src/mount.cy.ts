import { CommonModule } from '@angular/common';
import * as Angular from '@golemui/angular';
import { Form } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { mount } from 'cypress/angular';
import { FormComponent } from './lib/components/form/form.component';

const mountAngular = (formDef: Form<string>) => {
  mount(FormComponent, {
    imports: [CommonModule, Angular.FormCoreComponent],
    componentProperties: { formDef },
  });
};

mountAndTest(mountAngular);
