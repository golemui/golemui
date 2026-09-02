import type { ActionWidget, ActionWidgetTemplateData } from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const actionContext = createContext<ActionWidgetAdapter<any>>('guiActionWidgetAdapter');

export class ActionWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<ActionWidget> {
  override templateData = {} as ActionWidgetTemplateData & ExtraProps;

  init(widget: ActionWidget) {
    this.widget = widget;
    this.setTemplateData({
      label: this.widget.label,
      icon: (this.widget.props as any)?.icon,
      iconPosition: (this.widget.props as any)?.iconPosition,
    });

    this.templateDataUpdater((viewModel) => ({
      invalid: viewModel.formInvalid,
    }));

    // A server render must not run consumer event handlers. The guard checks the document
    // global, not lit's isServer: the jsdom specs load the node build, where isServer is true.
    if (typeof document !== 'undefined' && this.shouldEmitLoad()) {
      this.context.emitEvent('load', this.widget);
    }
  }

  click() {
    this.context.emitEvent('click', this.widget);
  }
}
