import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { AlertProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-alert-display',
  imports: [CommonModule],
  providers: [Angular.DisplayFieldAdapter],
  templateUrl: './alert.component.html',
  host: {
    class: 'gui-alert',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class AlertComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.DisplayField;

  protected adapter: Angular.DisplayFieldAdapter<AlertProps> = inject(Angular.DisplayFieldAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
