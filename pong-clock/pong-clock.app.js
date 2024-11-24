const SCREEN_HEIGHT = g.getHeight();
const SCREEN_WIDTH = g.getWidth();
/* Widgets assumed at the top now, since I don't want to cut off 24px for the
  * top AND the bottom of the screen. */
const SCREEN_TOP = 24;
const BALL_SIZE = 6; // hehehe
const CLK_BOX = {x: 20, y: SCREEN_TOP + 30,
                 x2: SCREEN_WIDTH - 20, y2: SCREEN_HEIGHT - 30};
const GAMES_TO_BE_PLAYED = 5;
const INTERVAL = 20; // How often should the main loop loop in ms
const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 5;

const DEBUG_COLOR = "#ff0000";

class Block {
  // A generic movable object

  constructor(x, y, x2, y2, visibility) {
    this.x = x;
    this.y = y;
    this.x2 = x2;
    this.y2 = y2;
    this.speedX = 0;
    this.speedY = 0;
    // 'full', 'none', 'border only'
    visibility ? this.visibility = visibility : this.visibility = 'full';
    this.draw();
  }

  draw() {
    if (this.visibility === 'none') return;
    if (this.visibility === 'border only') {
      g.drawRect(this.x, this.y, this.x2, this.y2);
      return;
    }
    g.fillRect(this.x, this.y, this.x2, this.y2);
  }

  clear() {
    if (this.visibility === 'none') return;
    g.clearRect(this.x, this.y, this.x2, this.y2);
  }

  move() {
    this.moveBy(this.speedX, this.speedY);
  }

  moveBy(x, y) {
    // Physically move the visible object on screen, not just change the values
    this.clear();
    this.x += x;
    this.y += y;
    this.x2 += x;
    this.y2 += y;
    this.draw();
  }

  moveWithinScreen() {
    // Sets x or y to 0 if it would mean going beyond the screen
    let x = this.speedX;
    let y = this.speedY;
    if (((this.x + x) < 0) || (this.x2 + x) >= SCREEN_HEIGHT) x = 0;

    if (((this.y + y) < SCREEN_TOP + 1) || (this.y2 + y) >= SCREEN_HEIGHT) {
                      // +1 because of the block below widgets, not ideal
      y = 0;
    }

    this.moveBy(x, y);
  }

  moveToLocation(x, y) {
    const w = this.x2 - this.x;
    const h = this.y2 - this.y;
    this.clear();
    this.x = x;
    this.y = y;
    this.x2 = x + w;
    this.y2 = y + h;
    this.draw();
  }
}

class Paddle extends Block {
  /** A paddle moves by itself. It checks where the ball is and tries to move
    * in that direction. A paddle that moves whenever the ball moves would be
    * boring, so it checks where the ball is and assigns a random amount
    * of moves to itself in that direction. If there are any moves to be done,
    * it just moves in the specified direction. **/

  constructor (side) {
    this.movesLeft = 0;
    let x, y, x2, y2;

    if (side === "L") {
      x = 0;
      y = Math.round((SCREEN_HEIGHT - PADDLE_HEIGHT) / 2);
      x2 = PADDLE_WIDTH;
      y2 = y + PADDLE_HEIGHT;
    } else {
      x = SCREEN_WIDTH - PADDLE_WIDTH;
      y = Math.round((SCREEN_HEIGHT - PADDLE_HEIGHT) / 2);
      x2 = SCREEN_WIDTH - 1;
      y2 = y + PADDLE_HEIGHT;
    }

    super(x, y, x2, y2);
  }

  moveOrDecide(ball) {
    if (this.movesLeft > 0) {
      this.moveWithinScreen();
      this.movesLeft--;
      return;
    }

    this.assignDirectionAndMoves(ball);
  }

  assignDirectionAndMoves(ball) {
    const ballMiddle = ball.y + Math.round(BALL_SIZE / 2);
    const paddleMiddle = this.y + Math.round(PADDLE_HEIGHT / 2);
    if (ballMiddle > paddleMiddle) {
      // ball LOWER than paddle (y starts at 0, this can be counterintuitive)
      this.speedY = 1;
    } else if (ballMiddle < paddleMiddle) {
      this.speedY = -1;
    } else {
      this.speedY = 0;
      this.movesLeft = 0;
      return;
    }

    /** The bounds times INTERVAL gives you for how long the paddles can be
      * moving. So between 3 and 50 gives you between 60 and 1000 ms **/
    this.movesLeft = getRandIntWithinBounds(3, 50);
  }
}

class Ball extends Block {

  constructor() {
    super(-BALL_SIZE - 1, -BALL_SIZE - 1, -1, -1);
    this.resetToMiddle();
  }

  didScore() {
    if (this.x <= 0) return "R";
    if (this.x2 >= SCREEN_WIDTH - 1) return "L";
    return "";
  }

