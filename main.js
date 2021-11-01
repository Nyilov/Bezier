//TODO: Please refactor your code before u fuck up again

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

var width = 500;
var height = 500;
var scale = window.devicePixelRatio;

// This is done to fix blurry canvas graphics
canvas.style.width = width + "px";
canvas.style.height = height + "px";
canvas.width = Math.floor(width * window.devicePixelRatio);
canvas.height = Math.floor(height * window.devicePixelRatio);
ctx.scale(scale, scale);

var cursor = {
  x: undefined,
  y: undefined,
  clickLeft: undefined,
  clickRight: undefined,
  heldLeft: undefined,
  heldRight: undefined,
  heldX: undefined,
  heldY: undefined,
};

class Point {
  constructor(x, y, radius, colour, style) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.style = style;
    this.maxRadius = radius + 5;
    this.dragging = false;
    this.offsetCreated = false;
    this.offsetX;
    this.offsetY;
    this.selected;

    this.ogRadius = radius;
    this.ogColour = colour;
    this.ogStyle = style;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    if (this.style == "fill") {
      ctx.fillStyle = this.colour;
      ctx.fill();
    } else if (this.style == "stroke") {
      ctx.strokeStyle = this.colour;
      ctx.stroke();
    } else {
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.strokeStyle = this.colour;
      ctx.stroke();
    }
  }

  select() {
    let cursorDistance = Math.sqrt(Math.pow(cursor.heldX - this.x, 2) + Math.pow(cursor.heldY - this.y, 2));
    if (cursor.clickLeft && cursorDistance < this.radius) {
      if (!this.selected) {
        this.colour = "navy";
        this.style = "fill";
        this.selected = true;
      } else {
        this.colour = this.ogColour;
        this.style = this.ogStyle;
        this.selected = false;
      }
    }
  }

  // Tiny animation when cursor hovers over points
  hover() {
    let isCursorOnPoint = cursor.x - this.x < this.radius + 5 && cursor.x - this.x > -(this.radius + 5) && cursor.y - this.y < this.radius + 5 && cursor.y - this.y > -(this.radius + 5);

    if (isCursorOnPoint && this.radius < this.maxRadius) {
      this.radius++;
    } else if (isCursorOnPoint == false && this.radius > this.ogRadius) {
      this.radius--;
    }
  }

  // Hold and drag system
  drag() {
    let cursorDistance = Math.sqrt(Math.pow(cursor.heldX - this.x, 2) + Math.pow(cursor.heldY - this.y, 2));
    if (cursorDistance < this.radius) {
      this.dragging = true;
      if (!this.offsetCreated) {
        this.offsetX = cursor.x - this.x;
        this.offsetY = cursor.y - this.y;
        this.offsetCreated = true;
      }
    }

    if (this.dragging) {
      if (cursor.heldLeft && cursor.x < canvas.width && cursor.y < canvas.height && cursor.y > 0) {
        this.x = cursor.x - this.offsetX;
        this.y = cursor.y - this.offsetY;
      } else {
        this.dragging = false;
        this.offsetCreated = false;
      }
    }
  }

  remove() {
    points.splice(
      points.findIndex((point) => point == this),
      1
    );
    toChangeConnector = true;
  }

  update() {
    this.hover();
    this.select();
    this.drag();
    this.draw();
  }
}

// Lines that join two point objects
class Connector {
  constructor(p1, p2, colour, width) {
    this.p1 = p1;
    this.p2 = p2;
    this.colour = colour;
    this.width = width;
  }
  draw() {
    ctx.beginPath();
    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
    ctx.lineWidth = this.width;
    ctx.strokeStyle = this.colour;
    ctx.stroke();
  }
}

class LerpPoint {
  constructor(p1, p2, colour = "brown") {
    this.p1 = p1;
    this.p2 = p2;
    this.colour = colour;
    this.t = 0;
    this.x = undefined;
    this.y = undefined;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = this.colour;
    ctx.fill();
  }

  update() {
    let a = this.p1.x;
    let b = this.p2.x;
    this.x = a + this.t * (b - a);

    a = this.p1.y;
    b = this.p2.y;
    this.y = a + this.t * (b - a);

    if (this.t < 1) {
      this.t += 0.01;
    } else {
      playLerp = false;
    }
    this.draw();
  }
}

