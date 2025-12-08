import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';

@Component({
  standalone: true,
  selector: 'gui-button',
  imports: [CommonModule],
  providers: [Angular.InteractiveFieldAdapter],
  templateUrl: './button.component.html',
  host: {
    class: 'gui-button',
  },
})
export class ButtonComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.InteractiveField;
  protected adapter: Angular.InteractiveFieldAdapter = inject(Angular.InteractiveFieldAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  onClick() {
    this.adapter.click();
  }
}
