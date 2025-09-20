import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import * as Core from '@formforge/core';
import { FieldLoaders } from '../../context/field.registry';
import { FormContext } from '../../context/form.context';
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
  providers: [FormContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent implements OnInit {
  // INPUTS
  formDef = input.required<JsonStringified | JsonObject>();
  fieldLoaders = input.required<FieldLoaders>();
  middlewares = input<Core.Middleware<Core.State, Core.Action>[]>([]);
  data = input<Record<string, any>>({});
  i18n = input<I18n>(defaultI18n);
  formName = input(crypto.randomUUID());

  // INJECTS
  protected context = inject(FormContext);

  ngOnInit(): void {
    this.context.initialize(this.fieldLoaders(), this.middlewares());

    this.context.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: this.formName(),
        formDef: this.formDef(),
      },
    });
  }
}
