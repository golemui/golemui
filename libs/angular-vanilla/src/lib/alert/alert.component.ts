import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

type AlertProps = {
  text: string;
  level?: 'default' | 'info' | 'success' | 'warning' | 'error';
};

@Component({
  standalone: true,
  selector: 'ff-alert',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.FieldAdapter],
  templateUrl: './alert.component.html',
  styleUrls: ['../styles.scss', './alert.component.scss'],
})
export class AlertComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.Field;

  protected adapter: Angular.FieldAdapter<AlertProps> = inject(
    Angular.FieldAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
