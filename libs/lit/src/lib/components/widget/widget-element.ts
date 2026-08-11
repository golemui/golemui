import { LitElement } from 'lit';
import { WidgetMixin } from '../../mixins/widget-mixin';
import { safeDefine } from '../../utils/define';

export class WidgetElement extends WidgetMixin(LitElement) {}

safeDefine('gui-widget', WidgetElement);
