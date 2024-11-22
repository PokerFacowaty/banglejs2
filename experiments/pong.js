// Regular consts
const SCREEN_HEIGHT = g.getHeight();
const SCREEN_WIDTH = g.getWidth(); // TODO: account for widget panel
const BALL_SIZE = 6; // hehehe
const CLOCK_BOX_LOCATION = {x: 25, y: 50, x2: SCREEN_WIDTH - 25, y2: SCREEN_HEIGHT - 50};
const INTERVAL = 20; // How often should the main loop loop in ms
const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 5;

// Debug consts
const DEBUG_COLOR = "#ff0000";

class Block {
  // A generic movable object

  constructor(x, y, x2, y2, borderOnly) {
    this.x = x;
    this.y = y;
    this.x2 = x2;
    this.y2 = y2;
    this.borderOnly = borderOnly;
    this.draw();
  }

  draw() {
    if (this.borderOnly) {
      g.drawRect(this.x, this.y, this.x2, this.y2)
      return;
    }
    g.fillRect(this.x, this.y, this.x2, this.y2);
  }

  drawBorder() {
  }

  clear() {
    g.clearRect(this.x, this.y, this.x2, this.y2);
  }

  move(x, y) {
    // Physically move the visible object on screen, not just change the values
    this.clear();
    this.x += x;
    this.y += y;
    this.x2 += x;
    this.y2 += y;
    this.draw();
  }

  moveWithinScreen(x, y) {
    // Sets x or y to 0 if it would mean going beyond the screen
    if (((this.x + x) < 0) || (this.x2 + x) >= SCREEN_HEIGHT) {
      x = 0;
    }

    if (((this.y + y) < 0) || (this.y2 + y) >= SCREEN_WIDTH) {
      y = 0;
    }

    this.move(x, y);
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
    this.direction = 0;
    let x, y, x2, y2;

    if (side === "L") {
      x = 0;
      y = Math.round((SCREEN_HEIGHT - PADDLE_HEIGHT) / 2);
      x2 = PADDLE_WIDTH;
      y2 = y + PADDLE_HEIGHT;
    } else {
      x = SCREEN_WIDTH - PADDLE_WIDTH;
      y = Math.round((SCREEN_HEIGHT - PADDLE_HEIGHT) / 2);
      x2 = SCREEN_WIDTH;
      y2 = y + PADDLE_HEIGHT;
    }

    super(x, y, x2, y2);
  }

  moveOrDecide(ball) {
    if (this.movesLeft > 0) {
      super.moveWithinScreen(0, this.direction);
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
      this.direction = 1;
    } else if (ballMiddle < paddleMiddle) {
      this.direction = -1;
    } else {
      this.direction = 0;
      this.movesLeft = 0;
      return;
    }

    /** The bounds times INTERVAL give you for how long the paddles can be
      * moving. So between 3 and 50 gives you between 60 and 1000 ms **/
    this.movesLeft = getRandIntWithinBounds(3, 50);
  }
}

class Ball extends Block {
  /** A ball can move in four directions diagonally. **/

  constructor() {
    /** This should only get called at the very start of the game, so it
      * randomizes the ball's position and direction within reason **/

    x = getRandIntWithinBounds(
      CLOCK_BOX_LOCATION.x + 25, CLOCK_BOX_LOCATION.x2 - 25);

    if (Math.round(Math.random()) > 0) {
      // Above the clock box
      y = getRandIntWithinBounds(
        0, CLOCK_BOX_LOCATION.y - 10
      );   
    } else {
      y = getRandIntWithinBounds(CLOCK_BOX_LOCATION.y2 + 10, SCREEN_HEIGHT);
    }

    super(x, y, x + BALL_SIZE, y + BALL_SIZE);
    this.speedX = Math.round(Math.random()) ? 1 : -1;
    this.speedY = Math.round(Math.random()) ? 1 : -1;
  }

