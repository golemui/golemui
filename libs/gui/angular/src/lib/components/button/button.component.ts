import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';

@Component({
  standalone: true,
  selector: 'gui-button-interactive',
  imports: [CommonModule],
  providers: [Angular.ActionWidgetAdapter],
  templateUrl: './button.component.html',
  host: {
    class: 'gui-button',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class ButtonComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.ActionWidget;
  protected adapter: Angular.ActionWidgetAdapter = inject(Angular.ActionWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  onClick() {
    this.adapter.click();
  }
}
