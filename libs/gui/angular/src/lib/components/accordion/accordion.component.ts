import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { AccordionEventDetail } from '@golemui/gui-components';
import { AccordionProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-accordion-layout',
  imports: [CommonModule, Angular.WidgetDirective],
  providers: [Angular.LayoutWidgetAdapter],
  templateUrl: './accordion.component.html',
  host: {
    class: 'gui-accordion',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class AccordionComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.LayoutWidget;
  activeSections: { [key: string]: boolean } = {};

  protected adapter: Angular.LayoutWidgetAdapter<AccordionProps> = inject(
    Angular.LayoutWidgetAdapter,
  );

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
    return this.widget.children.find(
      (section) => section.uid === uid,
    ) as Core.NonFunctionWidget<string>;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
