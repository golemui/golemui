import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { WidgetMixin } from '../../mixins/widget-mixin';

@customElement('gui-widget')
export class WidgetElement extends WidgetMixin(LitElement) {}
