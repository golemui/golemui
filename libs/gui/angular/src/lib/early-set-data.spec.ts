import { Component, Directive, inject } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormCoreComponent } from '@golemui/angular';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { afterEach, describe, expect, it } from 'vitest';
import { FormComponent } from './components/form/form.component';

const config = {
  formDef: { form: { uid: 'root', kind: 'layout', type: 'flex', children: [] } },
  data: { firstName: 'Ada' },
};

const createForm = () => {
  const fixture = TestBed.createComponent(FormComponent);
  fixture.componentRef.setInput('config', config);
  return fixture;
};

// A directive on the host element runs its constructor before the view of the form exists.
@Directive({ standalone: true, selector: '[guiEarlyCalls]' })
class EarlyCallsDirective {
  constructor() {
    const form = inject(FormComponent);
    form.setData({ firstName: 'Bob' });
    form.setMeta({ tier: 'paid' });
  }
}

@Component({
  standalone: true,
  imports: [FormComponent, EarlyCallsDirective],
  template: `<gui-form guiEarlyCalls [config]="config" />`,
})
class HostWithEarlyCallsComponent {
  config = config as GuiFormInitConfig;
}

const coreStoreState = (fixture: ComponentFixture<FormComponent>) => {
  const coreForm = fixture.debugElement.query(By.directive(FormCoreComponent))
    .componentInstance as FormCoreComponent;
  return coreForm['context'].store.getState();
};

afterEach(() => {
  TestBed.resetTestingModule();
});

describe('setData and setMeta on gui-form before the form starts', () => {
  it('keeps calls made before the inner form exists', () => {
    const fixture = TestBed.createComponent(HostWithEarlyCallsComponent);
    fixture.detectChanges();

    const coreForm = fixture.debugElement.query(By.directive(FormCoreComponent))
      .componentInstance as FormCoreComponent;
    expect(coreForm['context'].store.getState().data).toEqual({ firstName: 'Bob' });
    expect(coreForm['context'].store.getState().meta).toEqual({ tier: 'paid' });
  });

  it('starts the form with the data of an early setData call', () => {
    const fixture = createForm();

    fixture.componentInstance.setData({ firstName: 'Bob' });
    fixture.detectChanges();

    expect(coreStoreState(fixture).data).toEqual({ firstName: 'Bob' });
  });

  it('starts the form with the meta of an early setMeta call', () => {
    const fixture = createForm();

    fixture.componentInstance.setMeta({ tier: 'paid' });
    fixture.detectChanges();

    expect(coreStoreState(fixture).meta).toEqual({ tier: 'paid' });
  });

  it('applies a setData call after the start at once', () => {
    const fixture = createForm();
    fixture.detectChanges();
    expect(coreStoreState(fixture).data).toEqual({ firstName: 'Ada' });

    fixture.componentInstance.setData({ firstName: 'Bob' });

    expect(coreStoreState(fixture).data).toEqual({ firstName: 'Bob' });
  });
});
