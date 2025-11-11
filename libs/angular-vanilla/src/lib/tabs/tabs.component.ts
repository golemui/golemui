import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { TabsProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-tabs',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutAdapter],
  templateUrl: './tabs.component.html',
  host: {
    class: 'gui-tabs',
  },
})
export class TabsComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.LayoutField;
  activeTab = '';

  protected adapter: Angular.LayoutAdapter<TabsProps> = inject(Angular.LayoutAdapter);

  ngOnInit(): void {
    const props: TabsProps = this.field.props as TabsProps;
    this.adapter.init(this.field);
    this.activeTab = props.defaultOpen ?? props.tabs[0].uid;
  }

  onClickTab(uid: string) {
    this.activeTab = uid;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
