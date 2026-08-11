import { LitElement } from 'lit';
import { RepeaterWidgetMixin } from '../../mixins/repeater-widget.mixin';
import { safeDefine } from '../../utils/define';

export class RepeaterWidgetElement extends RepeaterWidgetMixin(LitElement) {}

safeDefine('gui-repeater-widget', RepeaterWidgetElement);
