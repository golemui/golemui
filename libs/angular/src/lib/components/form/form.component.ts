import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  type OnDestroy,
  type OnInit,
  output,
  signal,
  type Type,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  type FormEvent,
  type FormHealth,
  formHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  getDirectionFromLanguage,
  shortUUID,
  type ValidatorFn,
  type WithWidget,
} from '@golemui/core';
import { share, switchMap, tap } from 'rxjs';
import { AngularFormContext } from '../../context/form.context';
import { WidgetDirective } from '../../directives/widget.directive';

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
  config = input.required<FormInitConfig<Type<WithWidget>>>();
  validators = input.required<ValidatorFn<any>>();
  autocomplete = input<string | undefined>(undefined);
  protected direction = signal<'ltr' | 'rtl'>('ltr');
  protected healthError = signal<string | null>(null);

  // OUTPUTS
  protected formHealth = output<FormHealth>();
  protected formEvent = output<FormEvent>();
  protected formSubmit = output<FormSubmitEvent>();

  // INJECTS
  protected context: AngularFormContext<Type<WithWidget>> = inject(AngularFormContext);

  // PRIVATE
  private destroyRef = inject(DestroyRef);
  private unsubscribeI18n: () => void = () => undefined;
  protected readonly _defaultFormName = shortUUID();

  // `tap()` runs synchronously before `switchMap` accesses the new store, ensuring
  // that `context.initialize()` always fires before we resubscribe to `formHealth`
  private config$ = toObservable(this.config).pipe(
    tap((c) => {
      this.unsubscribeI18n();
      this.context.initialize(
        c.widgetLoaders,
        c.middlewares ?? [],
        this.validators(),
        c.validateOn ?? 'eager',
        c.itemRenderers ?? {},
        c.localization,
        c.dependencies ?? {},
      );
      this.context.store.dispatch({
        type: 'INITIALIZE',
        payload: {
          formName: c.formName ?? this._defaultFormName,
          formDef: c.formDef,
        },
      });
      this.context.store.dispatch({
        type: 'SET_DATA',
        payload: { data: c.data ?? {} },
      });
      this.context.store.dispatch({
        type: 'SET_META',
        payload: { meta: c.meta ?? {} },
      });
      this.direction.set(getDirectionFromLanguage(this.context.localization.lang));
      this.unsubscribeI18n = this.context.localization.subscribe((lang) => {
        this.direction.set(getDirectionFromLanguage(lang));
        this.context.store.dispatch({
          type: 'SET_LANGUAGE',
          payload: { lang },
        });
      });
    }),
    share(),
  );

  ngOnInit(): void {
    // Resubscribe to the new store `formHealth` whenever config changes
    this.config$
      .pipe(
        switchMap(() => formHealth(this.context.store.state$)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((health) => {
        const message = health.status === 'errored' ? health.message : null;
        this.healthError.set(message);
        if (message) console.error('GolemUI form failed to initialize:', message);
        this.formHealth.emit(health);
      });

    this.configureLongLivedEvents();
  }

  /**
   * Stable events subscriptions.
   * ( Stable events are those that survive store replacements )
   */
  private configureLongLivedEvents() {
    this.context.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.formEvent.emit(event));

    this.context.submit$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.formSubmit.emit(event));
  }

  ngOnDestroy(): void {
    this.unsubscribeI18n();
  }

  setData(data: Record<string, any>): void {
    this.context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  }

  setMeta(meta: Record<string, any>): void {
    this.context.store.dispatch({ type: 'SET_META', payload: { meta } });
  }

  protected onFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.context.emitSubmitEvent();
  }
}
