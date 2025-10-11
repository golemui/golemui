import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

type TabsProps = {
  tabs: { label: string; uid: string; }[];
};

@Component({
  standalone: true,
  selector: 'ff-tabs',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutAdapter],
  templateUrl: './tabs.component.html',
  host: {
    'class': 'ff-tabs'
  }
})
export class TabsComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.LayoutField;
  activeTab = '';

  protected adapter: Angular.LayoutAdapter<TabsProps> = inject(
    Angular.LayoutAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
    this.activeTab = (this.field.props as TabsProps).tabs[0].uid;
  }

  onClickTab(uid: string) {
    this.activeTab = uid;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
