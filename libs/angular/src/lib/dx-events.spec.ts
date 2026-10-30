import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type FormEvent, preloadFormWidgets } from '@golemui/core';
import type { ResolveFormInputFn } from '@golemui/dx';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  provideWidgetSet,
  WidgetSetFormComponent,
} from './components/form/widget-set-form.component';
import {
  type InputAdapter,
  lastAdapter,
  noopValidators,
  recordedAdapters,
  stubWidgetLoaders,
} from './ssr.fixture';

const formDefWithChangeEvent = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      {
        uid: 'firstName',
        kind: 'input',
        type: 'textinput',
        path: 'firstName',
        on: { change: 'firstNameChanged' },
      },
    ],
  },
};

const calls: { source: string; event: FormEvent }[] = [];

@Component({
  standalone: true,
  imports: [WidgetSetFormComponent],
  template: `<gui-widget-set-form
    [config]="config"
    (formEvent)="calls.push({ source: 'host', event: $event })"
  />`,
})
class WidgetSetFormHostComponent {
  config = { formDef: {}, data: { firstName: 'Ada' } };
  calls = calls;
}

@Component({
  standalone: true,
  imports: [WidgetSetFormComponent],
  template: `<gui-widget-set-form [config]="config" />`,
})
class WidgetSetFormWithoutListenerComponent {
  config = { formDef: {}, data: { firstName: 'Ada' } };
}

const provideResolver = (resolveFormInput: ResolveFormInputFn) =>
  TestBed.configureTestingModule({
    providers: [
      provideWidgetSet({
        widgetLoaders: stubWidgetLoaders,
        validators: () => noopValidators,
        resolveFormInput,
      }),
    ],
  });

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  recordedAdapters.length = 0;
  calls.length = 0;
  TestBed.resetTestingModule();
});

describe('a form event of a widget set form with a resolved event handler', () => {
  it('calls the resolved handler first and then the formEvent output, with the same event object', () => {
    // Stands in for the resolver of a widget set with a builder API, which returns the
    // function handlers of the form as `formEvent`.
    provideResolver(() => ({
      formDef: formDefWithChangeEvent,
      formEvent: (event) => calls.push({ source: 'resolved', event }),
    }));
    const fixture = TestBed.createComponent(WidgetSetFormHostComponent);
    fixture.detectChanges();

    lastAdapter<InputAdapter<string>>('firstName').valueChanged('Grace');

    expect(calls.map((call) => call.source)).toEqual(['resolved', 'host']);
    expect(calls[1].event).toBe(calls[0].event);
    expect(calls[0].event).toMatchObject({
      name: 'firstNameChanged',
      data: { firstName: 'Grace' },
    });
    fixture.destroy();
  });

  it('calls the resolved handler when no formEvent listener is bound', () => {
    const resolvedHandler = vi.fn();
    provideResolver(() => ({ formDef: formDefWithChangeEvent, formEvent: resolvedHandler }));
    const fixture = TestBed.createComponent(WidgetSetFormWithoutListenerComponent);
    fixture.detectChanges();

    lastAdapter<InputAdapter<string>>('firstName').valueChanged('Grace');

    expect(resolvedHandler).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
});
