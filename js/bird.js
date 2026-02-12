export default class Bird {
  #y;
  constructor(game) {
    this.game = game;

    this.isFlapping = false;
    this.flapCooldown = 0;

    this.imageUp = new Image();
    this.imageUp.src = this.game.BIRD_IMAGE_UP;

    this.imageDown = new Image();
    this.imageDown.src = this.game.BIRD_IMAGE_DOWN;

    this.currentImage = this.imageUp;

    this.width = this.game.BIRD_WIDTH;
    this.height = this.game.BIRD_HEIGHT;
    
    this.x = this.game.GAME_WIDTH * this.game.BIRD_X_RATIO;
    this.#y = (this.game.GAME_HEIGHT - this.height) / 2;

    this.velocity = 0;
  }

  get y() {
    return this.#y;
  }
  set y(v) {
    if (!this.game.gameIsImported) {
      this.#y = Math.min(Math.max(v, 0), this.game.GAME_HEIGHT - this.height);
      if (v < 0 || v > this.game.GAME_HEIGHT - this.height) {
        this.game.gameIsOver = true;
      }
    } else {
      this.#y = v;
    }
  }

  get hitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  update(dt) {
    this.flapCooldown = Math.max(0, this.flapCooldown - dt)
    this.fall(dt);
  }

  render(ctx) {
    ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
  }

  reset() {
    this.x = this.game.GAME_WIDTH * this.game.BIRD_X_RATIO;
    this.#y = (this.game.GAME_HEIGHT - this.height) / 2;

    this.velocity = 0;
  }

  fall(dt) {
    this.velocity += this.game.GRAVITY * dt;
    this.y += this.velocity * dt;
  }

  flapWings() {
    this.velocity = -300;
  }
}
