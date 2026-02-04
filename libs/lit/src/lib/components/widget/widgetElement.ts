import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { WidgetMixin } from '../../mixins/widgetMixin';

@customElement('gui-widget')
export class WidgetElement extends WidgetMixin(LitElement) {}
