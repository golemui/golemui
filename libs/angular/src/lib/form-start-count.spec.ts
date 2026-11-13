import { TestBed } from '@angular/core/testing';
import {
  type Action,
  type FormHealth,
  type Middleware,
  preloadFormWidgets,
  type State,
  type ValidatorFn,
} from '@golemui/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FormCoreComponent } from './components/form/form.component';
import {
  provideWidgetSet,
  WidgetSetFormComponent,
} from './components/form/widget-set-form.component';
import { buildConfig, formDef, noopValidators, stubWidgetLoaders } from './ssr.fixture';

/** What the form did while it started: the stores it created, the actions and the health values. */
type StartRecord = {
  storesCreated: number;
  actionTypes: string[];
  healthValues: FormHealth[];
};

const createStartRecord = (): StartRecord => ({
  storesCreated: 0,
  actionTypes: [],
  healthValues: [],
});

const clearStartRecord = (record: StartRecord) => {
  record.storesCreated = 0;
  record.actionTypes.length = 0;
  record.healthValues.length = 0;
};

// The store calls the outer function of a middleware one time when it is created, so each call
// is one run of `initialize`.
const recordingMiddleware =
  (record: StartRecord): Middleware<State, Action> =>
  () => {
    record.storesCreated += 1;
    return (next) => (action) => {
      record.actionTypes.push(action.type);
      next(action);
    };
  };

const countActions = (record: StartRecord, actionType: string) =>
  record.actionTypes.filter((type) => type === actionType).length;

// One object, so a failure shows every count at once.
const expectOneStart = (record: StartRecord) => {
  expect({
    storesCreated: record.storesCreated,
    initializeActions: countActions(record, 'INITIALIZE'),
    setDataActions: countActions(record, 'SET_DATA'),
    setMetaActions: countActions(record, 'SET_META'),
    healthValues: record.healthValues,
  }).toEqual({
    storesCreated: 1,
    initializeActions: 1,
    setDataActions: 1,
    setMetaActions: 1,
    healthValues: [{ status: 'ok' }],
  });
};

// A new function on each call, like the validator factory of the gui widget set.
const createValidators = (): ValidatorFn<any> => (validator, localization) =>
  noopValidators(validator, localization);

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  TestBed.resetTestingModule();
});

describe('gui-widget-set-form starts the form one time for one config', () => {
  const createWidgetSetForm = (record: StartRecord) => {
    TestBed.configureTestingModule({
      providers: [
        provideWidgetSet({ widgetLoaders: stubWidgetLoaders, validators: createValidators }),
      ],
    });
    const fixture = TestBed.createComponent(WidgetSetFormComponent);
    fixture.componentInstance.formHealth.subscribe((health) => record.healthValues.push(health));
    fixture.componentRef.setInput('config', {
      formDef,
      data: { firstName: 'Ada' },
      middlewares: [recordingMiddleware(record)],
    });
    return fixture;
  };

  it('starts the form one time when it first renders', () => {
    const record = createStartRecord();
    const fixture = createWidgetSetForm(record);

    fixture.detectChanges();

    expectOneStart(record);
  });

  it('starts the form again one time for a new config object', () => {
    const record = createStartRecord();
    const fixture = createWidgetSetForm(record);
    fixture.detectChanges();
    clearStartRecord(record);

    fixture.componentRef.setInput('config', {
      formDef,
      data: { firstName: 'Bob' },
      middlewares: [recordingMiddleware(record)],
    });
    fixture.detectChanges();

    expectOneStart(record);
  });
});

describe('gui-core-form starts the form one time for one input change', () => {
  const createCoreForm = (record: StartRecord) => {
    const fixture = TestBed.createComponent(FormCoreComponent);
    fixture.componentInstance['formHealth'].subscribe((health) => record.healthValues.push(health));
    fixture.componentRef.setInput('config', {
      ...buildConfig(),
      middlewares: [recordingMiddleware(record)],
    });
    fixture.componentRef.setInput('validators', createValidators());
    fixture.detectChanges();
    clearStartRecord(record);
    return fixture;
  };

  it('starts the form again one time for a new config alone', () => {
    const record = createStartRecord();
    const fixture = createCoreForm(record);

    fixture.componentRef.setInput('config', {
      ...buildConfig(),
      data: { firstName: 'Bob' },
      middlewares: [recordingMiddleware(record)],
    });
    fixture.detectChanges();

    expectOneStart(record);
  });

  it('starts the form again one time for a new validators value alone', () => {
    const record = createStartRecord();
    const fixture = createCoreForm(record);

    fixture.componentRef.setInput('validators', createValidators());
    fixture.detectChanges();

    expectOneStart(record);
  });

  it('starts the form again one time when config and validators change together', () => {
    const record = createStartRecord();
    const fixture = createCoreForm(record);

    fixture.componentRef.setInput('config', {
      ...buildConfig(),
      data: { firstName: 'Bob' },
      middlewares: [recordingMiddleware(record)],
    });
    fixture.componentRef.setInput('validators', createValidators());
    fixture.detectChanges();

    expectOneStart(record);
  });
});
