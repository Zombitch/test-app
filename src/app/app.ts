import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';

@Component({
  selector: 'app-root',
  imports: [GameComponent],
  template: '<app-game></app-game>',
  styles: [`:host { display: block; }`]
})
export class App {}
