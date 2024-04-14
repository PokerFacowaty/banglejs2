const SCREEN_SIZE = 176;
const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 5;
const CLOCK_BOX = new Uint8Array([25, 50, SCREEN_SIZE - 25, SCREEN_SIZE - 50]); // x1, y1, x2, y2
const REFRESH_RATE = 1; // 1 - redraw everytime anything moves, 5 - every 5 moves etc
const BALL_SIZE = 6; // even
const BALL_SPEED = 50; // in pixels per second
const DEBUG_COLOR = '#ff0000';
// The width of the "box" the ball will appear in after scoring
const START_BOX_W = 50;
const START_BOX_TOP_LEFT = new Uint8Array([
  (SCREEN_SIZE / 2) - START_BOX_W,
  0,
  SCREEN_SIZE / 2,
  CLOCK_BOX[1]
]);
const START_BOX_TOP_RIGHT = new Uint8Array([
  SCREEN_SIZE / 2,
  0,
  SCREEN_SIZE / 2 + START_BOX_W,
  CLOCK_BOX[1]
]);
const START_BOX_BOTTOM_LEFT = new Uint8Array([
  (SCREEN_SIZE / 2) - START_BOX_W,
  CLOCK_BOX[3],
  SCREEN_SIZE / 2,
  SCREEN_SIZE
]);
const START_BOX_BOTTOM_RIGHT = new Uint8Array([
  SCREEN_SIZE / 2,
  CLOCK_BOX[3],
  SCREEN_SIZE / 2 + START_BOX_W,
  SCREEN_SIZE
]);

let ball;
let paddles;

function drawField() {
  g.drawRect.apply(this, CLOCK_BOX);

  // An attempt at a dashed middle line
  // TODO: these have to be redrawn if the ball is on them and is being removed
  for (i = 0; i < CLOCK_BOX[1]; i += 10) {
    g.drawLine(
      SCREEN_SIZE / 2,
      i,
      SCREEN_SIZE / 2,
      i + 5
    );
  }

  // Same thing for below the clock box
  for (i = SCREEN_SIZE; i > CLOCK_BOX[3]; i -= 10) {
    g.drawLine(
      SCREEN_SIZE / 2,
      i,
      SCREEN_SIZE / 2,
      i - 5
    );
  }
  // g.flip();
}

function _drawFieldBorder() {
  g.setColor(DEBUG_COLOR);
  g.drawLine((SCREEN_SIZE / 2) - START_BOX_W, 0, (SCREEN_SIZE / 2) - START_BOX_W, SCREEN_SIZE);
  g.drawLine((SCREEN_SIZE / 2) + START_BOX_W, 0, (SCREEN_SIZE / 2) + START_BOX_W, SCREEN_SIZE);
  g.reset();
}

function createBall(ballSize, side) {
  // Created in a random spot within the start box of the last round's winner
  // heading towards the loser
  // Random spot on the middle line heading randomly if first round
  // side: 0 - first round, 1 - left, 2 - right;

  // direction is 0 to 3 starting at northwest and going clockwise
  const belowClock = Boolean(Math.round(Math.random()));

  let x, y, direction;

  if (side === 0){
    x = (SCREEN_SIZE / 2) - (BALL_SIZE / 2);
    direction = getRandomWithBounds(0, 3);
  } else if (side === 1){
    x = getRandomWithBounds(
      // TOP or BOTTOM doesn't make a difference here since it's about x
      START_BOX_TOP_LEFT[0], START_BOX_TOP_LEFT[2]
    );
    direction = Math.round(Math.random()) + 1;
  } else {
    x = getRandomWithBounds(
      START_BOX_TOP_RIGHT[0], START_BOX_TOP_RIGHT[2]
    );
    direction = 3 * Math.round(Math.random());
  }

  if (belowClock){
    y = getRandomWithBounds(CLOCK_BOX[3], SCREEN_SIZE);
  }
  else {
    y = getRandomWithBounds(0, CLOCK_BOX[1]);
  }

  return {x, y, size: ballSize, direction};
}

