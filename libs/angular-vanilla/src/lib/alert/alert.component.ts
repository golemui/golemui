import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';
import { AlertProps } from '@formforge/shared-vanilla';

@Component({
  standalone: true,
  selector: 'ff-alert',
  imports: [CommonModule],
  providers: [Angular.DisplayFieldAdapter],
  templateUrl: './alert.component.html',
  styleUrls: ['../styles.scss', './alert.component.scss'],
  host: {
    class: 'ff-alert',
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
