// Catch-the-balls game with BlazePose (ml5) + p5.js  — single-file JS

let video, poseNet, poses = [];
const BALL_INTERVAL = 60;          // frames between new balls
const BALL_SPEED    = 4;
const BALL_SIZE     = 24;
const CATCH_RADIUS  = 30;
let framesSinceLast = 0;
let balls = [];
let score = 0;
let width = 320;
let height = 240;

// ---------- POSE SETUP ----------
function preload() {
  poseNet = ml5.bodyPose('blazepose');
}

function gotPoses(results) {
  poses = results;
}

// ---------- P5 SETUP ----------
function setup() {
  //createCanvas(640, 480);
  createCanvas(320, 240, WEBGL);


  video = createCapture(VIDEO);
  video.size(width, height);
  //video.hide();

//   poseNet.on('pose', gotPoses);
//   poseNet.detect(video);

poseNet.detectStart(video, gotPoses);
  connections = poseNet.getSkeleton();
}

// ---------- BALL CLASS ----------
class Ball {
  constructor() {
    this.x = random(BALL_SIZE / 2, width - BALL_SIZE / 2);
    this.y = -BALL_SIZE;
    this.r = BALL_SIZE / 2;
    this.speed = BALL_SPEED;
  }
  update() { this.y += this.speed; }
  draw() { fill(255, 204, 0); noStroke(); circle(this.x, this.y, BALL_SIZE); }
  offScreen() { return this.y - this.r > height; }
}

// ---------- UTILS ----------
function angle3pt(a, b, c) { // return degrees at point b
  const ab = createVector(a.x - b.x, a.y - b.y);
  const cb = createVector(c.x - b.x, c.y - b.y);
  return degrees(ab.angleBetween(cb));
}

function drawKeypoint(pt) {
  fill(0, 255, 255, 150); noStroke();
  circle(pt.x, pt.y, CATCH_RADIUS * 2);
}

// ---------- MAIN DRAW LOOP ----------
function draw() {
  // 1) background: translucent user video
  tint(255, 120);
  image(video, 0, 0, width, height);
  noTint();
}


//   // 2) update & spawn balls
//   framesSinceLast++;
//   if (framesSinceLast >= BALL_INTERVAL) {
//     balls.push(new Ball());
//     framesSinceLast = 0;
//   }
//   for (let i = balls.length - 1; i >= 0; i--) {
//     const b = balls[i];
//     b.update();
//     b.draw();
//     if (b.offScreen()) balls.splice(i, 1);
//   }

//   // 3) pose: get wrist positions & arm angles
//   if (poses.length) {
//     const kp = poses[0].pose.keypoints;         // 2-D keypoints
//     const lSh  = kp[11], rSh  = kp[12];         // shoulders
//     const lEl  = kp[13], rEl  = kp[14];         // elbows
//     const lWr  = kp[15], rWr  = kp[16];         // wrists

//     const leftReady  = lWr.score > 0.5;
//     const rightReady = rWr.score > 0.5;

//     if (leftReady)  drawKeypoint(lWr);
//     if (rightReady) drawKeypoint(rWr);

//     // show angles (optional)
//     if (leftReady) {
//       const a = angle3pt(lSh.position, lEl.position, lWr.position);
//       fill(255); textSize(14); text(nf(a,1,0)+'°', lEl.position.x+8, lEl.position.y);
//     }
//     if (rightReady) {
//       const a = angle3pt(rSh.position, rEl.position, rWr.position);
//       fill(255); textSize(14); text(nf(a,1,0)+'°', rEl.position.x+8, rEl.position.y);
//     }

//     // 4) collision check
//     for (let i = balls.length - 1; i >= 0; i--) {
//       const b = balls[i];
//       if (leftReady  && dist(b.x, b.y, lWr.position.x, lWr.position.y) < CATCH_RADIUS + b.r ||
//           rightReady && dist(b.x, b.y, rWr.position.x, rWr.position.y) < CATCH_RADIUS + b.r) {
//         balls.splice(i, 1);
//         score++;
//       }
//     }
//   }

//   // 5) HUD: score
//   fill(255); textSize(24); text('Score: ' + score, 10, 30);
// }
