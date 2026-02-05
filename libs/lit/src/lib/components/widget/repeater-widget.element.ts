import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { RepeaterWidgetMixin } from '../../mixins/repeater-widget.mixin';

@customElement('gui-repeater-widget')
export class RepeaterWidgetElement extends RepeaterWidgetMixin(LitElement) {}
