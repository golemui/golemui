import { Directive, inject, Injector, input, Type } from '@angular/core';
import * as Core from '@golemui/core';
import { FieldDirective } from './field.directive';
import { REPEATER_INDEX_TOKEN } from './repeater-index.token';

/**
 * Directive that marks a Field component and all its children as part of the provided `repeaterIndex`.
 *
 * @example
 * ```html
 * <ng-container guiRepeaterField [repeaterIndex]="2" [config]="fieldConfig" />
 * ```
 */
@Directive({
  selector: '[guiRepeaterField]',
  standalone: true,
})
export class RepeaterFieldDirective extends FieldDirective {
  repeaterIndex = input.required<number>();
  private injector = inject(Injector);

  protected override createComponent(component: Type<Core.WithField>) {
    const injector = Injector.create({
      providers: [{ provide: REPEATER_INDEX_TOKEN, useValue: this.repeaterIndex() }],
      parent: this.injector,
    });
    super.createComponent(component, injector, this.repeaterIndex());
  }
}
