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
import type { RangeSliderProps, SliderRange } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-slider';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-range-slider-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './range-slider.component.html',
  host: {
    class: 'gui-range-slider gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeSliderComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<SliderRange>;
  protected adapter: InputWidgetAdapter<SliderRange, RangeSliderProps> = inject(InputWidgetAdapter);
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