function createPaddles() {
  // Left paddle
  const left = new Uint8Array([0, (SCREEN_SIZE - PADDLE_HEIGHT) / 2, PADDLE_WIDTH, SCREEN_SIZE / 2 + (PADDLE_HEIGHT / 2)]);
  // g.fillRect.apply(this, left);

  // Right paddle
  const right = new Uint8Array([SCREEN_SIZE - PADDLE_WIDTH, (SCREEN_SIZE - PADDLE_HEIGHT) / 2, SCREEN_SIZE, SCREEN_SIZE / 2 + (PADDLE_HEIGHT / 2)]);
  // g.fillRect.apply(this, right);

  return [left, right];
}

function movePaddle(paddle, cycleTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const paddleMiddlePoint = Math.round(paddle[1] + PADDLE_HEIGHT / 2);
      const distance = getRandomWithBounds(5, 25);
      if (ball.y + Math.round(BALL_SIZE / 2) >= paddleMiddlePoint) {
        if ((paddle[1] + distance) >= SCREEN_SIZE){
          resolve(paddle);
          return;
        }
        paddle[1] += distance;
        paddle[3] += distance;
      } else if (ball.y + Math.round(BALL_SIZE / 2) <= paddleMiddlePoint) {
          if ((paddle[1] - distance) <= 0){
            resolve(paddle);
            return;
          }
        paddle[1] -= distance;
        paddle[3] -= distance;
      }
      resolve(paddle);
    }, getRandomWithBounds(cycleTime * 2, cycleTime * 4));
  });
}

function drawPaddle(paddle) {
  g.fillRect(paddle[0], paddle[1], paddle[2], paddle[3]);
}

function deletePaddleFromScreen(paddle) {
  g.clearRect(paddle[0], paddle[1], paddle[2], paddle[3]);
}

function getRandomWithBounds(min, max){
  return Math.round(Math.random() * (max - min) + min);
}

function drawBall(ball){
  g.fillRect(ball.x, ball.y, ball.x + ball.size, ball.y + ball.size);
}

function deleteBallFromScreen(ball){
  g.clearRect(ball.x, ball.y, ball.x + ball.size, ball.y + ball.size);
}

function moveBall(ball){
  // remeber that y is the opposite than you think, bigger y - LOWER on screen
  const edging = isAboutToHitWall(ball);
  const onEdge = edging[0];
  const onWhich = edging[1];

  if (onEdge) {
    ball.direction = reflectDir(ball.direction, onWhich);
  }

  switch (ball.direction){
    case 0:
      ball.x--;
      ball.y--;
      break;
    case 1:
      ball.x++;
      ball.y--;
      break;
    case 2:
      ball.x++;
      ball.y++;
      break;
    case 3:
      ball.x--;
      ball.y++;
      break;
  }
  return ball;
}

function reflectDir(direction, onWhich){
  const hLineOpposites = {0:3, 1:2, 2:1, 3:0};
  const vLineOpposites = {0:1, 1:0, 2:3, 3:2};

  if (onWhich === "TOP" || onWhich === "BOT" || onWhich === "CT" || onWhich === "CB"){
    return hLineOpposites[direction];
  }
  if (onWhich === "LP" || onWhich === "RP" || onWhich === "CL" || onWhich === "CR") {
    return vLineOpposites[direction];
  }
}

function didScore(ball){
  if (ball.x <= 0 && (ball.direction === 0 || ball.direction === 3)) {
    return 2;
  }

  if ((ball.x + ball.size) >= SCREEN_SIZE && (ball.direction === 1 || ball.direction === 2)) {
    return 1;
  }

  return 0;
}

