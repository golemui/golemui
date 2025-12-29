import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App_simplest from './app/app_simplest';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <App_simplest />
  </StrictMode>,
);
