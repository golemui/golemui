import { Component, signal, type Type, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type FormInitConfig,
  identityTranslator,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FormCoreComponent } from './components/form/form.component';
import {
  type InputAdapter,
  lastAdapter,
  noopValidators,
  recordedAdapters,
  renderRecords,
  stubWidgetLoaders,
} from './ssr.fixture';

/**
 * Counts the template evaluations of each widget after one store change and one change
 * detection pass, with a real store and the stub widgets of the fixture. It also lists the
 * widgets whose adapter got a new templateData object. The counts are exact, so a change of the
 * render behavior shows as a changed number.
 *
 * Every pass runs without the dev mode check pass, which evaluates the templates a second time.
 *
 * Run: npx vitest run --config libs/angular/vite.config.mts src/lib/render-counts.spec.ts
 */

type StubConfig = FormInitConfig<Type<WithWidget>>;

const rootLayout = (children: unknown[]) => ({
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const textInput = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid,
  kind: 'input',
  type: 'textinput',
  path: uid,
  ...extra,
});

const usersRepeater = {
  uid: 'users',
  kind: 'input',
  type: 'repeater',
  path: 'users',
  props: {
    template: {
      uid: 'userRow',
      kind: 'layout',
      type: 'flex',
      children: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' }],
    },
  },
};

const threeUsers = [{ name: 'Ada' }, { name: 'Grace' }, { name: 'Linus' }];

@Component({
  standalone: true,
  imports: [FormCoreComponent],
  template: `<gui-core-form [config]="config()" [validators]="validators" />`,
})
class FormHostComponent {
  config = signal<StubConfig>({ formDef: rootLayout([]), widgetLoaders: stubWidgetLoaders });
  validators = noopValidators;
  form = viewChild.required(FormCoreComponent);
}

let fixture: ComponentFixture<FormHostComponent> | null = null;

const mountForm = (config: StubConfig) => {
  const formFixture = TestBed.createComponent(FormHostComponent);
  fixture = formFixture;
  formFixture.componentInstance.config.set(config);
  formFixture.detectChanges(false);
  const form = () => formFixture.componentInstance.form();
  return {
    setData: (data: Record<string, unknown>) => {
      form().setData(data);
      formFixture.detectChanges(false);
    },
    setMeta: (meta: Record<string, unknown>) => {
      form().setMeta(meta);
      formFixture.detectChanges(false);
    },
  };
};

const typeInto = (uid: string, value: string) => {
  lastAdapter<InputAdapter<string>>(uid).valueChanged(value);
  fixture?.detectChanges(false);
};

const setLanguage = (translator: ReturnType<typeof identityTranslator>, lang: string) => {
  translator.setLang(lang);
  fixture?.detectChanges(false);
};

let firstCountedRecord = 0;
let templateDataAtStart = new Map<string, unknown>();

/** Counts only the template evaluations recorded after this call, and keeps each templateData. */
const startCounting = () => {
  firstCountedRecord = renderRecords.length;
  // A Map keeps the last value of a repeated key, which is the adapter of the current widget.
  templateDataAtStart = new Map(
    recordedAdapters.map(({ uid, adapter }) => [uid, (adapter as InputAdapter).templateData()]),
  );
};

/** @returns The uids of the widgets whose templateData is a new object since `startCounting`. */
const newTemplateDataSinceStart = () =>
  [...templateDataAtStart]
    .filter(([uid, templateData]) => lastAdapter<InputAdapter>(uid).templateData() !== templateData)
    .map(([uid]) => uid)
    .sort();

/** @returns The number of template evaluations per widget uid since `startCounting`. */
const rendersSinceStart = () => {
  const renders: Record<string, number> = {};
  for (const record of renderRecords.slice(firstCountedRecord)) {
    renders[record.uid] = (renders[record.uid] ?? 0) + 1;
  }
  return renders;
};

beforeAll(async () => {
  // Preloaded widgets are created in the same change detection pass, so no spec waits for a
  // dynamic import.
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  fixture?.destroy();
  fixture = null;
  recordedAdapters.length = 0;
  renderRecords.length = 0;
  firstCountedRecord = 0;
  templateDataAtStart = new Map();
});

