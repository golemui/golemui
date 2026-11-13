import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { Observable, share, switchMap, tap } from 'rxjs';
import { AngularFormContext } from '../../context/form.context';
import { WidgetDirective } from '../../directives/widget.directive';
import { DefaultFormHealthBoundaryComponent } from './default-form-health-boundary.component';

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
  /**
   * Wraps the form and renders the error UI for an errored {@link FormHealth}.
   * Defaults to {@link DefaultFormHealthBoundaryComponent} (a red banner).
   */
  formHealthBoundary = input<Type<unknown> | undefined>(undefined);
  protected effectiveHealthBoundary = computed(
    () => this.formHealthBoundary() ?? DefaultFormHealthBoundaryComponent,
  );
  protected direction = signal<'ltr' | 'rtl'>('ltr');
  protected health = signal<FormHealth>({ status: 'ok' });

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
  // Keys the widget tree in the template. Every initialization bumps it, so the whole tree
  // is destroyed and recreated and every widget subscribes to the store INITIALIZE ran on.
  protected storeGeneration = signal(0);
  // False until the first INITIALIZE ran. The calls before it wait for the store, and an early
  // setHealth call also waits for the first health value.
  // Not a signal: `setData` reads it, and an effect that calls `setData` must not depend on it.
  private started = false;
  private dataBeforeStart: Record<string, any> | undefined;
  private metaBeforeStart: Record<string, any> | undefined;
  private healthBeforeStart: FormHealth | undefined;

  // One signal reads both inputs, so a change of both in the same change detection pass starts
  // the form one time. With one observable for each input, it starts once for each changed input.
  private startInputs = computed(() => ({ config: this.config(), validators: this.validators() }));

  // `tap()` runs synchronously before `switchMap` accesses the new store, ensuring
  // that `context.initialize()` always fires before we resubscribe to `formHealth`
  private config$ = toObservable(this.startInputs).pipe(
    tap(({ config: c, validators }) => {
      this.unsubscribeI18n();
      this.context.initialize(
        c.widgetLoaders,
        c.middlewares ?? [],
        validators,
        c.validateOn ?? 'eager',
        c.itemRenderers ?? {},
        c.localization,
        c.dependencies ?? {},
        c.functions ?? {},
        c.expressionPolicy ?? 'warn',
      );
      this.storeGeneration.update((generation) => generation + 1);
      this.context.store.dispatch({
        type: 'INITIALIZE',
        payload: {
          formName: c.formName ?? this._defaultFormName,
          formDef: c.formDef,
        },
      });
      this.started = true;
      const data = this.dataBeforeStart ?? c.data ?? {};
      const meta = this.metaBeforeStart ?? c.meta ?? {};
      this.dataBeforeStart = undefined;
      this.metaBeforeStart = undefined;
      this.context.store.dispatch({ type: 'SET_DATA', payload: { data } });
      this.context.store.dispatch({ type: 'SET_META', payload: { meta } });
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
        switchMap(() => this.healthOfStartedForm()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((health) => {
        this.health.set(health);
        if (health.status === 'errored') {
          console.error('GolemUI form failed to initialize:', health.message);
        }
        this.formHealth.emit(health);
      });

    this.configureLongLivedEvents();
  }

  // The store sends its current health on subscribe. So the first value is the health of the
  // started form (ok or the error of the start), and the health of an early setHealth call follows.
  private healthOfStartedForm(): Observable<FormHealth> {
    return new Observable<FormHealth>((subscriber) => {
      const subscription = formHealth(this.context.store.state$).subscribe(subscriber);
      if (this.healthBeforeStart) {
        const health = this.healthBeforeStart;
        this.healthBeforeStart = undefined;
        this.context.store.dispatch({ type: 'SET_FORM_HEALTH', payload: { formHealth: health } });
      }
      return subscription;
    });
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
    if (!this.started) {
      this.dataBeforeStart = data;
      return;
    }
    this.context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  }

  setMeta(meta: Record<string, any>): void {
    if (!this.started) {
      this.metaBeforeStart = meta;
      return;
    }
    this.context.store.dispatch({ type: 'SET_META', payload: { meta } });
  }

  /**
   * Sets the form health. An errored health with a code outside the core's own derive errors
   * shows the boundary and freezes the form until `{ status: 'ok' }` clears it.
   */
  setHealth(health: FormHealth): void {
    if (!this.started) {
      this.healthBeforeStart = health;
      return;
    }
    this.context.store.dispatch({ type: 'SET_FORM_HEALTH', payload: { formHealth: health } });
  }

  protected onFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.context.emitSubmitEvent();
  }
}
