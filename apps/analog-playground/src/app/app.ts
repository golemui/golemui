import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class App {}