// The form template reads `state$ | async`, which marks the form view on every store change, so
// every widget below it evaluates its template once per change.
describe('render counts', () => {
  const threeInputs = (extra: Record<string, unknown> = {}) => ({
    formDef: rootLayout([textInput('a'), textInput('b'), textInput('c', extra)]),
    widgetLoaders: stubWidgetLoaders,
    data: { a: 'A', b: 'B', c: 'C' },
  });

  it('evaluates no template in a change detection pass without a store change', () => {
    mountForm(threeInputs());
    startCounting();

    fixture?.detectChanges(false);

    expect(rendersSinceStart()).toEqual({});
  });

  it('renders every widget once on the first change, and gives every input new data', () => {
    mountForm(threeInputs());
    startCounting();

    typeInto('a', 'AB');

    expect(rendersSinceStart()).toEqual({ root: 1, a: 1, b: 1, c: 1 });
    // The form becomes touched, which changes the validation state of every input.
    expect(newTemplateDataSinceStart()).toEqual(['a', 'b', 'c']);
  });

  it('renders every widget once on a later change, and gives only the changed input new data', () => {
    mountForm(threeInputs());
    typeInto('a', 'AB');
    startCounting();

    typeInto('a', 'ABC');

    expect(rendersSinceStart()).toEqual({ root: 1, a: 1, b: 1, c: 1 });
    expect(newTemplateDataSinceStart()).toEqual(['a']);
  });

  it('gives only the input whose value setData changes new data', () => {
    const { setData } = mountForm(threeInputs());
    startCounting();

    setData({ a: 'A', b: 'B2', c: 'C' });

    expect(rendersSinceStart()).toEqual({ root: 1, a: 1, b: 1, c: 1 });
    expect(newTemplateDataSinceStart()).toEqual(['b']);
  });

  it('gives no widget new data when setMeta changes a key that no widget reads', () => {
    const { setMeta } = mountForm(threeInputs({ label: '{{$meta.title}}' }));
    startCounting();

    setMeta({ unread: 1 });

    expect(rendersSinceStart()).toEqual({ root: 1, a: 1, b: 1, c: 1 });
    expect(newTemplateDataSinceStart()).toEqual([]);

    setMeta({ title: 'Title' });

    expect(newTemplateDataSinceStart()).toEqual(['c']);
  });

  it('gives only the repeater and the changed input new data when one row changes', () => {
    mountForm({
      formDef: rootLayout([usersRepeater]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: threeUsers },
    });
    // The first change touches the form, which gives every input new data.
    typeInto('name[1]', 'Grace H');
    startCounting();

    typeInto('name[1]', 'Grace Ho');

    expect(rendersSinceStart()).toEqual({
      root: 1,
      users: 1,
      'userRow[0]': 1,
      'name[0]': 1,
      'userRow[1]': 1,
      'name[1]': 1,
      'userRow[2]': 1,
      'name[2]': 1,
    });
    expect(newTemplateDataSinceStart()).toEqual(['name[1]', 'users']);
  });

  it('renders every widget once and gives every widget new data when the language changes', () => {
    const translator = identityTranslator('en-US');
    mountForm({
      formDef: rootLayout([textInput('a'), textInput('b'), usersRepeater]),
      widgetLoaders: stubWidgetLoaders,
      data: { a: 'A', b: 'B', users: threeUsers.slice(0, 2) },
      localization: translator,
    });
    startCounting();

    setLanguage(translator, 'es');

    const everyWidget = [
      'a',
      'b',
      'name[0]',
      'name[1]',
      'root',
      'userRow[0]',
      'userRow[1]',
      'users',
    ];
    expect(rendersSinceStart()).toEqual(Object.fromEntries(everyWidget.map((uid) => [uid, 1])));
    expect(newTemplateDataSinceStart()).toEqual(everyWidget);
  });

  it('gives only the layout new data when a child is hidden', () => {
    const { setData } = mountForm({
      formDef: rootLayout([
        textInput('a'),
        textInput('b'),
        textInput('hidden', { exclude: { when: '$form.hide === true' } }),
      ]),
      widgetLoaders: stubWidgetLoaders,
      data: { a: 'A', b: 'B' },
    });
    startCounting();

    setData({ a: 'A', b: 'B', hide: true });

    expect(rendersSinceStart()).toEqual({ root: 1, a: 1, b: 1 });
    // The hidden input gets new data once more before its component is destroyed, so it is
    // left out.
    expect(newTemplateDataSinceStart().filter((uid) => uid !== 'hidden')).toEqual(['root']);
  });
});
