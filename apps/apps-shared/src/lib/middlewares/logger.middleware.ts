import * as Core from '@golemui/core';

export const loggerMiddleware: Core.Middleware<Core.State, Core.Action> =
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
