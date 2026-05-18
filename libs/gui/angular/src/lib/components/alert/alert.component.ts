import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular'
import type { DisplayWidget, WithWidget } from '@golemui/core'
import { type AlertProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-alert-display',
  imports: [CommonModule],
  providers: [DisplayWidgetAdapter],
  templateUrl: './alert.component.html',
  host: {
    class: 'gui-alert gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class AlertComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<AlertProps> = inject(
    DisplayWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
