import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, output, signal } from '@angular/core';
import * as Core from '@golemui/core';
import * as Gui from '@golemui/gui-angular';
import { buildWidgetPropertyGroups, flattenWidgetData } from './widget-forms';

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

  propertiesData = computed(() => flattenWidgetData(this.widget()));

  propertyGroups = computed(() => {
    const groups = buildWidgetPropertyGroups(this.widget());
    return groups
      .filter((g) => g.fields.length > 0)
      .map((g) => ({
        ...g,
        formDef: JSON.stringify({ form: g.fields }),
      }));
  });

  private openGroups = signal<Record<string, boolean>>({});

  isGroupOpen(key: string, defaultOpen: boolean): boolean {
    const state = this.openGroups();
    return key in state ? state[key] : defaultOpen;
  }

  toggleGroup(key: string, defaultOpen: boolean): void {
    const current = this.isGroupOpen(key, defaultOpen);
    this.openGroups.update((s) => ({ ...s, [key]: !current }));
  }

  protected onFormEvent(event: Core.FormEvent) {
    if (event.name === 'propChanged') {
      this.widgetChange.emit(event.data as Record<string, unknown>);
    }
  }
}
