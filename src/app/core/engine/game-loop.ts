/** Fixed-timestep game loop with rendering interpolation */
export class GameLoop {
  private running = false;
  private animFrameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60; // 60 ticks/sec

  constructor(
    private readonly onUpdate: (dt: number) => void,
    private readonly onRender: (interpolation: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  private tick = (): void => {
    if (!this.running) return;

    const now = performance.now() / 1000;
    let frameTime = now - this.lastTime;
    this.lastTime = now;

    // Cap frame time to prevent spiral of death
    if (frameTime > 0.25) frameTime = 0.25;

    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDt) {
      this.onUpdate(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    const interpolation = this.accumulator / this.fixedDt;
    this.onRender(interpolation);

    this.animFrameId = requestAnimationFrame(this.tick);
  };
}
