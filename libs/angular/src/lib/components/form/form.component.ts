import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  Type,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as Core from '@golemui/core';
import { AngularFormContext } from '../../context/form.context';
import { WidgetDirective } from '../../directives/widget.directive';

type JsonStringified = string;
type JsonObject = Record<string, any>;

@Component({
  selector: 'gui-core-form',
  standalone: true,
  templateUrl: './form.component.html',
  imports: [CommonModule, WidgetDirective],
  providers: [AngularFormContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gui-form',
  },
})
export class FormCoreComponent implements OnInit, OnDestroy {
  // INPUTS
  formDef = input.required<JsonStringified | JsonObject>();
  widgetLoaders = input.required<Core.WidgetLoaders<Type<Core.WithWidget>>>();
  validators = input.required<Core.ValidatorFn<any>>();
  middlewares = input<Core.Middleware<Core.State, Core.Action>[]>([]);
  data = input<Record<string, any>>({});
  formName = input(Core.shortUUID());
  validateOn = input<Core.ValidateOn>('eager');
  itemRenderers = input<Record<string, Core.ItemRenderer>>({});
  localization = input<Core.I18nTranslator>();
  dependencies = input<Record<string, unknown>>({});
  direction = signal<'ltr' | 'rtl'>('ltr');

  // OUTPUTS
  protected formHealth = output<Core.FormHealth>();
  protected formEvent = output<Core.FormEvent>();

  // INJECTS
  protected context: AngularFormContext<Type<Core.WithWidget>> = inject(AngularFormContext);

  // PRIVATE
  private destroyRef = inject(DestroyRef);
  private unsubscribeI18n: () => void = () => undefined;
  private _formDefInitialized = false;

  constructor() {
    effect(() => {
      const formDef = this.formDef();
      if (!this._formDefInitialized) {
        this._formDefInitialized = true;
        return;
      }
      this.context.store.dispatch({
        type: 'INITIALIZE',
        payload: { formName: this.formName(), formDef },
      });
      this.context.store.dispatch({
        type: 'SET_DATA',
        payload: { data: this.data() },
      });
    });
  }

  // LIFE CYCLE
  ngOnInit(): void {
    this.context.initialize(
      this.widgetLoaders(),
      this.middlewares(),
      this.validators(),
      this.validateOn(),
      this.itemRenderers(),
      this.localization(),
      this.dependencies() || {},
    );

    Core.formHealth(this.context.store.state$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((health) => this.formHealth.emit(health));

    this.context.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.formEvent.emit(event));

    this.context.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: this.formName(),
        formDef: this.formDef(),
      },
    });

    this.context.store.dispatch({
      type: 'SET_DATA',
      payload: {
        data: this.data(),
      },
    });

    this.direction.set(Core.getDirectionFromLanguage(this.context.localization.lang));

    this.unsubscribeI18n = this.context.localization.subscribe((lang) => {
      this.direction.set(Core.getDirectionFromLanguage(lang));
      this.context.store.dispatch({
        type: 'SET_LANGUAGE',
        payload: {
          lang,
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeI18n();
  }
}
