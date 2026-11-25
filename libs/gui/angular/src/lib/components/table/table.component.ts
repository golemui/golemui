import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { tableCellClass, tableCellText, type TableProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/table';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-table-display',
  providers: [DisplayWidgetAdapter],
  templateUrl: './table.component.html',
  host: {
    class: 'gui-table gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<TableProps> = inject(DisplayWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  protected readonly tableCellClass = tableCellClass;
  protected readonly tableCellText = tableCellText;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
