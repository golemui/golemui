import type { DxDefinitionItem, DxFormConfig } from '@golemui/gui-shared';
import { gui } from '@golemui/gui-shared';
import { type DxModule } from './modular.dx';

const data = { isVip: false };

const formDef: DxDefinitionItem[] = [
  gui.inputs.textInput('userName', {
    uid: 'user-name',
    label: 'User Name',
    hint: 'Your user name',
    validator: { required: true, minLength: 3 },
  }),
  gui.inputs.checkbox('isVip', {
    uid: 'is-vip',
    label: 'Is VIP',
  }),
  gui.displays.alert({
    uid: 'vip-message',
    text: 'Welcome VIP: {{$form.userName}}',
    include: { in: ['vip'] },
  }),
  gui.displays.alert({
    uid: 'alert1',
    text: 'One Error: {{$errors.userName}}',
    include: { when: '$errors.userName?.length === 1' },
  }),
  gui.displays.alert({
    uid: 'alert2',
    text: 'Two Errors: {{$errors.userName}} becasue form is invalid: {{$formIsInvalid}}',
    include: { when: '$errors.userName?.length === 2' },
  }),
  gui.actions.button({
    uid: 'dx-button-send',
    label: 'Send Event',
    onClick: () => 'testingEvens',
  }),
  gui.actions.button({
    uid: 'dx-button-submit',
    actionType: 'submit',
    label: 'Submit',
    disabled: { when: '$formIsInvalid' },
  }),
  gui.displays.alert({
    uid: 'send-result',
    text: 'Press Submit to send the form',
    level: 'info',
  }),
];

const formConfig: DxFormConfig = {
  states: { vip: '$form.isVip === true' },
};

export const testsDxModule: DxModule = {
  label: 'Tests',
  data,
  formDef,
  formConfig,
};
