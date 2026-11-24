import { CommonModule } from '@angular/common';
import { Component, computed, inject, type OnDestroy, type OnInit } from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { FormWidget, LayoutWidget, WithWidget } from '@golemui/core';
import {
  gridCellClasses,
  gridClasses,
  type GridProps,
  resolveGrid,
} from '@golemui/gui-shared/internals';

@Component({
  standalone: true,
  selector: 'gui-grid-layout',
  imports: [CommonModule, WidgetDirective],
  providers: [LayoutWidgetAdapter],
  templateUrl: './grid.component.html',
  host: {
    class: 'gui-field',
  },
})
export class GridComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;

  protected adapter: LayoutWidgetAdapter<GridProps> = inject(LayoutWidgetAdapter);

  protected grid = computed(() => resolveGrid(this.adapter.templateData()));

  protected readonly gridClasses = gridClasses;

  protected cellClasses(child: FormWidget<string>): string {
    return gridCellClasses(this.grid(), child.size);
  }

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
