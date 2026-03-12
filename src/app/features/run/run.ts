import { Component } from '@angular/core';
import { GameCanvasComponent } from './components/game-canvas/game-canvas';

@Component({
  selector: 'app-run',
  imports: [GameCanvasComponent],
  template: `<app-game-canvas />`,
  styles: [`:host { display: block; width: 100%; height: 100%; }`],
})
export class RunComponent {}
