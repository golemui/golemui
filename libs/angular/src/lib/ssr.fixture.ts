import {
  Component,
  Directive,
  inject,
  type OnDestroy,
  type OnInit,
  type Type,
} from '@angular/core';
import type {
  ActionWidget,
  DisplayWidget,
  FormEvent,
  FormHealth,
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { ActionWidgetAdapter } from './adapters/action-widget-adapter.service';
import { type BaseWidgetAdapter } from './adapters/base-widget.adapter';
import { DisplayWidgetAdapter } from './adapters/display-widget-adapter.service';
import { InputWidgetAdapter } from './adapters/input-widget-adapter.service';
import { LayoutWidgetAdapter } from './adapters/layout-widget-adapter.service';
import { FormCoreComponent } from './components/form/form.component';
import { WidgetDirective } from './directives/widget.directive';

/**
 * Stub widgets and a form definition shared by the server render specs and the adapter specs.
 *
 * The widgets use the real adapters and the real WidgetDirective, so a value that reaches
 * the markup was read from the store through the same path the shipped widgets use.
 */

/** The adapter of the stub textinput and repeater widgets. */
export type InputAdapter<T = unknown> = InputWidgetAdapter<T, Record<string, any>>;
/** The adapter of the stub button widget. */
export type ActionAdapter = ActionWidgetAdapter<Record<string, any>>;
/** The adapter of the stub flex widget and of repeater rows. */
export type LayoutAdapter = LayoutWidgetAdapter<Record<string, any>>;
/** The adapter of the stub text widget. */
export type DisplayAdapter = DisplayWidgetAdapter<Record<string, any>>;

/** One stub widget created: the widget uid and its adapter. */
export type AdapterRecord = { uid: string; adapter: unknown };

/** One record per stub widget created, in creation order. Clear it between specs. */
export const recordedAdapters: AdapterRecord[] = [];

/**
 * @param uid - The uid of the widget, with row indexes inside a repeater row.
 * @returns The adapter of the last widget created with that uid. Its templateData signal holds
 * the current values.
 */
export function lastAdapter<Adapter>(uid: string): Adapter {
  for (let index = recordedAdapters.length - 1; index >= 0; index--) {
    if (recordedAdapters[index].uid === uid) {
      return recordedAdapters[index].adapter as Adapter;
    }
  }
  throw new Error(`No widget with the uid "${uid}" was created`);
}

/** One evaluation of the template of a stub widget. */
export type RenderRecord = { uid: string };

/** One record per template evaluation of a stub widget, in render order. Clear it between specs. */
export const renderRecords: RenderRecord[] = [];

/**
 * Starts the adapter of a stub widget and records it in `recordedAdapters`. Its template calls
 * `recordRender`, which records each template evaluation in `renderRecords`.
 */
@Directive()
abstract class StubWidgetComponent<Widget extends NonFunctionWidget>
  implements OnInit, OnDestroy, WithWidget
{
  widget!: Widget;
  protected abstract adapter: BaseWidgetAdapter<Widget> & { init(widget: Widget): void };

  ngOnInit(): void {
    this.adapter.init(this.widget);
    recordedAdapters.push({ uid: this.widget.uid, adapter: this.adapter });
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  /**
   * Bound to the id of the root element, so Angular calls it each time it evaluates the template.
   *
   * @returns The widget uid.
   */
  protected recordRender(): string {
    renderRecords.push({ uid: this.widget.uid });
    return this.widget.uid;
  }
}

@Component({
  standalone: true,
  selector: 'gui-stub-textinput',
  providers: [InputWidgetAdapter],
  template: `<input
    type="text"
    [id]="recordRender()"
    [name]="widget.path"
    [attr.data-label]="adapter.templateData().label"
    [value]="adapter.templateData().value ?? ''"
    readonly
  />`,
})
class StubTextInputComponent extends StubWidgetComponent<InputWidget<string>> {
  protected adapter: InputWidgetAdapter<string, Record<string, any>> = inject(InputWidgetAdapter);
}

@Component({
  standalone: true,
  selector: 'gui-stub-flex',
  imports: [WidgetDirective],
  providers: [LayoutWidgetAdapter],
  template: `<div class="stub-flex" [id]="recordRender()">
    @for (child of adapter.templateData().children; track child.uid) {
      <ng-container guiWidget [widget]="child" />
    }
  </div>`,
})
class StubFlexComponent extends StubWidgetComponent<LayoutWidget> {
  protected adapter: LayoutWidgetAdapter<Record<string, any>> = inject(LayoutWidgetAdapter);
}

/** Renders one row layout per row of its array value. */
@Component({
  standalone: true,
  selector: 'gui-stub-repeater',
  imports: [WidgetDirective],
  providers: [InputWidgetAdapter],
  template: `<div class="stub-repeater" [id]="recordRender()">
    @for (row of adapter.templateData().rows ?? []; track row.uid) {
      <ng-container guiWidget [widget]="row" />
    }
  </div>`,
})
class StubRepeaterComponent extends StubWidgetComponent<InputWidget<unknown[]>> {
  protected adapter: InputWidgetAdapter<unknown[], Record<string, any>> =
    inject(InputWidgetAdapter);
}

/** A plain button, so a click never submits the form. */
@Component({
  standalone: true,
  selector: 'gui-stub-button',
  providers: [ActionWidgetAdapter],
  // A line break inside the button would add whitespace to its text.
  // prettier-ignore
  template: `<button type="button" [id]="recordRender()">{{ adapter.templateData().label }}</button>`,
})
class StubButtonComponent extends StubWidgetComponent<ActionWidget> {
  protected adapter: ActionWidgetAdapter<Record<string, any>> = inject(ActionWidgetAdapter);
}

@Component({
  standalone: true,
  selector: 'gui-stub-text',
  providers: [DisplayWidgetAdapter],
  template: `<p [id]="recordRender()">{{ adapter.templateData().text }}</p>`,
})
class StubTextComponent extends StubWidgetComponent<DisplayWidget> {
  protected adapter: DisplayWidgetAdapter<Record<string, any>> = inject(DisplayWidgetAdapter);
}

export const stubWidgetLoaders = {
  textinput: async (): Promise<Type<WithWidget>> => StubTextInputComponent,
  flex: async (): Promise<Type<WithWidget>> => StubFlexComponent,
  repeater: async (): Promise<Type<WithWidget>> => StubRepeaterComponent,
  button: async (): Promise<Type<WithWidget>> => StubButtonComponent,
  text: async (): Promise<Type<WithWidget>> => StubTextComponent,
};

/** Accepts everything. The specs assert on markup, not on validation. */
export const noopValidators: ValidatorFn<any> = () =>
  ({
    '~standard': {
      version: 1,
      vendor: 'golemui-ssr-fixture',
      validate: (value: unknown) => ({ value }),
    },
  }) as ReturnType<ValidatorFn<any>>;

export const formDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      // The `load` handler lets the specs pin down when the event fires: never on the server,
      // once the client has rendered.
      {
        kind: 'input',
        type: 'textinput',
        path: 'firstName',
        label: 'First name',
        on: { load: 'stubLoaded' },
      },
      { kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
    ],
  },
};

