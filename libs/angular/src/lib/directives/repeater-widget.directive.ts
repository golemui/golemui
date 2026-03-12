import {
  Directive,
  forwardRef,
  inject,
  Injector,
  input,
  Optional,
  SkipSelf,
  Type,
} from '@angular/core';
import * as Core from '@golemui/core';
import { WidgetDirective } from './widget.directive';
import { REPEATER_INDEXES_TOKEN } from './repeater-indexes.token';

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
      providers: [
        {
          provide: REPEATER_INDEXES_TOKEN,
          useFactory: (parentRepeaterIndexes: number[], directive: RepeaterWidgetDirective) => {
            // Return a new array reference to avoid mutating the parent
            return [...parentRepeaterIndexes, directive.repeaterIndex()] satisfies number[];
          },
          deps: [
            [new SkipSelf(), new Optional(), REPEATER_INDEXES_TOKEN],
            forwardRef(() => RepeaterWidgetDirective),
          ],
        },
      ],
      parent: this.injector,
    });
    super.createComponent(component, injector, this.repeaterIndex());
  }
}
