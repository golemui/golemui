import { mount } from 'cypress/angular';
import { runAlertComponentTests, runValidatorsComponentTests } from '@golemui/ui-testing';
import { FormComponent } from './lib/components/form/form.component';
import { CommonModule } from '@angular/common';
import * as Angular from '@golemui/angular';

const mountAngular = (formDef: Record<string, any>) => {
  mount(FormComponent, {
    imports: [CommonModule, Angular.FormCoreComponent],
    componentProperties: { formDef: formDef },
  });
};

runAlertComponentTests(mountAngular);
runValidatorsComponentTests(mountAngular);
