import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import type { RatingProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/rating';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-rating-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './rating.component.html',
  host: {
    class: 'gui-rating gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RatingComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<number>;
  protected adapter: InputWidgetAdapter<number, RatingProps> = inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }
}
