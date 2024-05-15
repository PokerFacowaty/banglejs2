const SCREEN_SIZE = 176;
const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 5;
// const REFRESH_RATE = 1;
const BALL_SIZE = 6;
const DEBUG_COLOR = "#ff0000";
const START_BOX_W = 50;
const INTERVAL = 20;

class Box {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  draw() {
    g.drawRect(this.x1, this.y1, this.x2, this.y2);
  }
}

const clockBox = new Box(25, 50, SCREEN_SIZE - 25, SCREEN_SIZE - 50);

const _startBoxes = [
  new Box((SCREEN_SIZE / 2) - START_BOX_W, 0, SCREEN_SIZE / 2, clockBox.y1),
  new Box(SCREEN_SIZE / 2, 0, SCREEN_SIZE / 2 + START_BOX_W, clockBox.y1),
  new Box(SCREEN_SIZE / 2, clockBox.y2, SCREEN_SIZE / 2 + START_BOX_W, SCREEN_SIZE),
  new Box(SCREEN_SIZE / 2 - START_BOX_W, clockBox.y2, SCREEN_SIZE / 2 + START_BOX_W, SCREEN_SIZE)
];

const startBoxes = {
  topLeft: new Box((SCREEN_SIZE / 2) - START_BOX_W, 0, SCREEN_SIZE / 2, clockBox.y1),
  topRight: new Box(SCREEN_SIZE / 2, 0, SCREEN_SIZE / 2 + START_BOX_W, clockBox.y1),
  bottomRight: new Box(SCREEN_SIZE / 2, clockBox.y2, SCREEN_SIZE / 2 + START_BOX_W, SCREEN_SIZE),
  bottomLeft: new Box(SCREEN_SIZE / 2 - START_BOX_W, clockBox.y2, SCREEN_SIZE / 2 + START_BOX_W, SCREEN_SIZE),
};

class Block {
  draw() {
    g.fillRect(this.x1, this.y1, this.x2, this.y2);
  }

  clear() {
    g.clearRect(this.x1, this.y1, this.x2, this.y2);
  }

  move(x, y) {
    g.clearRect(this.x1, this.y1, this.x2, this.y2);
    this.x1 += x;
    this.y1 += y;
    this.x2 += x;
    this.y2 += y;
    g.fillRect(this.x1, this.y1, this.x2, this.y2);
  }

  moveWithinScreenBounds(x, y) {
    if ((this.x1 + x) < 0) x = -this.x1;
    if ((this.x2 + x) > (SCREEN_SIZE - 1)) x = 175 - this.x2;
    if ((this.y1 + y) < 0) y = -this.y1;
    if ((this.y2 + y) > (SCREEN_SIZE - 1)) y = 175 - this.y2;
    this.move(x, y);
  }

  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.draw();
  }
}

class Paddle extends Block {

  constructor(side) {
    height = PADDLE_HEIGHT;
    width = PADDLE_WIDTH;
    let x1, y1, x2, y2;
    let movesLeft = 0;
    let currentDirectionY = 0;

    if (side === "R") {
      x1 = SCREEN_SIZE - PADDLE_WIDTH;
      y1 = (SCREEN_SIZE - PADDLE_HEIGHT) / 2;
      x2 = SCREEN_SIZE;
      y2 = (SCREEN_SIZE / 2) + (PADDLE_HEIGHT / 2);
    } else {
      x1 = 0;
      y1 = (SCREEN_SIZE - PADDLE_HEIGHT) / 2;
      x2 = PADDLE_WIDTH;
      y2 = (SCREEN_SIZE / 2) + (PADDLE_HEIGHT / 2); 
    }

    super(x1, y1, x2, y2);
  }

