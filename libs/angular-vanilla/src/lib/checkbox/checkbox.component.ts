import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

@Component({
  standalone: true,
  selector: 'ff-checkbox',
  imports: [CommonModule],
  providers: [Angular.ControlAdapter],
  templateUrl: './checkbox.component.html',
  styleUrl: '../styles.scss',
})
export class CheckboxComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlAdapter<string, object> = inject(
    Angular.ControlAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    this.adapter.valueChanged(target.checked);
  }
}
