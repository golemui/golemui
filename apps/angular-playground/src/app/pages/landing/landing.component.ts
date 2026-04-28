import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-landing-page',
  template: `
    <div style="padding: 2rem">
      <h1>Kitchen Sink</h1>
      <p>Pick a path:</p>
      <ul>
        <li><a routerLink="/json/kitchen-sink">JSON path</a></li>
        <li><a routerLink="/dx/kitchen-sink">DX path</a></li>
      </ul>
    </div>
  `,
})
export class LandingPage {}