  maybeMove(ball) {
    if (getRandomIntWithinBounds(0, 2)) {
      return;
    }

    const byHowMuch = getRandomIntWithinBounds(5, 50);
    if ((ball.y1 + ball.size) < (this.y1 + PADDLE_WIDTH)) {
      this.moveWithinScreenBounds(0, -byHowMuch);
    } else {
      this.moveWithinScreenBounds(0, byHowMuch);
    }
  }

  assignDirectionAndMoves(ball) {
    if ((ball.y1 + ball.size) < (this.y1 + PADDLE_WIDTH)) {
      this.currentDirectionY = -1;
    } else if ((ball.y1 + ball.size) > (this.y1 + PADDLE_WIDTH)) {
      this.currentDirectionY = 1;
    } else {
      this.currentDirectionY = 0;
    }

    this.movesLeft = getRandomIntWithinBounds(3, 50);
  }
}

g.clear();
clockBox.draw();
const rPaddle = new Paddle("R");
const lPaddle = new Paddle("L");

class Ball extends Block {

  constructor(side) {
    this.size = BALL_SIZE;
    let x1, y1;

    if (side === "L") {
      x1 = getRandomIntWithinBounds(
        // it's only for x so top or bottom doesn't make a difference
        startBoxes.topLeft.x1, startBoxes.topLeft.x2
      );
      this.direction = Math.round(Math.random()) + 1; // 1 or 2
    } else if (side === "R") {
      x1 = getRandomIntWithinBounds(
        startBoxes.topRight.x1, startBoxes.topRight.x2
      );
      this.direction = 3 * Math.round(Math.random()); // 0 or 3
    } else {
      x1 = (SCREEN_SIZE / 2) - (BALL_SIZE / 2);
      this.direction = getRandomIntWithinBounds(0, 3);
    }

    const belowClock = Boolean(Math.round(Math.random()));
    if (belowClock) {
      y1 = getRandomIntWithinBounds(clockBox.y2, SCREEN_SIZE - this.size);
    } else {
      y1 = getRandomIntWithinBounds(0, clockBox.y1 - this.size);
    }

    super(x1, y1, x1 + this.size, y1 + this.size);
  }

  didScore() {
    if (this.x2 > SCREEN_SIZE - 1) {
      return "L";
    }

    if (this.x1 < 0) {
      return "R";
    }
    return "";
  }

  moveInDirection(direction) {
    switch (direction) {
      case 0:
        this.move(-1, -1);
        break;
      case 1:
        this.move(1, -1);
        break;
      case 2:
        this.move(1, 1);
        break;
      case 3:
        this.move(-1, 1);
        break;
    }
  }

