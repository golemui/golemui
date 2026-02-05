import { Directive, inject, Injector, input, Type } from '@angular/core';
import * as Core from '@golemui/core';
import { WidgetDirective } from './widget.directive';
import { REPEATER_INDEX_TOKEN } from './repeater-index.token';

/**
 * Directive that marks a Widget component and all its children as part of the provided `repeaterIndex`.
 *
 * @example
 * ```html
 * <ng-container guiRepeaterWidget [repeaterIndex]="2" [config]="widgetConfig" />
 * ```
 */
@Directive({
  selector: '[guiRepeaterWidget]',
  standalone: true,
})
export class RepeaterWidgetDirective extends WidgetDirective {
  repeaterIndex = input.required<number>();
  private injector = inject(Injector);

  protected override createComponent(component: Type<Core.WithWidget>) {
    const injector = Injector.create({
      providers: [{ provide: REPEATER_INDEX_TOKEN, useValue: this.repeaterIndex() }],
      parent: this.injector,
    });
    super.createComponent(component, injector, this.repeaterIndex());
  }
}
