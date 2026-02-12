export default class Pipes {
  #x;
  constructor(game) {
    this.game = game;

    this.gap = game.PIPE_GAP;

    this.#x = game.PIPE_START_POINT;
    this.topY = Math.random() * (this.game.GAME_HEIGHT - this.gap);
    this.botY = this.topY + this.gap;

    this.width = game.PIPE_WIDTH;
    this.topHeight = this.topY;
    this.botHeight = this.game.GAME_HEIGHT - this.botY;

    this.velocity = game.PIPE_VELOCITY;

    this.passed = false;
  }

  get x() {
    return this.#x;
  }
  set x(v) {
    if (v + this.width < 0) this.game.removePipePair(this);
    else this.#x = v;
  }

  get topHitbox() {
    return {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.topHeight,
    };
  }
  get botHitbox() {
    return {
      x: this.x,
      y: this.botY,
      width: this.width,
      height: this.botHeight,
    };
  }

  update(dt) {
    this.x -= this.velocity * dt;
  }

  renderTopPipe(ctx) {
    ctx.fillStyle = "green";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillRect(this.x, 0, this.width, this.topHeight);
    ctx.strokeRect(this.x, -3, this.width, this.topHeight);

    ctx.fillStyle = "darkgreen";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillRect(this.x - 5, this.topY - 30, this.width + 10, 30);
    ctx.strokeRect(this.x - 5, this.topY - 30, this.width + 10, 30);
  }
  renderBotPipe(ctx) {
    ctx.fillStyle = "green";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillRect(this.x, this.botY, this.width, this.botHeight);
    ctx.strokeRect(this.x, this.botY, this.width, this.botHeight + 3);

    ctx.fillStyle = "darkgreen";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillRect(this.x - 5, this.botY - 30, this.width + 10, 30);
    ctx.strokeRect(this.x - 5, this.botY - 30, this.width + 10, 30);
  }
  render(ctx) {
    this.renderTopPipe(ctx);
    this.renderBotPipe(ctx);
  }

  reset() {
    this.#x = this.game.PIPE_START_POINT;
    this.topY = Math.random() * (this.game.GAME_HEIGHT - this.gap);
    this.botY = this.topY + this.gap;

    this.topHeight = this.topY;
    this.botHeight = this.game.GAME_HEIGHT - this.botY;
  }
}
