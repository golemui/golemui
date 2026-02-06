import * as React from 'react';
import { GuiTextinput } from './components/textinput';
import { GuiCheckbox } from './components/checkbox';
import { GuiSelect } from './components/select';
import { GuiDate } from './components/date-input';
import { GuiCalendar } from './components/calendar';
import { GuiNumber } from './components/number';
import { GuiRadiogroup } from './components/radiogroup';
import { GuiTextarea } from './components/textarea';
import { GuiToggle } from './components/toggle';
import { GuiCurrency } from './components/currency';
import { GuiList } from './components/list';
import { GuiLabel } from './components/label';
import { GuiErrors } from './components/errors';
import { GuiRangeCalendar } from './components/range-calendar';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gui-textinput': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextinput>;
      'gui-currency': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCurrency>;
      'gui-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiList>;
      'gui-label': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiLabel>;
      'gui-errors': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiErrors>;
      'gui-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCheckbox>;
      'gui-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiSelect>;
      'gui-date': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiDate>;
      'gui-calendar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCalendar>;
      'gui-range-calendar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeCalendar>;
      'gui-number': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiNumber>;
      'gui-radiogroup': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRadiogroup>;
      'gui-textarea': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextarea>;
      'gui-toggle': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiToggle>;
    }
  }
}
