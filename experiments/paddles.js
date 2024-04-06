const SCREEN_SIZE = 176;
const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 5;
const CLOCK_BOX = new Uint8Array([25, 50, SCREEN_SIZE - 25, SCREEN_SIZE - 50]); // x1, y1, x2, y2
const REFRESH_RATE = 1; // 1 - redraw everytime anything moves, 5 - every 5 moves etc
const BALL_SIZE = 6; // even
const BALL_SPEED = 10; // in pixels per second
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

function drawFieldAndPaddles() {
  g.clear();
  g.drawRect.apply(this, CLOCK_BOX);

  // Left paddle
  g.fillRect(
    0,
    (SCREEN_SIZE - PADDLE_HEIGHT) / 2,
    PADDLE_WIDTH,
    SCREEN_SIZE / 2 + (PADDLE_HEIGHT / 2)
  );
  // Right paddle
  g.fillRect(
    SCREEN_SIZE - PADDLE_WIDTH,
    (SCREEN_SIZE - PADDLE_HEIGHT) / 2,
    SCREEN_SIZE,
    SCREEN_SIZE / 2 + (PADDLE_HEIGHT / 2)
  );

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
  g.flip();
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
  
  const speed = BALL_SPEED;

  return {x, y, size: ballSize, speed, direction};
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


function redrawBall(ball){
  g.fillRect(ball.x, ball.y, ball.x + ball.size, ball.y + ball.size);
}

function moveBall(ball){
  const edging = isAboutToHitWall(ball);
  const onEdge = edging[0];
  const onWhich = edging[1];

  if (onEdge) {
    ball.direction = reflectDir(ball.direction, onWhich);
  }

  switch (ball.direction){
    case 0:
      ball.x -= ball.speed;
      ball.y += ball.speed;
      break;
    case 1:
      ball.x += ball.speed;
      ball.y += ball.speed;
      break;
    case 2:
      ball.x += ball.speed;
      ball.y -= ball.speed;
      break;
    case 3:
      ball.x -= ball.speed;
      ball.y -= ball.speed;
      break;
  }
  return ball;
}

function reflectDir(direction, onWhich){
  const hLineOpposites = {0:3, 1:2, 2:1, 3:0};
  const vLineOpposites = {0:1, 1:0, 2:3, 3:2};

  if (onWhich === "TOP" || onWhich === "BOT"){
    return hLineOpposites[direction];
  }
  
  // TODO: add vertical variations

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
  // let's start with screen edges
  if (ball.y === 0 && ball.direction === 0 || ball.direction === 1) {
    // top edge of the screen
    return [true, "TOP"];
  } else if (ball.y + ball.size === SCREEN_SIZE && ball.direction === 2 ||
    ball.direction === 3) {
      // bottom edge of the screen
      return [true, "BOT"];
  }
  else return [false, ""];
}

g.clear();

drawFieldAndPaddles();
_drawFieldBorder();
let ball = createBall(BALL_SIZE, 0);
drawBall(ball);

const cycleTime = Math.round( (1 / BALL_SPEED) * 1000);
let moves = 0;
let oldBall = Object.assign({}, ball);
const moveInterval = setInterval(() => {
  // TODO: change the test value
  if (moves > 250){
    clearInterval(moveInterval);
  }

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
    ball = moveBall(ball);
    oldBall = Object.assign({}, ball);
    redrawBall(ball);
  }
  else {
    ball = moveBall(ball);
  }

  moves++;
}, cycleTime);
