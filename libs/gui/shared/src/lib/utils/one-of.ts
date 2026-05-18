import { type Option } from '../widget.props';

/**
 * Checks whether a value is a fully compliant Option (with label and value fields)
 */
export const isOption = (opt: unknown): opt is Option =>
  opt !== null &&
  typeof opt === 'object' &&
  Object.prototype.hasOwnProperty.call(opt, 'label') &&
  Object.prototype.hasOwnProperty.call(opt, 'value');
