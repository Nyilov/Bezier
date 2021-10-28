// TODO: Right-click deleting and linear interpolation

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

var width = window.innerWidth;
var height = window.innerHeight;
var scale = window.devicePixelRatio;

window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
})

// This is done to fix blurry canvas graphics
canvas.style.width = width + "px";
canvas.style.height = height + "px";
canvas.width = Math.floor(width * window.devicePixelRatio);
canvas.height = Math.floor(height * window.devicePixelRatio);
ctx.scale(scale, scale);

var cursor = {
    x: undefined,
    y: undefined,
    held: undefined,
    heldX: undefined,
    heldY: undefined
}

window.addEventListener("mousemove", (event) => {
    cursor.x = event.x;
    cursor.y = event.y;
})

window.addEventListener("mousedown", (event) => {
    if (event.buttons == 1) {
        cursor.held = true;
        cursor.heldX = event.x;
        cursor.heldY = event.y;
    }
})

window.addEventListener("mouseup", (event) => {
    if (cursor.held == true) {
        cursor.held = false;
    }
})

// Just a regular old circle
class Point {
    constructor(x, y, radius, colour) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.colour = colour;
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
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = this.colour;
        ctx.stroke();
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
        if (cursor.held && cursorDistance < this.radius) {
            this.dragging = true;
            if (!this.offsetCreated) {
                this.offsetX = cursor.x - this.x;
                this.offsetY = cursor.y - this.y;
                this.offsetCreated = true;
            }
        }

        if (this.dragging) {
            if (cursor.held && cursor.x < canvas.width && cursor.y < canvas.height && cursor.y > 0) {
                this.x = cursor.x - this.offsetX;
                this.y = cursor.y - this.offsetY;
            } else {
                this.dragging = false;
                this.offsetCreated = false;
            }
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

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    
    alphaToBeta.draw();
    betaToGamma.draw();
    
    alpha.update();
    beta.update();
    gamma.update();
}

// Initialization of objects
var alpha = new Point(200, 300, 10, "#000000");
var beta = new Point(300, 200, 10, "#000000");
var gamma = new Point(300, 400, 10, "#000000");
var alphaToBeta = new Connector(alpha, beta, "red");
var betaToGamma = new Connector(beta, gamma, "red");

animate();