export const formData = { firstName: 'Ada', lastName: 'Lovelace' };

/** An explicit formName keeps the form id identical on the server and the client. */
export function buildConfig(): FormInitConfig<Type<WithWidget>> {
  return {
    formDef,
    formName: 'ssr-spec-form',
    widgetLoaders: stubWidgetLoaders,
    data: formData,
  };
}

/**
 * The root component that the specs pass to `renderApplication` and `bootstrapApplication`.
 *
 * Every host below reuses this selector, so all specs share one host document and can compare
 * the markup of two hosts byte for byte.
 */
@Component({
  standalone: true,
  selector: 'gui-ssr-host',
  imports: [FormCoreComponent],
  template: `<gui-core-form [config]="config" [validators]="validators" />`,
})
export class SsrHostComponent {
  config = buildConfig();
  validators = noopValidators;
}

/** Events the recording host received. Specs reset it with `recordedFormEvents.length = 0`. */
export const recordedFormEvents: FormEvent[] = [];

/** Same form as `SsrHostComponent`, plus a `formEvent` listener feeding `recordedFormEvents`. */
@Component({
  standalone: true,
  selector: 'gui-ssr-host',
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config"
    [validators]="validators"
    (formEvent)="onFormEvent($event)"
  />`,
})
export class SsrEventRecordingHostComponent {
  config = buildConfig();
  validators = noopValidators;

  onFormEvent(event: FormEvent) {
    recordedFormEvents.push(event);
  }
}

/**
 * Loader functions with fresh identities, so no preload call has ever resolved them. They
 * never resolve, which keeps a server render deterministic: the widgets stay absent instead
 * of racing the serializer.
 */
export const notPreloadedWidgetLoaders = {
  textinput: (): Promise<Type<WithWidget>> => new Promise(() => undefined),
  flex: (): Promise<Type<WithWidget>> => new Promise(() => undefined),
};

/** Same form as `SsrHostComponent`, but none of its widgets can be read synchronously. */
@Component({
  standalone: true,
  selector: 'gui-ssr-host',
  imports: [FormCoreComponent],
  template: `<gui-core-form [config]="config" [validators]="validators" />`,
})
export class SsrNotPreloadedHostComponent {
  config = { ...buildConfig(), widgetLoaders: notPreloadedWidgetLoaders };
  validators = noopValidators;
}

/** Health values the health host received. Specs reset it with `recordedFormHealth.length = 0`. */
export const recordedFormHealth: FormHealth[] = [];

/** Same form as `SsrHostComponent`, plus a `formHealth` listener feeding `recordedFormHealth`. */
@Component({
  standalone: true,
  selector: 'gui-ssr-host',
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config"
    [validators]="validators"
    (formHealth)="onFormHealth($event)"
  />`,
})
export class SsrHealthHostComponent {
  config = buildConfig();
  validators = noopValidators;

  onFormHealth(health: FormHealth) {
    recordedFormHealth.push(health);
  }
}

/** Same as `SsrHealthHostComponent`, but two widgets share one uid, so the form is errored. */
@Component({
  standalone: true,
  selector: 'gui-ssr-host',
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config"
    [validators]="validators"
    (formHealth)="onFormHealth($event)"
  />`,
})
export class SsrDuplicateUidHostComponent {
  config: FormInitConfig<Type<WithWidget>> = {
    ...buildConfig(),
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'flex',
        children: [
          { kind: 'input', type: 'textinput', path: 'firstName', uid: 'same-uid' },
          { kind: 'input', type: 'textinput', path: 'lastName', uid: 'same-uid' },
        ],
      },
    },
  };
  validators = noopValidators;

  onFormHealth(health: FormHealth) {
    recordedFormHealth.push(health);
  }
}
