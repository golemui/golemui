import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { ListProps, OptionValue } from '@golemui/shared-vanilla';
import { DefaultListItemRenderer } from './default-list.item-renderer';

@Component({
  standalone: true,
  selector: 'gui-list-control',
  imports: [CommonModule, NgComponentOutlet],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './list.component.html',
  host: {
    class: 'gui-list',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<OptionValue, ListProps<unknown>> = inject(
    Angular.ControlFieldAdapter,
  );
  protected selection = signal<OptionValue | undefined>(undefined);
  protected defaultListItemRenderer: Angular.AngularItemRenderer<string> = DefaultListItemRenderer;

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  protected valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }
}
