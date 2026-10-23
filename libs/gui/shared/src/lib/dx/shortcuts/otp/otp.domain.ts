import type { StringValidator } from '@golemui/gui-validators';
import type { OtpProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface OtpDecorator extends DxInputBase, DxCommonFields, Partial<OtpProps> {
  type: 'otp';
  validator?: DxValidator<StringValidator>;
}

export interface GslOtpConfig extends GslConfigBase<OtpDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type OtpEntry = { key: string; def: DefOrCallback<OtpDecorator> };
export type GuiOtpShortcut = GuiShortcutOf<'OTP', OtpEntry>;
