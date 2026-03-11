import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChildren,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { Dependencies, MarkdownProps } from '@golemui/gui-shared';

type MarkdownTabs = 'write' | 'preview';

@Component({
  standalone: true,
  selector: 'gui-markdown-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './markdown.component.html',
  host: {
    class: 'gui-markdown',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MarkdownComponent implements OnInit, OnDestroy, Core.WithWidget {
  elementRef = inject(ElementRef);
  tabButtons = viewChildren<ElementRef>('tabButtonRef');
  widget!: Core.InputWidget<string>;
  activeTab = signal<MarkdownTabs>('write');

  preview = computed(() => {
    if (this.activeTab() === 'preview') {
      return (this.adapter.templateData().deps as Dependencies).markdown?.parse(
        this.adapter.templateData().value || '',
      );
    } else {
      return '';
    }
  });

  protected adapter: Angular.InputWidgetAdapter<string, MarkdownProps> = inject(
    Angular.InputWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onClickTab(uid: MarkdownTabs) {
    this.activeTab.set(uid);
  }

  onKeyDown($event: KeyboardEvent) {
    const tabs: { uid: MarkdownTabs }[] = [{ uid: 'write' }, { uid: 'preview' }];
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

  onFocus(event: FocusEvent) {
    (event.target as Element).scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }
}
