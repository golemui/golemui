import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import type { GuiTabChangeEventDetail } from '@golemui/gui-components';
import type { TabsEventDetail } from '@golemui/gui-components/internals';
import {
  repeaterIndexSuffix,
  tabButtonId,
  tabPanelId,
  type TabsProps,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/tabs';
import { deferHydrationAttr } from '../../utils/defer-hydration';

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TabsComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;

  /** The tab uid, without row indexes: the panel children carry them, see `getChild`. */
  activeTab = signal('');

  protected adapter: LayoutWidgetAdapter<TabsProps> = inject(LayoutWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  private rowIndexSuffix = '';

  ngOnInit(): void {
    this.adapter.init(this.widget);
    const templateData = this.adapter.templateData();
    this.activeTab.set(templateData.defaultOpen ?? templateData.tabs?.[0]?.uid ?? '');
    this.rowIndexSuffix = repeaterIndexSuffix(this.widget.uid);
  }

  /**
   * The tab uids come from the props and carry no repeater row indexes, the panel children come
   * from the store with the indexes already applied, so the lookup adds this tabs layout's own.
   * Returns `undefined` when the tab's child is hidden, the children only hold visible ones.
   */
  getChild(tabUid: string): NonFunctionWidget<string> | undefined {
    const childUid = `${tabUid}${this.rowIndexSuffix}`;
    return this.adapter.templateData().children.find((child) => child.uid === childUid);
  }

  isActiveTab(tabUid: string) {
    return tabUid === this.activeTab();
  }

  tabId(tabUid: string) {
    return tabButtonId(this.widget.uid, tabUid);
  }

  panelId(tabUid: string) {
    return tabPanelId(this.widget.uid, tabUid);
  }

  onTabChange(event: Event) {
    const { detail } = event as CustomEvent<GuiTabChangeEventDetail>;
    // A tab set nested in a panel fires its own.
    if (event.target !== event.currentTarget) return;
    this.activeTab.set(detail.value);
    this.adapter.change<TabsEventDetail>(detail.value);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
