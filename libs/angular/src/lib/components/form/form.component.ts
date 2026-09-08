import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  PLATFORM_ID,
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
  // Plugins are a client concern: the initialization below also runs during a server render.
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private unsubscribeI18n: () => void = () => undefined;
  protected readonly _defaultFormName = shortUUID();
  // Keys the widget tree in the template. Every initialization bumps it, so the whole tree
  // is destroyed and recreated and every widget subscribes to the store INITIALIZE ran on.
  protected storeGeneration = signal(0);

  // One computed over both inputs, so a change-detection pass that replaces the config and the
  // validators together (the widget-set wrapper derives both from one bundle) emits once and
  // initializes one store, where two separate toObservable() streams emitted twice.
  private configAndValidators = computed(() => [this.config(), this.validators()] as const);

  // `tap()` runs synchronously before `switchMap` accesses the new store, ensuring
  // that `context.initialize()` always fires before we resubscribe to `formHealth`
  private config$ = toObservable(this.configAndValidators).pipe(
    tap(([c, validators]) => {
      this.unsubscribeI18n();
      this.context.detachPlugins();
      this.context.initialize(
        c.widgetLoaders,
        c.middlewares ?? [],
        validators,
        c.validateOn ?? 'eager',
        c.itemRenderers ?? {},
        c.localization,
        c.dependencies ?? {},
        c.functions ?? {},
        c.valueSchemas,
      );
      this.storeGeneration.update((generation) => generation + 1);
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
      if (this.isBrowser) {
        this.context.attachPlugins(c.plugins ?? []);
      }
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
        this.health.set(health);
        if (health.status === 'errored') {
          console.error('GolemUI form failed to initialize:', health.message);
        }
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
    this.context.detachPlugins();
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
