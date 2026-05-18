import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { type AlertProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-alert-display',
  imports: [CommonModule],
  providers: [Angular.DisplayWidgetAdapter],
  templateUrl: './alert.component.html',
  host: {
    class: 'gui-alert gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class AlertComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.DisplayWidget;

  protected adapter: Angular.DisplayWidgetAdapter<AlertProps> = inject(
    Angular.DisplayWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
