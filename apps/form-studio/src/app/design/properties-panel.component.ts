import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import * as Core from '@golemui/core';
import * as Gui from '@golemui/gui-angular';
import { buildWidgetPropertiesFormDef, flattenWidgetData } from './widget-forms';

@Component({
  imports: [Gui.FormComponent],
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PropertiesPanelComponent {
  widget = input.required<Record<string, unknown>>();
  widgetChange = output<Record<string, unknown>>();

  propertiesFormDef = computed(() => buildWidgetPropertiesFormDef(this.widget()));
  propertiesData = computed(() => flattenWidgetData(this.widget()));

  protected onFormEvent(event: Core.FormEvent) {
    if (event.name === 'propChanged') {
      this.widgetChange.emit(event.data as Record<string, unknown>);
    }
  }
}
