import { GuiTextinputControl } from './components/textinput';
import { GuiCheckboxControl } from './components/checkbox';
import { GuiSelectControl } from './components/select';
import { GuiDateControl } from './components/date-input';
import { GuiCalendarControl } from './components/calendar';
import { GuiNumberControl } from './components/number';
import { GuiRadiogroupControl } from './components/radiogroup';
import { GuiTextareaControl } from './components/textarea';
import { GuiToggleControl } from './components/toggle';

declare global {
  interface HTMLElementTagNameMap {
    'gui-calendar': GuiCalendarControl;
    'gui-checkbox': GuiCheckboxControl;
    'gui-date': GuiDateControl;
    'gui-number': GuiNumberControl;
    'gui-radiogroup': GuiRadiogroupControl;
    'gui-select': GuiSelectControl;
    'gui-textarea': GuiTextareaControl;
    'gui-textinput': GuiTextinputControl;
    'gui-toggle': GuiToggleControl;
  }
}
