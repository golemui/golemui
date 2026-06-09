import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import type { AccordionEventDetail } from '@golemui/gui-components/internals';
import type { AccordionProps } from '@golemui/gui-shared/internals';

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
})
export class AccordionComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;
  activeSections: { [key: string]: boolean } = {};

  protected adapter: LayoutWidgetAdapter<AccordionProps> = inject(LayoutWidgetAdapter);

  ngOnInit(): void {
    const props: AccordionProps = this.widget.props as AccordionProps;
    this.adapter.init(this.widget);
    this.activeSections = props.defaultOpen ?? {};
  }

  onClickButton(uid: string) {
    const props: AccordionProps = this.widget.props as AccordionProps;
    if (props.singleOpen) {
      Object.keys(this.activeSections)
        .filter((sectionUid) => sectionUid !== uid)
        .forEach((key) => {
          this.activeSections[key] = false;
        });
    }

    this.activeSections[uid] = !this.activeSections[uid];

    this.adapter.change<AccordionEventDetail>(this.activeSections);
  }

  getChild(uid: string) {
    return this.widget.children.find((section) => section.uid === uid) as NonFunctionWidget<string>;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
