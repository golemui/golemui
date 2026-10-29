import {
  type ApplicationRef,
  Component,
  inject,
  NgZone,
  type OnInit,
  provideZonelessChangeDetection,
  type Type,
  viewChild,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type {
  ActionWidget,
  FormEvent,
  FormInitConfig,
  FormSubmitEvent,
  InputWidget,
  WithWidget,
} from '@golemui/core';
import { afterEach, describe, expect, it } from 'vitest';
import { ActionWidgetAdapter } from './adapters/action-widget-adapter.service';
import { InputWidgetAdapter } from './adapters/input-widget-adapter.service';
import { FormCoreComponent } from './components/form/form.component';
import { noopValidators, stubWidgetLoaders } from './ssr.fixture';

/**
 * Runs a form in an app bootstrapped with zoneless change detection, as the Analog apps are. No
 * test calls a change detection pass: every update must come from the signals and the scheduler.
 *
 * Run: npx vitest run --config libs/angular/vite.config.mts src/lib/zoneless.spec.ts
 */

@Component({
  standalone: true,
  selector: 'gui-zoneless-editable-textinput',
  providers: [InputWidgetAdapter],
  template: `<input
    type="text"
    [id]="widget.uid"
    [value]="adapter.templateData().value ?? ''"
    (input)="adapter.valueChanged($any($event.target).value)"
  />`,
})
class EditableTextInputComponent implements OnInit, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, Record<string, any>> = inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }
}

@Component({
  standalone: true,
  selector: 'gui-zoneless-button',
  providers: [ActionWidgetAdapter],
  template: `<button type="button" [id]="widget.uid" (click)="adapter.click()">
    {{ adapter.templateData().label }}
  </button>`,
})
class ButtonComponent implements OnInit, WithWidget {
  widget!: ActionWidget;
  protected adapter: ActionWidgetAdapter<Record<string, any>> = inject(ActionWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }
}

/** Resolves the lazy loaders of the last mounted form. */
let releaseLazyWidgets: () => void = () => undefined;

// New loader functions on every mount, so no earlier form has loaded them. They resolve when the
// test releases them, like a dynamic import that finishes after the first render.
const lazyWidgetLoaders = () => {
  const released = new Promise<void>((resolve) => {
    releaseLazyWidgets = resolve;
  });
  const lazy = (component: Type<WithWidget>) => (): Promise<Type<WithWidget>> =>
    released.then(() => component);
  return {
    flex: stubWidgetLoaders.flex,
    // The read-only stub input of the fixture: it shows the stored value of the same path.
    mirror: stubWidgetLoaders.textinput,
    editable: lazy(EditableTextInputComponent),
    button: lazy(ButtonComponent),
  };
};

const config = (): FormInitConfig<Type<WithWidget>> => ({
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: 'firstName',
          kind: 'input',
          type: 'editable',
          path: 'firstName',
          on: { load: 'firstNameLoaded', change: 'firstNameChanged' },
        },
        { uid: 'firstNameMirror', kind: 'input', type: 'mirror', path: 'firstName' },
        {
          uid: 'send',
          kind: 'action',
          type: 'button',
          label: 'Send',
          on: { click: 'sendClicked' },
        },
      ],
    },
  },
  data: { firstName: 'Ada' },
  widgetLoaders: lazyWidgetLoaders(),
});

const formEvents: FormEvent[] = [];
const formSubmits: FormSubmitEvent[] = [];

@Component({
  standalone: true,
  selector: 'gui-zoneless-host',
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config"
    [validators]="validators"
    (formEvent)="onFormEvent($event)"
    (formSubmit)="onFormSubmit($event)"
  />`,
})
class ZonelessHostComponent {
  config = config();
  validators = noopValidators;
  form = viewChild.required(FormCoreComponent);
  onFormEvent(event: FormEvent) {
    formEvents.push(event);
  }
  onFormSubmit(event: FormSubmitEvent) {
    formSubmits.push(event);
  }
}

const macrotask = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Waits macrotask by macrotask, without a change detection call, until the check passes. */
async function waitUntil(check: () => boolean) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (check()) {
      return;
    }
    await macrotask();
  }
  throw new Error('the condition did not become true');
}

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

describe('a form in a zoneless app', () => {
  let appRef: ApplicationRef | undefined;

  const bootstrap = async ({ releaseWidgets = true } = {}) => {
    formEvents.length = 0;
    formSubmits.length = 0;
    document.body.innerHTML = '<gui-zoneless-host></gui-zoneless-host>';
    appRef = await bootstrapApplication(ZonelessHostComponent, {
      providers: [provideZonelessChangeDetection()],
    });
    if (releaseWidgets) {
      releaseLazyWidgets();
    }
    const host = appRef.components[0].instance as ZonelessHostComponent;
    return { appRef, form: () => host.form() };
  };

  afterEach(() => {
    appRef?.destroy();
    appRef = undefined;
    document.body.innerHTML = '';
  });

  it('runs without zone change detection', async () => {
    const { appRef } = await bootstrap();

    // Zoneless change detection provides a no-op zone, which only implements the NgZone type.
    expect(appRef.injector.get(NgZone)).not.toBeInstanceOf(NgZone);
  });

  it('renders the lazily loaded widgets once their loaders resolve', async () => {
    await bootstrap({ releaseWidgets: false });
    await macrotask();
    expect(element('firstName')).toBeNull();

    releaseLazyWidgets();
    await waitUntil(() => element('firstName') !== null && element('send') !== null);

    expect(element<HTMLInputElement>('firstName')?.value).toBe('Ada');
    expect(element('send')?.textContent?.trim()).toBe('Send');
    await waitUntil(() => formEvents.length > 0);
    expect(formEvents.map((event) => event.name)).toEqual(['firstNameLoaded']);
  });

  it('stores a typed value and renders it in the other widget of the same path', async () => {
    const { form } = await bootstrap();
    await waitUntil(() => element('firstName') !== null);

    const input = element<HTMLInputElement>('firstName') as HTMLInputElement;
    input.value = 'Grace';
    input.dispatchEvent(new Event('input'));
    await waitUntil(() => element<HTMLInputElement>('firstNameMirror')?.value === 'Grace');

    expect(formEvents.at(-1)).toEqual(expect.objectContaining({ name: 'firstNameChanged' }));
    document.querySelector('form')?.requestSubmit();
    await waitUntil(() => formSubmits.length > 0);
    expect(formSubmits[0].data).toEqual({ firstName: 'Grace' });
    expect(form()).toBeInstanceOf(FormCoreComponent);
  });

  it('renders the data of setData in every widget', async () => {
    const { form } = await bootstrap();
    await waitUntil(() => element('firstName') !== null);

    form().setData({ firstName: 'Linus' });
    await waitUntil(() => element<HTMLInputElement>('firstNameMirror')?.value === 'Linus');

    expect(element<HTMLInputElement>('firstName')?.value).toBe('Linus');
  });

  it('emits the click event of a lazily loaded button', async () => {
    await bootstrap();
    await waitUntil(() => element('send') !== null);

    element('send')?.click();

    expect(formEvents.at(-1)).toEqual(expect.objectContaining({ name: 'sendClicked' }));
  });
});
