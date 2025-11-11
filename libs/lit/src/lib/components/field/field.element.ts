import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { FieldMixin } from '../../mixins/field.mixin';

@customElement('gui-field')
export class FieldElement extends FieldMixin(LitElement) {}
