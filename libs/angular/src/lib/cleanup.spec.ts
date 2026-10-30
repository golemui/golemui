import { Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type I18nTranslator,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormCoreComponent } from './components/form/form.component';
import {
  buildConfig,
  type InputAdapter,
  lastAdapter,
  noopValidators,
  recordedAdapters,
  stubWidgetLoaders,
} from './ssr.fixture';

type StubConfig = FormInitConfig<Type<WithWidget>>;

@Component({
  standalone: true,
  selector: 'gui-slow-widget',
  template: `<span class="slow-widget"></span>`,
})
class SlowWidgetComponent implements WithWidget {
  static createdCount = 0;
  widget!: WithWidget['widget'];

  constructor() {
    SlowWidgetComponent.createdCount++;
  }
}

/** A widget loader that resolves only when the test says so. */
function deferredLoader() {
  const loader = {
    started: false,
    resolve: (_component: Type<WithWidget>) => undefined as void,
    load: () =>
      new Promise<Type<WithWidget>>((resolve) => {
        loader.started = true;
        loader.resolve = resolve;
      }),
  };
  return loader;
}

/** A new loader function per test, because the widget registry caches a load by its loader. */
const configWithSlowWidget = (load: () => Promise<Type<WithWidget>>): StubConfig => ({
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [{ uid: 'slow', kind: 'input', type: 'slow', path: 'slow' }],
    },
  },
  widgetLoaders: { ...stubWidgetLoaders, slow: load },
});

const configWithChangeEvent = (): StubConfig => ({
  formDef: {
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
  },
  widgetLoaders: stubWidgetLoaders,
  data: { firstName: 'Ada' },
});

const spyTranslator = () => {
  const unsubscribe = vi.fn();
  const translator: I18nTranslator = {
    lang: 'en',
    translate: (key, _params, defaultValue) => defaultValue ?? key,
    subscribe: vi.fn(() => unsubscribe),
  };
  return { translator, unsubscribe };
};

@Component({
  standalone: true,
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config()"
    [validators]="validators"
    (formEvent)="events.push($event)"
    (formHealth)="healths.push($event)"
  />`,
})
class FormHostComponent {
  config = signal<StubConfig>(buildConfig());
  validators = noopValidators;
  events: FormEvent[] = [];
  healths: FormHealth[] = [];
}

let fixture: ComponentFixture<FormHostComponent>;
let isDestroyed = false;
let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

const mountForm = (config: StubConfig) => {
  fixture = TestBed.createComponent(FormHostComponent);
  fixture.componentInstance.config.set(config);
  fixture.detectChanges();
};

const destroyForm = () => {
  if (!isDestroyed) {
    isDestroyed = true;
    fixture.destroy();
  }
};

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

beforeEach(() => {
  recordedAdapters.length = 0;
  isDestroyed = false;
  SlowWidgetComponent.createdCount = 0;
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  destroyForm();
  vi.restoreAllMocks();
});

describe('a widget load that ends after the form is destroyed', () => {
  it('renders the widget when the load resolves while the form exists', async () => {
    const loader = deferredLoader();
    mountForm(configWithSlowWidget(loader.load));
    await vi.waitFor(() => expect(loader.started).toBe(true));

    loader.resolve(SlowWidgetComponent);

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.slow-widget')).not.toBeNull();
    });
    expect(SlowWidgetComponent.createdCount).toBe(1);
  });

  it('creates no widget component and logs nothing when the load resolves after the destroy', async () => {
    const loader = deferredLoader();
    mountForm(configWithSlowWidget(loader.load));
    await vi.waitFor(() => expect(loader.started).toBe(true));
    destroyForm();

    loader.resolve(SlowWidgetComponent);
    // Gives the resolved load time to run its continuation.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(SlowWidgetComponent.createdCount).toBe(0);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});

describe('the host outputs after the form is destroyed', () => {
  it('emit no form event and no health for a widget call or an event callback', () => {
    mountForm(configWithChangeEvent());
    const host = fixture.componentInstance;
    const firstName = lastAdapter<InputAdapter<string>>('firstName');
    firstName.valueChanged('Grace');
    expect(host.events).toHaveLength(1);
    const event = host.events[0];
    const healthCountBeforeDestroy = host.healths.length;

    destroyForm();
    firstName.valueChanged('Linus');
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { uid: 'firstName', prop: 'label', value: 'Name' },
    });

    expect(host.events).toHaveLength(1);
    expect(host.healths).toHaveLength(healthCountBeforeDestroy);
  });
});

describe('the translator listener', () => {
  it('is added once on mount and removed on destroy', () => {
    const { translator, unsubscribe } = spyTranslator();
    mountForm({ ...buildConfig(), localization: translator });

    expect(translator.subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    destroyForm();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('is removed when a new config replaces the form, and the new translator gets a listener', () => {
    const first = spyTranslator();
    const second = spyTranslator();
    mountForm({ ...buildConfig(), localization: first.translator });

    fixture.componentInstance.config.set({ ...buildConfig(), localization: second.translator });
    fixture.detectChanges();

    expect(first.unsubscribe).toHaveBeenCalledTimes(1);
    expect(second.translator.subscribe).toHaveBeenCalledTimes(1);
    expect(second.unsubscribe).not.toHaveBeenCalled();
  });
});
