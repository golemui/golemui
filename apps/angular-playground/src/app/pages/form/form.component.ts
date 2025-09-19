import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as Core from '@formforge/core';
import * as Mocks from '../../mocks/signin';

@Component({
  imports: [CommonModule],
  selector: 'app-form-page',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class AppFromPage implements OnInit {
  protected formState = '';

  ngOnInit(): void {
    const logger: Core.Middleware<Core.State, Core.Action> =
      ({ getState }) =>
      (next) =>
      (action) => {
        console.groupCollapsed(action.type);
        console.log('Prev state:', getState());
        console.log('Action:', action);
        next(action);
        console.log('Next state:', getState());
        console.groupEnd();
      };

    const store = Core.createFormStore([logger]);

    store.state$.subscribe((state) => {
      this.formState = JSON.stringify(state, undefined, 2);
    });

    store.dispatch({
      type: 'INITIALIZE',
      payload: { formDef: JSON.stringify(Mocks.signin) },
    });
  }
}
