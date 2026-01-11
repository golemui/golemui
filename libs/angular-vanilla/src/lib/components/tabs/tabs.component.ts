import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { createIntersectionObserver, TabsEventDetail, TabsProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-tabs-layout',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutFieldAdapter],
  templateUrl: './tabs.component.html',
  host: {
    class: 'gui-tabs',
  },
})
export class TabsComponent implements OnInit, AfterViewInit, OnDestroy, Core.WithField {
  tabButtons = viewChildren<ElementRef>('tabButtonRef');
  startSentinel = viewChild.required<ElementRef>('startSentinel');
  endSentinel = viewChild.required<ElementRef>('endSentinel');
  field!: Core.LayoutField;

  activeTab = signal('');
  isStartVisible = signal(false);
  isEndVisible = signal(false);

  protected adapter: Angular.LayoutFieldAdapter<TabsProps> = inject(Angular.LayoutFieldAdapter);
  private startObserver: IntersectionObserver | undefined;
  private endObserver: IntersectionObserver | undefined;

  ngOnInit(): void {
    const props: TabsProps = this.field.props as TabsProps;
    this.adapter.init(this.field);
    this.activeTab.set(props.defaultOpen ?? props.tabs[0].uid);

    this.startObserver = createIntersectionObserver(
      this.startSentinel().nativeElement,
      (isIntersecting: boolean) => this.isStartVisible.set(isIntersecting),
    );
    this.endObserver = createIntersectionObserver(
      this.endSentinel().nativeElement,
      (isIntersecting: boolean) => this.isEndVisible.set(isIntersecting),
    );
  }

  ngAfterViewInit() {
    // Scroll into view the active tab, just in case it's out of view
    const tabs = (this.field.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab());
    this.tabButtons()[currentIndex].nativeElement.scrollIntoView();
  }

  onClickTab(uid: string) {
    this.activeTab.set(uid);
    this.adapter.change<TabsEventDetail>(uid);
  }

  onFocus(event: FocusEvent) {
    (event.target as Element).scrollIntoView();
  }

  onKeyDown($event: KeyboardEvent) {
    const tabs = (this.field.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab());

    switch ($event.key) {
      case 'ArrowLeft':
        if (currentIndex > 0) {
          this.activeTab.set(tabs[currentIndex - 1].uid);
          this.tabButtons()[currentIndex - 1].nativeElement.focus();
        }
        break;
      case 'ArrowRight':
        if (currentIndex < tabs.length - 1) {
          this.activeTab.set(tabs[currentIndex + 1].uid);
          this.tabButtons()[currentIndex + 1].nativeElement.focus();
        }
        break;
      case 'Home':
        this.activeTab.set(tabs[0].uid);
        this.tabButtons()[0].nativeElement.focus();
        break;
      case 'End':
        this.activeTab.set(tabs[tabs.length - 1].uid);
        this.tabButtons()[tabs.length - 1].nativeElement.focus();
        break;
      default:
        return;
    }
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
    this.startObserver?.disconnect();
    this.endObserver?.disconnect();
  }
}
