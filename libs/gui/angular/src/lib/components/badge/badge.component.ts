import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import type { BadgeProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/badge';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-badge-display',
  providers: [DisplayWidgetAdapter],
  templateUrl: './badge.component.html',
  host: {
    class: 'gui-badge gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BadgeComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<BadgeProps> = inject(DisplayWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
