import { createHarnessApp } from './create-app';

// styles.scss is linked from index.html, so the page is styled with JavaScript disabled.
createHarnessApp().then((app) => app.mount('#root'));
