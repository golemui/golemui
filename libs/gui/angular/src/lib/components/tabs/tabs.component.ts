import { CommonModule } from '@angular/common';
import {
  type AfterViewInit,
  Component,
  ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { createIntersectionObserver, type TabsEventDetail } from '@golemui/gui-components';
import { type TabsProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-tabs-layout',
  imports: [CommonModule, Angular.WidgetDirective],
  providers: [Angular.LayoutWidgetAdapter],
  templateUrl: './tabs.component.html',
  host: {
    class: 'gui-tabs gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class TabsComponent implements OnInit, AfterViewInit, OnDestroy, Core.WithWidget {
  elementRef = inject(ElementRef);
  tabButtons = viewChildren<ElementRef>('tabButtonRef');
  startSentinel = viewChild.required<ElementRef>('startSentinel');
  endSentinel = viewChild.required<ElementRef>('endSentinel');
  widget!: Core.LayoutWidget;

  activeTab = signal('');
  isStartVisible = signal(false);
  isEndVisible = signal(false);

  protected adapter: Angular.LayoutWidgetAdapter<TabsProps> = inject(Angular.LayoutWidgetAdapter);
  private startObserver: IntersectionObserver | undefined;
  private endObserver: IntersectionObserver | undefined;

  ngOnInit(): void {
    const props: TabsProps = this.widget.props as TabsProps;
    this.adapter.init(this.widget);
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
    const tabs = (this.widget.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab());
    this.tabButtons()[currentIndex].nativeElement.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }

  onClickTab(uid: string) {
    this.activeTab.set(uid);
    this.adapter.change<TabsEventDetail>(uid);
  }

  onFocus(event: FocusEvent) {
    (event.target as Element).scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  onKeyDown($event: KeyboardEvent) {
    const tabs = (this.widget.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab());
    const isRTL = window.getComputedStyle(this.elementRef.nativeElement).direction === 'rtl';

    switch ($event.key) {
      case 'ArrowLeft': {
        const nextIndex = currentIndex + (isRTL ? 1 : -1);

        if (nextIndex >= 0 && nextIndex < tabs.length) {
          this.activeTab.set(tabs[nextIndex].uid);
          this.tabButtons()[nextIndex].nativeElement.focus();
        }
        break;
      }
      case 'ArrowRight': {
        const nextIndex = currentIndex + (isRTL ? -1 : 1);

        if (nextIndex >= 0 && nextIndex < tabs.length) {
          this.activeTab.set(tabs[nextIndex].uid);
          this.tabButtons()[nextIndex].nativeElement.focus();
        }
        break;
      }
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
