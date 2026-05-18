import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular'
import type { LayoutWidget, WithWidget } from '@golemui/core'
import { type FlexProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-flex-layout',
  imports: [CommonModule, WidgetDirective],
  providers: [LayoutWidgetAdapter],
  templateUrl: './flex.component.html',
  host: {
    class: 'gui-flex gui-field',
    '[style.flex]': 'this.adapter.templateData().size ?? 1',
  },
})
export class FlexComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;

  protected adapter: LayoutWidgetAdapter<FlexProps> = inject(LayoutWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
