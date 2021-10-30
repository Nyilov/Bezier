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
    heldLeft: undefined,
    heldRight: undefined,
    heldX: undefined,
    heldY: undefined
}



// Just a regular old circle
class Point {
    constructor(x, y, radius, colour, style) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.colour = colour;
        this.style = style;
        this.maxRadius = radius + 5;
        this.ogRadius = radius;
        this.dragging = false;
        this.offsetCreated = false;
        this.offsetX;
        this.offsetY;
    };
    
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

    // Tiny animation when cursor hovers over points
    hover() {
        let isCursorOnPoint = cursor.x - this.x < (this.radius + 5) && cursor.x - this.x > -(this.radius + 5)
        && cursor.y - this.y < (this.radius + 5) && cursor.y - this.y > -(this.radius + 5);
        
        if (isCursorOnPoint == true && this.radius < this.maxRadius) {
            this.radius++;
        } else if (isCursorOnPoint == false && this.radius > this.ogRadius) {
            this.radius--;
        }
    }
    
    // Hold and drag system
    drag() {
        let cursorDistance = Math.sqrt(Math.pow(cursor.heldX - this.x, 2) + Math.pow(cursor.heldY - this.y, 2));
        if (cursor.heldLeft && cursorDistance < this.radius) {
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

    //TODO: implement this abomination
    remove() { 
        if (cursor.heldRight && cursorDistance < this.radius) {
            points.splice(this);
            numOfPoints--;
            points.sort();
        }
    }
    
    update() {
        this.hover();
        this.drag();
        this.draw();
    }
}

// Lines that joins two point objects
class Connector {
    constructor(p1, p2, colour) {
        this.p1 = p1;
        this.p2 = p2;
        this.colour = colour;
    }
    draw() {
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.strokeStyle = this.colour;
        ctx.stroke()
    }
    
}

class LerpPoint {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.t = 0;
        this.x = undefined;
        this.y = undefined;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "brown";
        ctx.fill();
    }
    
    update() {
        let a = this.p1.x;
        let b = this.p2.x;
        this.x = a + this.t * (b - a);
        
        a = this.p1.y;
        b = this.p2.y;
        this.y = a + this.t * (b - a)
        
        if (this.t < 1) {
            this.t += 0.01;
        } else {
            playLerp = false;
        }
        this.draw();
    }
}

// This took an unfortunate amount of time to code... my eyes hurt
var draw = false;
var playLerp = false;
function lerp() {
    if (draw) {
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
                    lerpPoints[i].push(
                        new LerpPoint(points[j], points[j + 1]));
                } else {
                    lerpPoints[i].push(
                        new LerpPoint(lerpPoints[i - 1][j], lerpPoints[i - 1][j + 1]));
                }

                if (lerpPoints[i].length >= 2) {
                    lerpConnectors[i].push(
                        new Connector(lerpPoints[i][j - 1], 
                            lerpPoints[i][j], "blue"))
                }
            }
            // The total amount of lerp points can be calculated as a triangular sum,
            // which is basically factorial with addition instead of multiplication
            // This is why each level is one less from the previous one: eg. 4, 3, 2, 1
            // math voodoo magic?
            lerpPerLevel--;
        }
        playLerp = true;
        draw = false;
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

var addPoint = false;
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    if (addPoint) {
        points.push(
            new Point(Math.random() * width, 
            Math.random() * height, 10, "black"));
        addPoint = false;

        if (points.length >= 2) {
            pointConnectors.push(new Connector(
                points[points.length - 2], points[points.length - 1], "red"));           
        }
    }
    
    lerp()
    
    for (let i = 0; i < points.length; i++) {
        points[i].draw();
        points[i].update();
    }
    
    if (points.length >= 2) {
        for (let i = 0; i < points.length - 1; i++) {
            pointConnectors[i].draw();
        }
    }

    
}

// Initialization of object arrays;
var points = [];
var pointConnectors = [];
var lerpPoints = [];
var lerpConnectors = [];

window.addEventListener("mousemove", (event) => {
    cursor.x = event.x;
    cursor.y = event.y;
})

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
})

window.addEventListener("mouseup", (event) => {
    if (cursor.heldLeft == true) {
        cursor.heldLeft = false;
    } else if ( cursor.heldRight == true) {
        cursor.heldRight = false;
    }
})

document.getElementById("addpoint").addEventListener("click", () => {
    addPoint = true;
})

document.getElementById("draw").addEventListener("click", () => {
    draw = true
})

animate();