// This took an unfortunate amount of time to code... my eyes hurt
var interpolate = false;
var playLerp = false;
var foo = false;
function lerp() {
  if (interpolate) {
    lerpConnectors = [];
    lerpPoints = [];
    // The amount of distinct levels of which each subset of lerp points are drawn
    let level = points.length - 1;
    // The amount of lerp points per level
    let lerpPerLevel = points.length - 1;

    //Initialization of 2D array
    for (let i = 0; i < level; i++) {
      lerpPoints.push([]);
      lerpConnectors.push([]);
    }

    for (let i = 0; i < level; i++) {
      for (let j = 0; j < lerpPerLevel; j++) {
        if (lerpPerLevel == level) {
          lerpPoints[i].push(new LerpPoint(points[j], points[j + 1]));
        } else if (lerpPerLevel == 1) {
          lerpPoints[i].push(new LerpPoint(lerpPoints[i - 1][j], lerpPoints[i - 1][j + 1], "green"));
          foo = true;
        } else {
          lerpPoints[i].push(new LerpPoint(lerpPoints[i - 1][j], lerpPoints[i - 1][j + 1]));
        }

        if (lerpPoints[i].length >= 2) {
          lerpConnectors[i].push(new Connector(lerpPoints[i][j - 1], lerpPoints[i][j], "blue"));
        }
      }
      /* The total amount of lerp points can be calculated as a triangular sum,
               which is basically factorial with addition instead of multiplication
               This is why each level is one less from the previous one: eg. 4, 3, 2, 1
               math voodoo magic? */
      lerpPerLevel--;
    }
    playLerp = true;
    interpolate = false;
  }

  if (playLerp) {
    for (let i = 0; i < lerpPoints.length; i++) {
      for (let j = 0; j < lerpPoints[i].length; j++) {
        lerpPoints[i][j].update();
      }
    }

    for (let i = 0; i < lerpPoints.length - 1; i++) {
      for (let j = 0; j < lerpPoints[i].length - 1; j++) {
        lerpConnectors[i][j].draw();
      }
    }
  }
}

var drawBezier = false;
function bezier(colour) {
  if (drawBezier) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length == 4) {
      ctx.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    } else if (points.length == 3) {
      ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
    } else {
      ctx.lineTo(points[1].x, points[1].y);
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = colour;
    ctx.stroke();
    ctx.restore();
  }
}

function addPoint() {
  if (toAddPoint && points.length < 4) {
    points.push(new Point(Math.random() * width, Math.random() * height, 10, "black"));
    toAddPoint = false;

    if (points.length >= 2) {
      pointConnectors.push(new Connector(points[points.length - 2], points[points.length - 1], "red"));
    }
  }
}

function renewConnector() {
  if (toChangeConnector) {
    pointConnectors = [];
    for (let i = 0; i < points.length - 1; i++) {
      if (points.length >= 2) {
        pointConnectors.push(new Connector(points[i], points[i + 1], "red"));
      }
    }
    toChangeConnector = false;
  }
}

function findNumOfSelected(array) {
  let numOfSelected = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i].selected) numOfSelected++;
  }
  return numOfSelected;
}

function updateButtons() {
  if (points.length >= 4) {
    document.getElementById("addpoint").disabled = true;
  } else {
    document.getElementById("addpoint").disabled = false;
  }

  let numOfSelected = findNumOfSelected(points);

  if (numOfSelected > 0) {
    document.getElementById("removepoint").disabled = false;
  } else {
    document.getElementById("removepoint").disabled = true;
  }
}

var toChangeConnector = false;
var toAddPoint = false;
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  addPoint();
  renewConnector();

  pointConnectors.forEach((connector) => {
    connector.draw();
  });

  bezier("orange");
  lerp();

  points.forEach((point) => {
    point.draw();
    point.update();
  });

  updateButtons();

  cursor.clickLeft = false;
}

// Initialization of object arrays;
var points = [];
var pointConnectors = [];
var lerpPoints = [];
var lerpConnectors = [];

window.addEventListener("mousemove", (event) => {
  cursor.x = event.x;
  cursor.y = event.y;
});

window.addEventListener("mousedown", (event) => {
  if (event.buttons == 1) {
    cursor.heldLeft = true;
    cursor.heldX = event.x;
    cursor.heldY = event.y;
  } else if (event.buttons == 2) {
    cursor.heldRight = true;
    cursor.heldX = event.x;
    cursor.heldY = event.y;
  }
});

window.addEventListener("click", (event) => {
  cursor.clickLeft = true;
});

window.addEventListener("mouseup", () => {
  if (cursor.heldLeft) cursor.heldLeft = false;
  if (cursor.heldRight) cursor.heldRight = false;
});

document.getElementById("addpoint").addEventListener("click", () => {
  toAddPoint = true;
});

document.getElementById("removepoint").addEventListener("click", () => {
  playLerp = false;
  let numOfSelected = findNumOfSelected(points);

  for (let i = 0; i < numOfSelected; i++) {
    for (let j = 0; j < points.length; j++) {
      if (points[j].selected) points[j].remove();
    }
  }
});

document.getElementById("lerp").addEventListener("click", () => {
  interpolate = true;
});

document.getElementById("showbezier").addEventListener("click", () => {
  drawBezier ? (drawBezier = false) : (drawBezier = true);
});

animate();
