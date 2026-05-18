import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { LayoutWidget, WithWidget } from '@golemui/core';
import { type GridProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-grid-layout',
  imports: [CommonModule, WidgetDirective],
  providers: [LayoutWidgetAdapter],
  templateUrl: './grid.component.html',
  host: {
    class: 'gui-grid gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class GridComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;

  protected adapter: LayoutWidgetAdapter<GridProps> = inject(LayoutWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
