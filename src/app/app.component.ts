import { Component } from '@angular/core';
import { GameComponent } from './features/game/components/game.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameComponent],
  template: `<app-game />`,
  styles: [`:host { display: block; width: 100vw; height: 100vh; }`],
})
export class AppComponent {}