  moveUsingSpeed() {
    // this.moveWithinScreen(this.speedX, this.speedY);
    this.move(this.speedX, this.speedY);
  }

  didScore() {
    if (this.x <= 0) {
      return "R";
    }

    if (this.x2 >= SCREEN_WIDTH - 1) {
      return "L";
    }

    return "";
  }

  resetToMiddle(whoScored) {
    // After one of the paddles scores
    
    const clockBoxMiddle = Math.round(
      (CLOCK_BOX_LOCATION.x2 - CLOCK_BOX_LOCATION.y) / 2);

    if (Math.round(Math.random()) > 0) {
      // Above the clock box
      y = getRandIntWithinBounds(0, CLOCK_BOX_LOCATION.y - 10);
    } else {
      y = getRandIntWithinBounds(CLOCK_BOX_LOCATION.y2 + 10, SCREEN_HEIGHT);
    }

    if (whoScored === "R") {
      x = getRandIntWithinBounds(CLOCK_BOX_LOCATION.x2 - 25, clockBoxMiddle);
      this.speedX = -1;
    } else {
      x = getRandIntWithinBounds(CLOCK_BOX_LOCATION.x + 25, clockBoxMiddle);
      this.speedX = 1;
    }

    this.speedY = Math.round(Math.random()) > 0 ? 1 : -1;
    this.moveToLocation(x, y);
  }

  moveToLocation(x, y) {
    this.clear();
    this.x = x;
    this.y = y;
    this.x2 = x + BALL_SIZE;
    this.y2 = y + BALL_SIZE;
    this.draw();
  }

  handleCollisionNoCorners(box) {
    if (this.speedY < 0 && (this.y === box.y2)) {
      // this was going up and hit something above
      this.speedY = 1;
    } else if (this.speedY > 0 && (this.y2 === box.y)) {
      // this was going down and hit something below
      this.speedY = -1;
    } else if (this.speedX > 0 && (this.x2 === box.x)) {
      // this was going right and hit something right
      this.speedX = -1;
    } else if (this.speedX < 0 && (this.x === box.x2)) {
      // this was going left and hit something left
      this.speedX = 1;
    }
  }

  newCheckCollision(box) {
    const ballIsToTheRight = this.x > box.x2;
    const ballIsToTheLeft = this.x2 < box.x;
    const ballIsAbove = this.y2 < box.y;
    const ballIsBelow = this.y > box.y2;

    if (!(ballIsToTheRight || ballIsToTheLeft || ballIsAbove || ballIsBelow)) {
      console.log("COLLISION!");
      console.log(this);
      console.log("collision with: ", JSON.stringify(box));
      this.handleCollisionNoCorners(box);
      return box;
    }
    return null;
  }
}

function getRandIntWithinBounds(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}



function main() {
  g.clear();
  const clockBox = new Block(CLOCK_BOX_LOCATION.x, CLOCK_BOX_LOCATION.y, CLOCK_BOX_LOCATION.x2, CLOCK_BOX_LOCATION.y2, false);
  const rPaddle = new Paddle("R");
  const lPaddle = new Paddle("L");
  const topBox = new Block(0, 0, SCREEN_WIDTH - 1, 0);
  const botBox = new Block(0, SCREEN_HEIGHT - 1, SCREEN_WIDTH - 1, SCREEN_HEIGHT - 1);
  const ball = new Ball();
  const mainLoop = setInterval(() => {
    const whoScored = ball.didScore();
    if (whoScored) {
      ball.resetToMiddle(whoScored);
      return;
    }

    let collidedWith;
    for (const box of [clockBox, rPaddle, lPaddle, topBox, botBox]) {
      if (ball.newCheckCollision(box)) { collidedWith = box }
    }

    ball.moveUsingSpeed();

    if (collidedWith) {
      collidedWith.draw();
    }

    lPaddle.moveOrDecide(ball);
    rPaddle.moveOrDecide(ball);
  }, INTERVAL);
}

main();
