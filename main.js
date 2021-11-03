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
ctx.globalCompositeOperation = "destination-over";

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
    constructor(x, y, radius, colour, style = "mix") {
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
        this.selected = false;

        this.ogRadius = radius;
        this.ogColour = colour;
        this.ogStyle = style;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        if (this.style == "fill") {
            ctx.fillStyle = this.colour;
            ctx.fill();
        } else if (this.style == "stroke") {
            ctx.strokeStyle = this.colour;
            ctx.stroke();
        } else if (this.style == "mix") {
            ctx.fillStyle = this.colour;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.stroke();
        }
        ctx.restore();
    }

    select() {
        let cursorDistance = Math.sqrt(Math.pow(cursor.heldX - this.x, 2) + Math.pow(cursor.heldY - this.y, 2));
        if (cursor.clickLeft && cursorDistance < this.radius) {
            if (!this.selected) {
                this.colour = "orange";
                this.style = "mix";
                this.selected = true;
            } else {
                this.colour = this.ogColour;
                this.style = this.ogStyle;
                this.selected = false;
            }

            updateButtons();
        }
    }

    // Tiny animation when cursor hovers over points
    hover() {
        let isCursorOnPoint = cursor.x - this.x < this.radius + 2 && cursor.x - this.x > -(this.radius + 2) && cursor.y - this.y < this.radius + 2 && cursor.y - this.y > -(this.radius + 2);

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
        renewConnector();
        updateButtons();
        displayLerp = false;
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
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineCap = "round";
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.colour;
        ctx.stroke();
        ctx.restore();
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
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = this.colour;
        ctx.fill();
        ctx.restore();
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
        }
        this.draw();
    }
}

// function playLerp() {
//     if (!doLerp) return;
//     requestAnimationFrame(playLerp);
//     for (let i = 0; i < lerpPoints.length; i++) {
//         for (let j = 0; j < lerpPoints[i].length; j++) {
//             lerpPoints[i][j].update();
//         }
//     }

//     for (let i = 0; i < lerpPoints.length - 1; i++) {
//         for (let j = 0; j < lerpPoints[i].length - 1; j++) {
//             lerpConnectors[i][j].draw();
//         }
//     }
//     if (Math.trunc(lerpPoints[0][0].t) == 1) {
//         lerp();
//     }
// }

var displayLerp = false;
function playLerp() {
    if (!displayLerp) return;
    requestAnimationFrame(playLerp);
    lerp();
}

var doLerp = false;
var setupLerp = false;
function lerp() {
    if (setupLerp) {
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
                    lerpPoints[i].push(new LerpPoint(lerpPoints[i - 1][j], lerpPoints[i - 1][j + 1], "orange"));
                } else {
                    lerpPoints[i].push(new LerpPoint(lerpPoints[i - 1][j], lerpPoints[i - 1][j + 1]));
                }

                if (lerpPoints[i].length >= 2) {
                    lerpConnectors[i].push(new Connector(lerpPoints[i][j - 1], lerpPoints[i][j], "blue"));
                }
            }
            /* The total amount of lerp points can be calculated as a triangular sum,
        This is why each level is one less from the previous one: eg. 4, 3, 2, 1
        which is basically factorial with addition instead of multiplication
        math voodoo magic? */

            lerpPerLevel--;
        }
        doLerp = true;
        setupLerp = false;
    }

    // playLerp();
    if (doLerp) {
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

        if (Math.trunc(lerpPoints[0][0].t) == 1) {
            points.reverse();
            setupLerp = true;
        }
    }
}

var showBezier = false;
function bezier() {
    if (!showBezier || points.length < 2) return;
    requestAnimationFrame(bezier);
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
    ctx.lineCap = "round";
    ctx.strokeStyle = "orange";
    ctx.stroke();
    ctx.restore();
}

function addPoint() {
    displayLerp = false;
    if (points.length < 4) {
        points.push(new Point(Math.random() * width, Math.random() * height, 10, "white"));

        if (points.length >= 2) {
            pointConnectors.push(new Connector(points[points.length - 2], points[points.length - 1], "red"));
        }
    }
}

function renewConnector() {
    pointConnectors = [];
    for (let i = 0; i < points.length - 1; i++) {
        if (points.length >= 2) {
            pointConnectors.push(new Connector(points[i], points[i + 1], "red"));
        }
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
    if (points.length <= 1) {
        document.getElementById("lerp").disabled = true;
        document.getElementById("showbezier").disabled = true;
    } else {
        document.getElementById("lerp").disabled = false;
        document.getElementById("showbezier").disabled = false;
    }

    if (points.length >= 4) {
        document.getElementById("addpoint").disabled = true;
    } else {
        document.getElementById("addpoint").disabled = false;
    }

    if (findNumOfSelected(points) > 0) {
        document.getElementById("removepoint").disabled = false;
    } else {
        document.getElementById("removepoint").disabled = true;
    }
}

function animatePoints() {
    requestAnimationFrame(animatePoints);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    points.forEach((point) => {
        point.draw();
        point.update();
    });

    pointConnectors.forEach((connector) => {
        connector.draw();
    });

    cursor.clickLeft = false;
}

// var toChangeConnector = false;
// var toAddPoint = false;
// function animate() {
//     requestAnimationFrame(animate);
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.beginPath();

//     addPoint();
//     renewConnector();

//     pointConnectors.forEach((connector) => {
//         connector.draw();
//     });

//     bezier("orange");
//     lerp();

//     points.forEach((point) => {
//         point.draw();
//         point.update();
//     });

//     updateButtons();

//     cursor.clickLeft = false;
// }

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
    cursor.heldLeft = !cursor.heldLeft;
    cursor.heldRight = !cursor.heldRight;
});

document.querySelectorAll(".configbuttons").forEach((button) => {
    button.addEventListener("click", () => {
        updateButtons();
    });
});

document.getElementById("addpoint").addEventListener("click", () => {
    addPoint();
});

document.getElementById("removepoint").addEventListener("click", () => {
    pointsSelected = findNumOfSelected(points);
    for (let i = 0; i < pointsSelected; i++) {
        for (let j = 0; j < points.length; j++) {
            if (points[j].selected) {
                points[j].remove();
            }
        }
    }
});

document.getElementById("lerp").addEventListener("click", () => {
    if (displayLerp) {
        displayLerp = false;
        setupLerp = false;
    } else {
        displayLerp = true;
        setupLerp = true;
    }
    playLerp();
});

document.getElementById("showbezier").addEventListener("click", () => {
    showBezier = !showBezier;
    bezier("orange");
});

updateButtons();
animatePoints();
