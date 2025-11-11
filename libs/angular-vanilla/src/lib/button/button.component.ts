import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';

@Component({
  standalone: true,
  selector: 'gui-button',
  imports: [CommonModule],
  providers: [Angular.InteractiveAdapter],
  templateUrl: './button.component.html',
  styleUrl: '../styles.scss',
  host: {
    class: 'gui-button',
  },
})
export class ButtonComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.InteractiveField;
  protected adapter: Angular.InteractiveAdapter = inject(Angular.InteractiveAdapter);

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
