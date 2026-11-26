import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { FormWidget, LayoutWidget, WithWidget } from '@golemui/core';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import {
  sidebarRegions,
  sidebarSideId,
  sidebarSideLabel,
  sidebarToggleLabel,
  type SidebarProps,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/sidebar';
import { deferHydrationAttr } from '../../utils/defer-hydration';

/**
 * The sidebar layout widget: the side child next to the main one, with `gui-sidebar`. Below
 * 768px of its own width the side region becomes a drawer the toggle opens: the same element, so
 * the side child is rendered once and keeps its state.
 */
@Component({
  standalone: true,
  selector: 'gui-sidebar-layout',
  imports: [WidgetDirective],
  providers: [LayoutWidgetAdapter],
  templateUrl: './sidebar.component.html',
  host: {
    class: 'gui-sidebar gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;
  protected adapter: LayoutWidgetAdapter<SidebarProps> = inject(LayoutWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  protected readonly sidebarSideLabel = sidebarSideLabel;
  protected readonly sidebarToggleLabel = sidebarToggleLabel;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  protected regions(children: FormWidget<string>[] | undefined) {
    return sidebarRegions(this.widget.uid, this.widget.children, children ?? []);
  }

  protected get sideId() {
    return sidebarSideId(this.adapter.domId);
  }

  // A menu inside reports its groups with gui-toggle too: only the drawer's counts.
  onToggle(event: Event) {
    if (event.target !== event.currentTarget) return;
    this.adapter.change({ open: (event as CustomEvent<GuiToggleEventDetail>).detail.open });
  }
}
