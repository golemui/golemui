import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, viewChildren } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { TabsProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-tabs',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutFieldAdapter],
  templateUrl: './tabs.component.html',
  host: {
    class: 'gui-tabs',
  },
})
export class TabsComponent implements OnInit, OnDestroy, Core.WithField {
  tabButtons = viewChildren<ElementRef>('tabButtonRef');
  field!: Core.LayoutField;
  activeTab = '';

  protected adapter: Angular.LayoutFieldAdapter<TabsProps> = inject(Angular.LayoutFieldAdapter);

  ngOnInit(): void {
    const props: TabsProps = this.field.props as TabsProps;
    this.adapter.init(this.field);
    this.activeTab = props.defaultOpen ?? props.tabs[0].uid;
  }

  onClickTab(uid: string) {
    this.activeTab = uid;
  }

  onKeyDown($event: KeyboardEvent) {
    const tabs = (this.field.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab);

    switch ($event.key) {
      case 'ArrowLeft':
        if (currentIndex > 0) {
          this.activeTab = tabs[currentIndex - 1].uid;
          this.tabButtons()[currentIndex - 1].nativeElement.focus();
        }
        break;
      case 'ArrowRight':
        if (currentIndex < tabs.length - 1) {
          this.activeTab = tabs[currentIndex + 1].uid;
          this.tabButtons()[currentIndex + 1].nativeElement.focus();
        }
        break;
      case 'Home':
        this.activeTab = tabs[0].uid;
        this.tabButtons()[0].nativeElement.focus();
        break;
      case 'End':
        this.activeTab = tabs[tabs.length - 1].uid;
        this.tabButtons()[tabs.length - 1].nativeElement.focus();
        break;
      default:
        return;
    }
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
