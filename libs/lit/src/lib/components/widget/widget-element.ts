import { LitElement } from 'lit';
import { WidgetMixin } from '../../mixins/widget-mixin';
import { safeDefine } from '@golemui/lit-utils';

export class WidgetElement extends WidgetMixin(LitElement) {}

safeDefine('gui-widget', WidgetElement);
