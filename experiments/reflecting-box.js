const SCREEN_SIZE = 176;
const POINT_SIZE = 10;
const POINT_LIFESPAN = 500;
const DRAWING_FREQ = 5; // 1 - redraw point everytime it moves, 5 - every 5 moves etc

// pixels per second
const SPEED_PPS = 5;


function drawRect() {
  const d = new Date();
  const h = d.getHours(), m = d.getMinutes();
  const time = h + ":" + m.toString().padStart(2,0);

  g.reset();
  // g.clearRect(50, 50, 100, 120);
  // g.drawString(time, 50, 50);
  g.drawRect(50, 50, SCREEN_SIZE - 50, SCREEN_SIZE - 50);
}

function createPoint(size) {
  const x = Math.round(Math.random() * (SCREEN_SIZE - POINT_SIZE));
  // const y = Math.round(Math.random() * (SCREEN_SIZE - POINT_SIZE));
  const y = 166;
  const speed = 1;
  const direction = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(Math.random() * 8)];
  console.log({x, y, speed, direction});
  return {x, y, size, speed, dir: direction};
}

function drawPoint(point) {
  g.fillRect(point.x, point.y, point.x + point.size, point.y + point.size);
}

function redrawPoint(point, movedPoint) {
  g.clear();
  g.fillRect(movedPoint.x, movedPoint.y, movedPoint.x + movedPoint.size, movedPoint.y + movedPoint.size);
}

function movePoint(point) {
  const hitsEdge = pointisHittingEdge(point);
  const onEdge = hitsEdge[0];
  const onWhich = hitsEdge[1];
  if (onEdge) {
    point.dir = reflectDir(point.dir, onWhich);
  }
  if (point.dir.includes("N")) {
    point.y -= point.speed;
  }
  if (point.dir.includes("S")) {
    point.y += point.speed;
  }
  if (point.dir.includes("W")) {
    point.x -= point.speed;
  }
  if (point.dir.includes("E")) {
    point.x += point.speed;
  }
  return point;
}

function pointisHittingEdge(point){
  // returns if point is hitting an edge and which one
  if (point.y === 0 &&
      (point.dir[0] === "N")) return [true, "U"];
  if (point.y + point.size === SCREEN_SIZE &&
     (point.dir[0] === "S")) return [true, "D"];
  if (point.x === 0 &&
      point.dir === "W" ||
     (point.dir.length === 2 && point.dir[1] === "W")) return [true, "L"];
  if (point.x + point.size === SCREEN_SIZE &&
     point.dir === "E" ||
     (point.dir.length === 2 && point.dir[1] === "E")) return [true, "R"];
  return [false, ""];
}

function reverseDir(dir){
  const dirs = {
    "N": "S",
    "S": "N",
    "E": "W",
    "W": "E",
    "NE": "SW",
    "SW": "NE",
    "SE": "NW",
    "NW": "SE"
  };
  return dirs[point.dir];
}

function reflectDir(dir, onWhich){
  const opposite = {
    "N": "S",
    "S": "N",
    "E": "W",
    "W": "E"
  };

  if (dir.length === 1) return opposite[dir];

  if (onWhich === "U" || onWhich === "D"){
    return opposite[dir[0]] + dir[1];
  }

  if (onWhich === "L" || onWhich === "R"){
    return dir[0] + opposite[dir[1]];
  }
}

g.clear();
// drawRect();

// [x, y, speed, direction]
let point = createPoint(POINT_SIZE);

drawPoint(point);

const cycleTime = Math.round(SPEED_PPS * 1 / 1000);
let moves = 0;
const moveInterval = setInterval(() => {
  if (moves > POINT_LIFESPAN){
    clearInterval(moveInterval);
  }

  const movedPoint = movePoint(point);
  if (moves % DRAWING_FREQ === 0) redrawPoint(point, movedPoint);
  moves++;
  point = movedPoint;
}, cycleTime);

