import { injectResponse } from '@analogjs/router/tokens';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Catch-all route. Without it the server render of any unknown URL (favicon probes, Chrome's
// `.well-known/appspecific/com.chrome.devtools.json`) throws NG04002 into the terminal.
@Component({
  imports: [RouterLink],
  selector: 'app-not-found-page',
  template: `
    <h1>Page not found</h1>
    <p><a routerLink="/">Back to the playground</a></p>
  `,
})
export default class NotFoundPage {
  constructor() {
    // Server only: injectResponse() returns null in the browser.
    const response = injectResponse();
    if (response) {
      response.statusCode = 404;
    }
  }
}
