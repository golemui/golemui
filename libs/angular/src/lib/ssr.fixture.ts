import { Component, inject, type OnDestroy, type OnInit, type Type } from '@angular/core';
import type {
  FormEvent,
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { InputWidgetAdapter } from './adapters/input-widget-adapter.service';
import { LayoutWidgetAdapter } from './adapters/layout-widget-adapter.service';
import { FormCoreComponent } from './components/form/form.component';
import { WidgetDirective } from './directives/widget.directive';

/**
 * Stub widgets and a form definition shared by the server render specs.
 *
 * The widgets use the real adapters and the real WidgetDirective, so a value that reaches
 * the markup was read from the store through the same path the shipped widgets use.
 */

@Component({
  standalone: true,
  selector: 'gui-stub-textinput',
  providers: [InputWidgetAdapter],
  template: `<input
    type="text"
    [id]="widget.uid"
    [name]="widget.path"
    [attr.data-label]="adapter.templateData().label"
    [value]="adapter.templateData().value ?? ''"
    readonly
  />`,
})
class StubTextInputComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, Record<string, any>> = inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}

@Component({
  standalone: true,
  selector: 'gui-stub-flex',
  imports: [WidgetDirective],
  providers: [LayoutWidgetAdapter],
  template: `<div class="stub-flex" [id]="widget.uid">
    @for (child of adapter.templateData().children; track child.uid) {
      <ng-container guiWidget [widget]="child" />
    }
  </div>`,
})
class StubFlexComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;
  protected adapter: LayoutWidgetAdapter<Record<string, any>> = inject(LayoutWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}

export const stubWidgetLoaders = {
  textinput: async (): Promise<Type<WithWidget>> => StubTextInputComponent,
  flex: async (): Promise<Type<WithWidget>> => StubFlexComponent,
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
