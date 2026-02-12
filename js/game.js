import Bird from "./bird.js";
import Pipes from "./pipes.js";

export default class Game {
  constructor(cvs, ctx, GAME_WIDTH, GAME_HEIGHT) {
    this.cvs = cvs;
    this.ctx = ctx;

    this.frameStates = [];
    this.episodeId = -1; // So it starts at 0 after reset()
    this.frameId = 0;

    this.loopIsRunning = false;
    this.gameIsImported = false;

    this.BIRD_IMAGE_UP = "../images/fb-up.png";
    this.BIRD_IMAGE_DOWN = "../images/fb-down.png";

    this.AGENT_TYPE = "human";
    this.GAME_WIDTH = GAME_WIDTH;
    this.GAME_HEIGHT = GAME_HEIGHT;
    this.BIRD_X_RATIO = 0.3;
    this.BIRD_WIDTH = 50;
    this.BIRD_HEIGHT = 40;
    this.GRAVITY = 600;
    this.PIPE_START_POINT = 500;
    this.PIPE_GAP = 200;
    this.PIPE_WIDTH = 75;
    this.PIPE_VELOCITY = 100;
    this.PIPES_INTERVAL = 3;
    this.FLAPPING_INTERVAL = 0.5;
    this.FIXED_DT = 0.0167;
    this.FLAP_COOLDOWN = 9 * this.FIXED_DT;

    this.deltaTime = 0;
    this.lastTime = 0;
    this.pipesElapsed = 0;
    this.flappingElapsed = 0;

    this.bird = new Bird(this);
    this.pipes = [];

    this.gameIsOver = true;

    this.points = 0;

    this.metadata = {
      agent_type: this.AGENT_TYPE,
      game_width: this.GAME_WIDTH,
      game_height: this.GAME_HEIGHT,
      bird_x_ratio: this.BIRD_X_RATIO,
      bird_width: this.BIRD_WIDTH,
      bird_height: this.BIRD_HEIGHT,
      gravity: this.GRAVITY,
      pipe_gap: this.PIPE_GAP,
      pipe_width: this.PIPE_WIDTH,
      pipe_velocity: this.PIPE_VELOCITY,
      pipes_interval: this.PIPES_INTERVAL,
    };
  }

  setup() {
    this.cvs.addEventListener("click", this.onClick);

    if (!this.loopIsRunning) {
      this.loopIsRunning = true;
      requestAnimationFrame(this.gameLoop);
    }
  }

  update(dt) {
    for (const pipePair of this.pipes) {
      if (
        this.areColliding(this.bird.hitbox, pipePair.topHitbox) ||
        this.areColliding(this.bird.hitbox, pipePair.botHitbox)
      ) {
        this.gameIsOver = true;
        return;
      }
      if (!pipePair.passed && this.bird.x > pipePair.x) {
        this.points++;
        pipePair.passed = true;
      }

      pipePair.update(dt);
    }

    this.bird.update(dt);
  }
  render(ctx) {
    ctx.clearRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    this.bird.render(ctx);

    this.pipes.forEach((pipePair) => pipePair.render(ctx));

    this.renderScore();

    if (this.gameIsOver && !this.gameIsImported) {
      this.renderGameOver(); 
    }
  }

  // Has to be arrow function to preserve the right "this" (.bind() works too)
  gameLoop = (timestamp) => {
    if (this.gameIsImported) {
      this.render(this.ctx);
      requestAnimationFrame(this.gameLoop);
      return;
    }

    if (!this.lastTime) this.lastTime = timestamp;
    this.deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    const dt = this.deltaTime / 1000;

    this.accumulator = this.accumulator || 0;

    this.accumulator += dt;

    while (this.accumulator >= this.FIXED_DT) {
      if (!this.gameIsOver) {
        this.update(this.FIXED_DT);

        // Physics-step accurate timers
        this.flappingElapsed += this.FIXED_DT;
        this.pipesElapsed += this.FIXED_DT;

        if (this.flappingElapsed >= this.FLAPPING_INTERVAL) {
          this.bird.currentImage =
            this.bird.currentImage === this.bird.imageUp
              ? this.bird.imageDown
              : this.bird.imageUp;
          this.flappingElapsed = 0;
        }

        if (this.pipesElapsed >= this.PIPES_INTERVAL) {
          this.addPipePair();
          this.pipesElapsed = 0;
        }

        // Log after all updates
        this.frameStates.push({
          episode_id: this.episodeId,
          frame_id: this.frameId,
          bird_y: this.bird.y,
          bird_velocity: this.bird.velocity,
          action: this.bird.isFlapping ? 1 : 0,
          pipe_pair_number: this.pipes.length,
          pipes:
            this.pipes.length > 0
              ? btoa(
                  JSON.stringify(
                    this.pipes.map((pipePair) => ({
                      x: pipePair.x,
                      top_y: pipePair.topY,
                      bot_y: pipePair.botY,
                      passed: pipePair.passed,
                    }))
                  )
                )
              : "null",
          score: this.points,
          game_is_over: this.gameIsOver ? 1 : 0,
        });
        this.bird.isFlapping = false;
        this.frameId++;
      }

      this.accumulator -= this.FIXED_DT;
    }

    this.render(this.ctx);
    requestAnimationFrame(this.gameLoop);
  };

  reset() {
    this.episodeId++;
    this.frameId = 0;

    this.deltaTime = 0;
    this.lastTime = 0;
    this.pipesElapsed = 0;
    this.flappingElapsed = 0;

    this.bird.reset();

    this.pipes = [];

    this.points = 0;
  }

  addPipePair() {
    if (this.gameIsImported) return;

    let pipePair = new Pipes(this);
    this.pipes.push(pipePair);
  }
  removePipePair(pipePair) {
    let index = this.pipes.indexOf(pipePair);
    if (index > -1) this.pipes.splice(index, 1);
  }

  // Has to be arrow function to preserve the right "this" (.bind() works too)
  onClick = () => {
    if (this.gameIsImported) return;

    if (this.gameIsOver) {
      this.gameIsOver = false;
      this.reset();
    } else {
      if (this.bird.flapCooldown == 0) {
        this.bird.isFlapping = true;
        this.bird.flapWings();
        this.bird.flapCooldown = this.FLAP_COOLDOWN;
      }
    }
  };

  areColliding(bird, pipe) {
    return (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      bird.y < pipe.y + pipe.height &&
      bird.y + bird.height > pipe.y - 30
    );
  }

  renderGameOver() {
    this.ctx.font = "25px Comic Sans MS";
    this.ctx.fillStyle = "orange";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Click anywhere to start!",
      this.GAME_WIDTH / 2,
      this.GAME_HEIGHT / 2
    );
  }
  renderScore() {
    this.ctx.font = "25px Comic Sans MS";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.points, this.GAME_WIDTH / 2, this.GAME_HEIGHT / 5);
  }
}
