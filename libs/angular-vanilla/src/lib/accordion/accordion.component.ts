import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';
import { AccordionProps } from '@formforge/shared-vanilla';

@Component({
  standalone: true,
  selector: 'ff-accordion',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutAdapter],
  templateUrl: './accordion.component.html',
  host: {
    class: 'ff-accordion',
  },
})
export class AccordionComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.LayoutField;
  activeSections: { [key: string]: boolean } = {};

  protected adapter: Angular.LayoutAdapter<AccordionProps> = inject(Angular.LayoutAdapter);

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
  }

  getChild(uid: string) {
    return this.field.children.find((section) => section.uid === uid) as Core.FormField<string>;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
