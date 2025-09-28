import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  Type,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as Core from '@formforge/core';
import { AngularFormContext } from '../../context/form.context';
import { FieldDirective } from '../../directives/field.directive';

type JsonStringified = string;
type JsonObject = Record<string, any>;

type I18n = Record<string, any>;
// TODO: Implement i18n
const defaultI18n: I18n = {};

@Component({
  selector: 'ff-form',
  standalone: true,
  templateUrl: './form.component.html',
  imports: [CommonModule, FieldDirective],
  providers: [AngularFormContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent implements OnInit {
  // INPUTS
  formDef = input.required<JsonStringified | JsonObject>();
  fieldLoaders = input.required<Core.FieldLoaders<Type<Core.WithField>>>();
  middlewares = input<Core.Middleware<Core.State, Core.Action>[]>([]);
  // TODO: not doing anything with data?
  data = input<Record<string, any>>({});
  i18n = input<I18n>(defaultI18n);
  formName = input(crypto.randomUUID());

  // OUTPUTS
  protected formError = output<Core.FormStoreError>();
  protected event = output<Core.FormEvent>();

  // INJECTS
  protected context: AngularFormContext<Type<Core.WithField>> =
    inject(AngularFormContext);

  // PRIVATE
  private destroyRef = inject(DestroyRef);

  // LIFE CYCLE
  ngOnInit(): void {
    this.context.initialize(this.fieldLoaders(), this.middlewares());

    Core.formErrors(this.context.store.state$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => this.formError.emit(error));

    this.context.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.event.emit(event));

    this.context.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: this.formName(),
        formDef: this.formDef(),
      },
    });
  }
}
