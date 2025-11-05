import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { RepeaterFieldMixin } from '../../mixins/repeater-field.mixin';

@customElement('ff-repeater-field')
export class RepeaterFieldElement extends RepeaterFieldMixin(LitElement) {}
