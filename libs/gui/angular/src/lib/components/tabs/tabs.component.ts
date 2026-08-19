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
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { LayoutWidget, WithWidget } from '@golemui/core';
import {
  createIntersectionObserver,
  type TabsEventDetail,
} from '@golemui/gui-components/internals';
import { repeaterIndexSuffix, type TabsProps } from '@golemui/gui-shared/internals';

@Component({
  standalone: true,
  selector: 'gui-tabs-layout',
  imports: [CommonModule, WidgetDirective],
  providers: [LayoutWidgetAdapter],
  templateUrl: './tabs.component.html',
  host: {
    class: 'gui-tabs gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class TabsComponent implements OnInit, AfterViewInit, OnDestroy, WithWidget {
  elementRef = inject(ElementRef);
  tabButtons = viewChildren<ElementRef>('tabButtonRef');
  startSentinel = viewChild.required<ElementRef>('startSentinel');
  endSentinel = viewChild.required<ElementRef>('endSentinel');
  widget!: LayoutWidget;

  activeTab = signal('');
  isStartVisible = signal(false);
  isEndVisible = signal(false);

  protected adapter: LayoutWidgetAdapter<TabsProps> = inject(LayoutWidgetAdapter);
  private startObserver: IntersectionObserver | undefined;
  private endObserver: IntersectionObserver | undefined;
  private rowIndexSuffix = '';

  ngOnInit(): void {
    const props: TabsProps = this.widget.props as TabsProps;
    this.adapter.init(this.widget);
    this.activeTab.set(props.defaultOpen ?? props.tabs[0].uid);
    this.rowIndexSuffix = repeaterIndexSuffix(this.widget.uid);

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

  /**
   * The tab uids come from the props and carry no repeater row indexes, the panel children come
   * from the store with the indexes already applied, so the comparison adds this tabs layout's own.
   */
  isActiveTab(child: { uid: string }) {
    return child.uid === `${this.activeTab()}${this.rowIndexSuffix}`;
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
