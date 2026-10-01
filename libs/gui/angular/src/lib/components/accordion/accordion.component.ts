import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import type { AccordionEventDetail } from '@golemui/gui-components/internals';
import {
  accordionButtonId,
  accordionSectionId,
  type AccordionProps,
  repeaterIndexSuffix,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/accordion';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-accordion-layout',
  imports: [CommonModule, WidgetDirective],
  providers: [LayoutWidgetAdapter],
  templateUrl: './accordion.component.html',
  host: {
    class: 'gui-accordion gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AccordionComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;
  activeSections: { [key: string]: boolean } = {};

  protected adapter: LayoutWidgetAdapter<AccordionProps> = inject(LayoutWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  private rowIndexSuffix = '';

  ngOnInit(): void {
    this.adapter.init(this.widget);
    // Repeater rows share one `defaultOpen` object, so never write into it, copy it
    this.activeSections = { ...(this.adapter.templateData().defaultOpen ?? {}) };
    this.rowIndexSuffix = repeaterIndexSuffix(this.widget.uid);
  }

  isOpen(uid: string) {
    return !!this.activeSections[uid];
  }

  onToggle(event: Event, uid: string) {
    const { detail } = event as CustomEvent<GuiToggleEventDetail>;
    // An accordion nested in a section fires its own.
    if (event.target !== event.currentTarget || this.isOpen(uid) === detail.open) return;

    if (detail.open && this.adapter.templateData().singleOpen) {
      Object.keys(this.activeSections).forEach((key) => {
        this.activeSections[key] = false;
      });
    }

    this.activeSections[uid] = detail.open;
    // A copy, because the next toggle writes into `this.activeSections` again.
    this.adapter.change<AccordionEventDetail>({ ...this.activeSections });
  }

  /**
   * The section uids come from the props and carry no repeater row indexes, the children come
   * from the store with the indexes already applied, so the lookup adds this accordion's own.
   * Returns `undefined` when the section's child is hidden, the children only hold visible ones.
   */
  getChild(uid: string): NonFunctionWidget<string> | undefined {
    const childUid = `${uid}${this.rowIndexSuffix}`;
    return this.adapter.templateData().children.find((section) => section.uid === childUid);
  }

  buttonId(sectionUid: string) {
    return accordionButtonId(this.widget.uid, sectionUid);
  }

  sectionId(sectionUid: string) {
    return accordionSectionId(this.widget.uid, sectionUid);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
