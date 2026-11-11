import { Component, Directive, effect, inject, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { preloadFormWidgets } from '@golemui/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FormCoreComponent } from './components/form/form.component';
import {
  provideWidgetSet,
  WidgetSetFormComponent,
} from './components/form/widget-set-form.component';
import { buildConfig, formDef, noopValidators, stubWidgetLoaders } from './ssr.fixture';

const coreStoreState = (form: FormCoreComponent) => form['context'].store.getState();

// A directive on the host element runs its constructor before the view of the form exists.
@Directive({ standalone: true, selector: '[guiEarlyCalls]' })
class EarlyCallsDirective {
  constructor() {
    const form = inject(WidgetSetFormComponent);
    form.setData({ firstName: 'Bob' });
    form.setMeta({ tier: 'paid' });
  }
}

@Component({
  standalone: true,
  imports: [WidgetSetFormComponent, EarlyCallsDirective],
  template: `<gui-widget-set-form guiEarlyCalls [config]="config" />`,
})
class HostWithEarlyCallsComponent {
  config = { formDef, data: { firstName: 'Ada' } };
}

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  TestBed.resetTestingModule();
});

describe('setData and setMeta on gui-core-form before the form starts', () => {
  const createForm = (config = buildConfig()) => {
    const fixture = TestBed.createComponent(FormCoreComponent);
    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('validators', noopValidators);
    return fixture;
  };

  it('replaces the config data with the data of the early call', () => {
    const fixture = createForm();

    fixture.componentInstance.setData({ firstName: 'Bob' });
    fixture.detectChanges();

    expect(coreStoreState(fixture.componentInstance).data).toEqual({ firstName: 'Bob' });
  });

  it('uses the last setData call when there are several', () => {
    const fixture = createForm();

    fixture.componentInstance.setData({ firstName: 'Bob' });
    fixture.componentInstance.setData({ firstName: 'Carol' });
    fixture.detectChanges();

    expect(coreStoreState(fixture.componentInstance).data).toEqual({ firstName: 'Carol' });
  });

  it('replaces the config meta with the meta of the early call', () => {
    const fixture = createForm({ ...buildConfig(), meta: { tier: 'free' } });

    fixture.componentInstance.setMeta({ tier: 'paid' });
    fixture.detectChanges();

    expect(coreStoreState(fixture.componentInstance).meta).toEqual({ tier: 'paid' });
  });

  it('starts the form with the health of an early setHealth call', () => {
    const fixture = createForm();

    fixture.componentInstance.setHealth({
      status: 'errored' as const,
      code: 10_001,
      message: 'Set early',
    });
    fixture.detectChanges();

    expect(coreStoreState(fixture.componentInstance).formHealth).toEqual({
      status: 'errored' as const,
      code: 10_001,
      message: 'Set early',
    });
  });

  it('uses the data of a later config, not the early value, when the form starts again', () => {
    const fixture = createForm();
    fixture.componentInstance.setData({ firstName: 'Bob' });
    fixture.detectChanges();

    fixture.componentRef.setInput('config', { ...buildConfig(), data: { firstName: 'Dana' } });
    fixture.detectChanges();

    expect(coreStoreState(fixture.componentInstance).data).toEqual({ firstName: 'Dana' });
  });

  it('applies a setData call after the start at once', () => {
    const fixture = createForm();
    fixture.detectChanges();

    fixture.componentInstance.setData({ firstName: 'Bob' });

    expect(coreStoreState(fixture.componentInstance).data).toEqual({ firstName: 'Bob' });
  });

  it('does not run an effect that calls setData again when the form starts', () => {
    const fixture = createForm();
    let effectRuns = 0;
    const draft = signal({ firstName: 'Bob' });
    TestBed.runInInjectionContext(() => {
      effect(() => {
        effectRuns += 1;
        fixture.componentInstance.setData(draft());
      });
    });

    TestBed.tick();
    fixture.detectChanges();
    TestBed.tick();
    expect(effectRuns).toBe(1);
    expect(coreStoreState(fixture.componentInstance).data).toEqual({ firstName: 'Bob' });

    draft.set({ firstName: 'Carol' });
    TestBed.tick();
    expect(effectRuns).toBe(2);
    expect(coreStoreState(fixture.componentInstance).data).toEqual({ firstName: 'Carol' });
  });
});

describe('setData and setMeta on gui-widget-set-form before the form starts', () => {
  const createWidgetSetForm = () => {
    TestBed.configureTestingModule({
      providers: [
        provideWidgetSet({ widgetLoaders: stubWidgetLoaders, validators: () => noopValidators }),
      ],
    });
    const fixture = TestBed.createComponent(WidgetSetFormComponent);
    fixture.componentRef.setInput('config', { formDef, data: { firstName: 'Ada' } });
    return fixture;
  };

  const innerForm = (fixture: ComponentFixture<WidgetSetFormComponent>) =>
    fixture.debugElement.query(By.directive(FormCoreComponent))
      .componentInstance as FormCoreComponent;

  it('passes an early setData call to the inner form', () => {
    const fixture = createWidgetSetForm();

    fixture.componentInstance.setData({ firstName: 'Bob' });
    fixture.detectChanges();

    expect(coreStoreState(innerForm(fixture)).data).toEqual({ firstName: 'Bob' });
  });

  it('passes an early setMeta call to the inner form', () => {
    const fixture = createWidgetSetForm();

    fixture.componentInstance.setMeta({ tier: 'paid' });
    fixture.detectChanges();

    expect(coreStoreState(innerForm(fixture)).meta).toEqual({ tier: 'paid' });
  });

  it('passes an early setHealth call to the inner form', () => {
    const fixture = createWidgetSetForm();

    fixture.componentInstance.setHealth({
      status: 'errored' as const,
      code: 10_001,
      message: 'Set early',
    });
    fixture.detectChanges();

    expect(coreStoreState(innerForm(fixture)).formHealth).toEqual({
      status: 'errored' as const,
      code: 10_001,
      message: 'Set early',
    });
  });

  it('keeps calls made before the inner form exists', () => {
    TestBed.configureTestingModule({
      providers: [
        provideWidgetSet({ widgetLoaders: stubWidgetLoaders, validators: () => noopValidators }),
      ],
    });
    const fixture = TestBed.createComponent(HostWithEarlyCallsComponent);
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.directive(FormCoreComponent))
      .componentInstance as FormCoreComponent;
    expect(coreStoreState(form).data).toEqual({ firstName: 'Bob' });
    expect(coreStoreState(form).meta).toEqual({ tier: 'paid' });
  });

  it('applies a setData call after the start at once', () => {
    const fixture = createWidgetSetForm();
    fixture.detectChanges();

    fixture.componentInstance.setData({ firstName: 'Bob' });

    expect(coreStoreState(innerForm(fixture)).data).toEqual({ firstName: 'Bob' });
  });
});
