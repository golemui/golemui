import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { TextinputProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-textinput',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './textinput.component.html',
  styleUrl: '../styles.scss',
  host: {
    class: 'gui-textinput',
  },
})
export class TextinputComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, TextinputProps> = inject(
    Angular.ControlFieldAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
  }
}
