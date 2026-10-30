import { Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  enableDevMode,
  type FormInitConfig,
  type FormSubmitEvent,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormCoreComponent } from './components/form/form.component';
import { type InputAdapter, lastAdapter, noopValidators, stubWidgetLoaders } from './ssr.fixture';

type StubConfig = FormInitConfig<Type<WithWidget>>;

@Component({ standalone: true, selector: 'gui-throws-in-constructor', template: `<p>never</p>` })
class ThrowsInConstructorComponent implements WithWidget {
  widget!: WithWidget['widget'];

  constructor() {
    throw new Error('constructor failed');
  }
}

@Component({
  standalone: true,
  selector: 'gui-throws-in-template',
  template: `<p>{{ fail() }}</p>`,
})
class ThrowsInTemplateComponent implements WithWidget {
  widget!: WithWidget['widget'];

  protected fail(): string {
    throw new Error('template failed');
  }
}

const widgetLoaders = {
  ...stubWidgetLoaders,
  throwsInConstructor: async (): Promise<Type<WithWidget>> => ThrowsInConstructorComponent,
  throwsInTemplate: async (): Promise<Type<WithWidget>> => ThrowsInTemplateComponent,
};

const rootLayout = (children: unknown[]) => ({
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const firstNameInput = { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' };

const configWith = (widget: Record<string, unknown>): StubConfig => ({
  formDef: rootLayout([widget, firstNameInput]),
  widgetLoaders,
  data: { firstName: 'Ada', lastName: 'Lovelace' },
});

@Component({
  standalone: true,
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config()"
    [validators]="validators"
    (formSubmit)="submits.push($event)"
  />`,
})
class FormHostComponent {
  config = signal<StubConfig>({ formDef: rootLayout([]), widgetLoaders });
  validators = noopValidators;
  submits: FormSubmitEvent[] = [];
}

let fixture: ComponentFixture<FormHostComponent>;

/** Sets the config and runs no change detection, so a test can run the first pass itself. */
const createForm = (config: StubConfig) => {
  fixture = TestBed.createComponent(FormHostComponent);
  fixture.componentInstance.config.set(config);
};

const formElement = () => fixture.nativeElement.querySelector('form') as HTMLFormElement;

const firstNameValue = () =>
  (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[name="firstName"]')
    ?.value;

const setFirstNameValue = (value: string) => {
  lastAdapter<InputAdapter<string>>('firstName').valueChanged(value);
};

beforeAll(async () => {
  // The constructor case is not preloaded, like a widget that the browser imports on demand.
  const { throwsInConstructor: _notPreloaded, ...preloadedLoaders } = widgetLoaders;
  await preloadFormWidgets({ widgetLoaders: preloadedLoaders });
});

beforeEach(() => {
  // The errored health is logged, which is expected here.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  fixture.destroy();
  vi.restoreAllMocks();
});

describe('a widget that throws in its constructor', () => {
  // The constructor runs after the dynamic import, inside the try of the widget directive.
  it('is reported as a widget that could not be loaded, and its sibling takes a new value', async () => {
    createForm(
      configWith({ uid: 'broken', kind: 'input', type: 'throwsInConstructor', path: 'b' }),
    );
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.gui-form-health-error')?.textContent).toContain(
        '[30] Widget "throwsInConstructor" could not be loaded',
      );
    });
    expect(fixture.nativeElement.querySelector('#host-broken')).toBeNull();
    expect(formElement().textContent).not.toContain('failed with:');

    setFirstNameValue('Grace');
    fixture.detectChanges();

    expect(firstNameValue()).toBe('Grace');
  });
});

describe('a widget that throws in its template', () => {
  it('throws in the pass that checks it, and its sibling updates in the next pass', () => {
    createForm(configWith({ uid: 'broken', kind: 'input', type: 'throwsInTemplate', path: 'b' }));

    // The pass stops at the widget, before it creates the sibling.
    expect(() => fixture.detectChanges()).toThrow('template failed');
    expect(firstNameValue()).toBeUndefined();
    fixture.detectChanges();
    expect(firstNameValue()).toBe('Ada');

    setFirstNameValue('Grace');
    expect(() => fixture.detectChanges()).toThrow('template failed');
    expect(firstNameValue()).toBe('Ada');
    fixture.detectChanges();
    expect(firstNameValue()).toBe('Grace');
    expect(formElement().textContent).not.toContain('failed with:');
  });
});

describe('a widget that fails to load', () => {
  it('lets its sibling take a new value, and the form submits it', async () => {
    createForm({
      formDef: rootLayout([
        { uid: 'missing', kind: 'input', type: 'missing', path: 'missing' },
        firstNameInput,
      ]),
      widgetLoaders: {
        ...widgetLoaders,
        missing: () => Promise.reject(new Error('The import failed')),
      },
      data: { firstName: 'Ada' },
    });
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.gui-form-health-error')?.textContent).toContain(
        '[30] Widget "missing" could not be loaded',
      );
    });

    setFirstNameValue('Grace');
    fixture.detectChanges();
    formElement().dispatchEvent(new Event('submit', { cancelable: true }));

    expect(firstNameValue()).toBe('Grace');
    const { submits } = fixture.componentInstance;
    expect(submits).toHaveLength(1);
    expect(submits[0].data).toEqual({ firstName: 'Grace' });
  });
});

// Dev mode cannot be turned off again, so these tests run last in this file.
describe('a widget prop named like a widget field, in dev mode', () => {
  beforeAll(() => {
    enableDevMode();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws the error outside the render, so no fallback shows and the widget renders', () => {
    // The store subscription of the adapter throws, and rxjs throws the error again in a timer.
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    createForm(
      configWith({
        uid: 'lastName',
        kind: 'input',
        type: 'textinput',
        path: 'lastName',
        props: { path: 'x' },
      }),
    );
    fixture.detectChanges();

    expect(() => vi.runOnlyPendingTimers()).toThrow(
      '[GolemUI] Widget "lastName": prop keys [path] collide with widget fields',
    );
    expect(formElement().textContent).not.toContain('failed with:');
    expect(fixture.nativeElement.querySelector('input[name="lastName"]')).not.toBeNull();
    expect(firstNameValue()).toBe('Ada');
  });
});
