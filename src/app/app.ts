import { Component, inject } from '@angular/core';
import { GameStateService } from './core/services/game-state.service';
import { HubComponent } from './features/hub/hub';
import { RunComponent } from './features/run/run';
import { ResultComponent } from './features/result/result';

@Component({
  selector: 'app-root',
  imports: [HubComponent, RunComponent, ResultComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly gameState = inject(GameStateService);
}