function isAboutToHitWall(ball){
  // TODO: make it a switch case probably
  // let's start with screen edges
  if ((ball.direction === 0 || ball.direction === 1) &&
      ball.y <= 0) {
    // top edge of the screen
    return [true, "TOP"];
  }

  if ((ball.direction === 2 || ball.direction === 3) &&
      ball.y + BALL_SIZE + 1 >= SCREEN_SIZE - 1) {
      // bottom edge of the screen
      return [true, "BOT"];
  }

  if ((ball.direction === 0 || ball.direction === 3) &&
      (ball.x === (0 + PADDLE_WIDTH + 1)) &&
      // bottom of ball >= top of paddle
      (ball.y + BALL_SIZE) >= paddles[0][1] &&
      // top of ball <= bottom of paddle
      (ball.y <= paddles[0][3])) {
        // left paddle
        return [true, "LP"];
  }

  if ((ball.direction === 1 || ball.direction === 2) &&
      (ball.x + BALL_SIZE === (SCREEN_SIZE - 1 - PADDLE_WIDTH)) &&
      // bottom of ball >= top of paddle
      (ball.y + BALL_SIZE) >= paddles[1][1] &&
      // top of ball <= bottom of paddle
      (ball.y <= paddles[1][3])) {
        // right paddle
        return [true, "RP"];
  }

  if ((ball.direction === 2 || ball.direction === 3) &&
      // bottom of ball >= top of clock box
      (ball.y + BALL_SIZE) === CLOCK_BOX[1] - 1 &&
      ball.x >= CLOCK_BOX[0] &&
      (ball.x + BALL_SIZE) <= CLOCK_BOX[2]) {
    return [true, "CT"];
  }

  if ((ball.direction === 0 || ball.direction === 1) &&
      // top of ball <= bottom of clock box
      ball.y === CLOCK_BOX[3] + 1 &&
      ball.x >= CLOCK_BOX[0] &&
      (ball.x + BALL_SIZE) <= CLOCK_BOX[2]) {
    return [true, "CB"];
  }

  if ((ball.direction === 1 || ball.direction === 2) &&
      // right of ball >= left of clock_box
      (ball.x + BALL_SIZE) === (CLOCK_BOX[0] - 1) &&
      ball.y >= CLOCK_BOX[1] &&
      ball.y <= CLOCK_BOX[3]) {
    return [true, "CL"];
  }

  if ((ball.direction === 0 || ball.direction === 3) &&
      // left of ball <= right of clock_box
      ball.x === (CLOCK_BOX[2] + 1) &&
      ball.y >= CLOCK_BOX[1] &&
      ball.y <= CLOCK_BOX[3]) {
    return [true, "CR"];
  }

  return [false, ""];
}

g.clear();

drawField();
paddles = createPaddles();
drawPaddle(paddles[0]);
drawPaddle(paddles[1]);
_drawFieldBorder();
ball = createBall(BALL_SIZE, 0);
drawBall(ball);

const cycleTime = Math.round( (1 / BALL_SPEED) * 1000);
let moves = 0;
let oldPaddles = JSON.parse(JSON.stringify(paddles));
let oldBall = Object.assign({}, ball);

const paddleInterval = setInterval(() => {
  // TODO: change the test value
  if (moves > 1000) {
    clearInterval(paddleInterval);
  }

  movePaddle(paddles[0], cycleTime).then(movedPaddle => {
    if (moves % REFRESH_RATE === 0) {
      deletePaddleFromScreen(oldPaddles[0]);
      oldPaddles[0] = JSON.parse(JSON.stringify(paddles[0]));
      drawPaddle(movedPaddle);
    }
    paddles[0] = movedPaddle;
  });
  movePaddle(paddles[1], cycleTime).then(movedPaddle => {
    if (moves % REFRESH_RATE === 0) {
      deletePaddleFromScreen(oldPaddles[1]);
      oldPaddles[1] = JSON.parse(JSON.stringify(paddles[1]));
      drawPaddle(movedPaddle);
    }
    paddles[1] = movedPaddle;
  });

}, cycleTime);

const moveInterval = setInterval(() => {
  // TODO: change the test value
  if (moves > 1000){
    clearInterval(moveInterval);
  }

  ball = moveBall(ball);
  const scored = didScore(ball);
  if (scored){
    // addPoints();
    deleteBallFromScreen(oldBall);
    ball = createBall(BALL_SIZE, scored);
    drawBall(ball);
    moves = 0;
    oldBall = Object.assign({}, ball);
    return;
  }


  if (moves % REFRESH_RATE === 0) {
    deleteBallFromScreen(oldBall);
    drawField();
    oldBall = Object.assign({}, ball);
    drawBall(ball);
  }
  console.log(process.memory());

  moves++;
}, cycleTime);
