import { hydrateRoot } from 'react-dom/client';
import { App } from './App';

// styles.scss is linked from index.html, so the page is styled with JavaScript disabled.
const container = document.getElementById('root');
if (!container) {
  throw new Error('The root element is missing from index.html');
}
hydrateRoot(container, <App />, {
  // Logs hydration mismatches to the console, where the check looks.
  onRecoverableError: (error) => console.error(error),
});