  bounceIfCollided() {
    // TODO: bouncing of top of paddles
    if (
      (this.direction === 0 ||
       this.direction === 1) &&

      this.y1 === 0 ||
      (this.x1 >= clockBox.x1 &&
       this.x2 <= clockBox.x2 &&
       this.y1 === clockBox.y2 + 1)
    ) {
      // Hitting upwards
      this.direction = {0: 3, 1: 2}[this.direction];
    } else if (
      (this.direction === 2 ||
        this.direction === 3) &&

      this.y2 === SCREEN_SIZE ||

    // Top of clockBox
      (this.x1 >= clockBox.x1 &&
       this.x2 <= clockBox.x2 &&
       this.y2 === clockBox.y1 - 1)
    ) {
      // Hitting downwards
      this.direction = {2: 1, 3: 0}[this.direction];
    } else if (
      (this.direction === 0 ||
        this.direction === 3) &&

      // Right wall of clockBox
      (this.y1 <= clockBox.y2 &&
       this.y2 >= clockBox.y1 &&
       this.x1 === clockBox.x2 + 1) ||

      // Left paddle
      (this.y1 <= lPaddle.y2 &&
       this.y2 >= lPaddle.y1 &&
       this.x1 === lPaddle.x2 + 1)
    ) {
      // Hitting leftwards
      this.direction = {0: 1, 3: 2}[this.direction];
    } else if (
      (this.direction === 1 ||
        this.direction === 2) &&

        // Left wall of clockBox
      (this.y1 <= clockBox.y2 &&
       this.y2 >= clockBox.y1 &&
       this.x2 === clockBox.x1 - 1) ||

      // Right paddle
      (this.y1 <= rPaddle.y2 &&
       this.y2 >= rPaddle.y1 &&
       this.x2 === rPaddle.x1 - 1)
    ) {
      // Hiting rightwards
      this.direction = {1: 0, 2: 3}[this.direction];
    } else if (
      this.direction === 0 &&
      // Screen corner
      (this.x1 === 0 && this.y1 === 0) ||
      // clockBox corner
      (this.x1 === clockBox.x2 + 1 && this.y1 === clockBox.y2 + 1) ||
      // lPaddle corner
      (this.x1 === lPaddle.x2 + 1 && this.y1 === lPaddle.x2 + 1)
    ) {
      // Top-left corner
      this.direction = 2;
    } else if (
      this.direction === 1 &&
      // Screen corner
      (this.x2 === SCREEN_SIZE - 1 && this.y1 === 0) ||
      // clockBox corner
      (this.x2 === clockBox.x1 - 1 && this.y1 === clockBox.y2 + 1) ||
      // rPaddle corner
      (this.x2 === rPaddle.x1 - 1 && this.y1 === rPaddle.y2 + 1)
    ) {
      // Top-right corner
      this.direction = 3;
    } else if (
      this.direction === 2 &&
      // Screen corner
      (this.x2 === SCREEN_SIZE - 1 && this.y2 === SCREEN_SIZE - 1) ||
      // clockBox corner
      (this.x2 === clockBox.x1 - 1 && this.y2 === clockBox.y1 - 1) ||
      // rPaddle corner
      (this.x2 === rPaddle.x1 - 1 && this.y2 === rPaddle.y1 - 1)
    ) {
      // Bottom - right corner
      this.direction = 0;
    } else if (
      this.direction === 3 &&
      // Screen corner
      (this.x1 === SCREEN_SIZE - 1 && this.y2 === SCREEN_SIZE - 1) ||
      // clockBox corner
      (this.x1 === clockBox.x2 + 1 && this.y2 === clockBox.y1 - 1) ||
      // lPaddle corner
      (this.x1 === lPaddle.x2 + 1 && this.y2 === rPaddle.y1 - 1)
    ) {
      // Bottom-left corner
      this.direction = 1;
    }
  }
}

function getRandomIntWithinBounds(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

const score = {"R": 0, "L": 0};
function updateScore(which) {
  score[which]++;
  console.log(score);
}

let ball = new Ball("");
rPaddle.assignDirectionAndMoves(ball);
lPaddle.assignDirectionAndMoves(ball);

let moves = 0;
const movementInterval = setInterval(() => {
  if (moves > 2000) {
    clearInterval(movementInterval);
    return;
  }

  g.setColor("#ffffff").fillRect(50, 20, 60, 30).setColor('#000000').drawString(`${score["L"]}:${score["R"]}`, 50, 20);

  const scored = ball.didScore();
  if (scored) {
    // TODO: add points;
    updateScore(scored);

    ball.clear();
    ball = new Ball(scored);
    return;
  }

  ball.bounceIfCollided();

  ball.moveInDirection(ball.direction);
  // lPaddle.maybeMove(ball);
  // rPaddle.maybeMove(ball);
  if (rPaddle.movesLeft <= 0) rPaddle.assignDirectionAndMoves(ball);
  rPaddle.moveWithinScreenBounds(0, rPaddle.currentDirectionY);
  rPaddle.movesLeft--;

  if (lPaddle.movesLeft <= 0) lPaddle.assignDirectionAndMoves(ball);
  lPaddle.moveWithinScreenBounds(0, lPaddle.currentDirectionY);
  lPaddle.movesLeft--;

  moves++;
}, INTERVAL);