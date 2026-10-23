import { type DxRuntimeParams } from '@golemui/dx';
import type { GuiOtpShortcut, OtpDecorator, OtpEntry } from './otp.domain';

export function _guiOtp(path: string): GuiOtpShortcut;
export function _guiOtp(path: string, props: Partial<Omit<OtpDecorator, 'type'>>): GuiOtpShortcut;
export function _guiOtp(
  path: string,
  props: Partial<Omit<OtpDecorator, 'type'>>,
  tags: string[],
): GuiOtpShortcut;
export function _guiOtp(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<OtpDecorator, 'type'>>,
  tags?: string[],
): GuiOtpShortcut;
export function _guiOtp(
  path: string,
  propsOrCallback?:
    | Partial<Omit<OtpDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<OtpDecorator, 'type'>>),
  tags?: string[],
): GuiOtpShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'otp' as const,
      ...callback(params),
    });
    const items: OtpEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'OTP', items, tags: tags ?? [] };
  }

  const def: OtpDecorator = { type: 'otp', ...propsOrCallback };
  const items: OtpEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'OTP', items, tags: tags ?? [] };
}