  resetToMiddle(whoScored) {
    // After one of the paddles scores or at the beginning of the game

    const clockBoxMiddle = Math.round((CLK_BOX.x2 - CLK_BOX.y) / 2);

    // Randomize whether it's above or below the clock box
    if (Math.round(Math.random()) > 0) {
      y = getRandIntWithinBounds(SCREEN_TOP + 1, CLK_BOX.y - BALL_SIZE - 1);
    } else {
      y = getRandIntWithinBounds(CLK_BOX.y2 + BALL_SIZE + 1,
                                 SCREEN_HEIGHT - BALL_SIZE - 1);
    }

    if (whoScored === "R") {
      x = getRandIntWithinBounds(CLK_BOX.x2 - 25, clockBoxMiddle);
      this.speedX = -1;
    } else if (whoScored === "L"){
      x = getRandIntWithinBounds(CLK_BOX.x + 25, clockBoxMiddle);
      this.speedX = 1;
    } else {
      x = getRandIntWithinBounds(CLK_BOX.x + 25, CLK_BOX.x2 - 25);
      this.speedX = Math.round(Math.random()) > 0 ? 1 : -1;
    }

    this.speedY = Math.round(Math.random()) > 0 ? 1 : -1;
    this.moveToLocation(x, y);
  }

  handleCollisionNoCorners(box) {
    if (this.speedY < 0 && (this.y === box.y2)) {
      // ball was going up and hit something above
      this.speedY = 1;
    } else if (this.speedY > 0 && (this.y2 === box.y)) {
      // ball was going down and hit something below
      this.speedY = -1;
    } else if (this.speedX > 0 && (this.x2 === box.x)) {
      // ball was going right and hit something right
      this.speedX = -1;
    } else if (this.speedX < 0 && (this.x === box.x2)) {
      // ball was going left and hit something left
      this.speedX = 1;
    }
  }

  checkCollision(box) {
    // Simple AABB 2D collision check
    const ballIsToTheRight = this.x > box.x2;
    const ballIsToTheLeft = this.x2 < box.x;
    const ballIsAbove = this.y2 < box.y;
    const ballIsBelow = this.y > box.y2;

    if (!(ballIsToTheRight || ballIsToTheLeft || ballIsAbove || ballIsBelow)) {
      this.handleCollisionNoCorners(box);
      return box;
    }
    return null;
  }
}

function getRandIntWithinBounds(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}


let pongPlaying = false; // so that it doesn't start twice
function pong() {
  pongPlaying = true;
  Bangle.drawWidgets();
  g.reset();
  const clockBox = new Block(CLK_BOX.x, CLK_BOX.y, CLK_BOX.x2,
                             CLK_BOX.y2, 'border only');
  const rPaddle = new Paddle("R");
  const lPaddle = new Paddle("L");
  const topBox = new Block(0, SCREEN_TOP, SCREEN_WIDTH - 1,
                           SCREEN_TOP, 'none');
  const botBox = new Block(0, SCREEN_HEIGHT, SCREEN_WIDTH - 1,
                           SCREEN_HEIGHT, 'none');
  const ball = new Ball();
  let scores = 0;

  const mainLoop = setInterval(() => {
    if (scores > GAMES_TO_BE_PLAYED) {
      clearInterval(mainLoop);
      ball.clear();
      rPaddle.clear();
      lPaddle.clear();
      pongPlaying = false;
      return;
    }

    g.reset();

    const whoScored = ball.didScore();
    if (whoScored) {
      scores++;
      ball.resetToMiddle(whoScored);
      return;
    }

    let collidedWith;
    for (const box of [clockBox, rPaddle, lPaddle, topBox, botBox]) {
      if (ball.checkCollision(box)) { collidedWith = box; }
    }

    ball.move();

    // This is in case clear() on the ball removed a part of the block
    if (collidedWith) collidedWith.draw();

    lPaddle.moveOrDecide(ball);
    rPaddle.moveOrDecide(ball);
  }, INTERVAL);
}

function drawClock() {
  g.reset();
  const date = new Date();
  const timeStr = require("locale").time(date, 1); // Hour and minute
  const dateStr = require("locale").date(date, 0).toUpperCase() + "\n" +
                  require("locale").dow(date, 0).toUpperCase();

  g.setFontAlign(0, 0).setFont("7x11Numeric7Seg:4")
    .drawString(timeStr, CLK_BOX.x + 70, CLK_BOX.y + 30, true);
  g.setFont("6x8", 2)
    .drawString(dateStr, CLK_BOX.x + 70, CLK_BOX.y + 72, true);
}

function redrawEverySecUntil0() {
  // I want to save battery by redrawing every minute, starting on 0 seconds
  const waitingInterval = setInterval(() => {
    drawClock();
    const date = new Date();
    if (date.getSeconds() === 0) {
      clearInterval(waitingInterval);
      setInterval(drawClock, 60000);
    }
  }, 1000);
}

require("Font7x11Numeric7Seg").add(Graphics);
g.clear();
drawClock();
// Draw it so that it doesn't just appear when pong starts
g.drawRect(CLK_BOX.x, CLK_BOX.y, CLK_BOX.x2, CLK_BOX.y2);
Bangle.loadWidgets();
Bangle.drawWidgets();
Bangle.setUI("clock");
Bangle.on('lock', (lockedScreen) => {
  if (!pongPlaying && !lockedScreen) pong();
});
redrawEverySecUntil0();
