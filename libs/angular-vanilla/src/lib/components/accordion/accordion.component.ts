import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { AccordionEventDetail, AccordionProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-accordion-layout',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutFieldAdapter],
  templateUrl: './accordion.component.html',
  host: {
    class: 'gui-accordion',
  },
})
export class AccordionComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.LayoutField;
  activeSections: { [key: string]: boolean } = {};

  protected adapter: Angular.LayoutFieldAdapter<AccordionProps> = inject(
    Angular.LayoutFieldAdapter,
  );

  ngOnInit(): void {
    const props: AccordionProps = this.field.props as AccordionProps;
    this.adapter.init(this.field);
    this.activeSections = props.defaultOpen ?? {};
  }

  onClickButton(uid: string) {
    const props: AccordionProps = this.field.props as AccordionProps;
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
    return this.field.children.find((section) => section.uid === uid) as Core.FormField<string>;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
