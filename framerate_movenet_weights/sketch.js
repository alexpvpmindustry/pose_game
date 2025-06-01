// ml5.js Real-Time Body Pose Detection with Keypoints and Framerate Control
// Enhanced version with full skeleton display and framerate monitoring
// Updated with video cropping to fit canvas

let video;
let bodyPose;
let poses = [];

// Canvas dimensions
let canvasWidth = 480;
let canvasHeight = 480;

// Framerate variables
let targetFramerate = 30; // Adjustable target framerate
let frameCount = 0;
let startTime = 0;
let calculatedFPS = 0;
let lastFPSUpdate = 0;

// Body connections for skeleton drawing
const bodyConnections = [
  // Head connections
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],

  // Torso connections
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],//this
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],//this
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],//this
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],

  // Leg connections
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle']
];

function preload() {
  // Initialize MoveNet model with flipped video input
  bodyPose = ml5.bodyPose("MoveNet", { flipped: true });
}

function mousePressed() {
  // Log detected pose data to the console when the mouse is pressed
  console.log(poses);
}

function keyPressed() {
  // Adjust framerate with arrow keys
  if (keyCode === UP_ARROW) {
    targetFramerate = min(60, targetFramerate + 5);
    frameRate(targetFramerate);
    console.log(`Target framerate: ${targetFramerate} FPS`);
  } else if (keyCode === DOWN_ARROW) {
    targetFramerate = max(5, targetFramerate - 5);
    frameRate(targetFramerate);
    console.log(`Target framerate: ${targetFramerate} FPS`);
  }
}

function gotPoses(results) {
  // Store detected poses in the global array
  poses = results;
}
function setup() {
  // Create canvas for displaying video feed
  createCanvas(canvasWidth, canvasHeight);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  // Set initial framerate
  frameRate(targetFramerate);
  // Start detecting poses from the video feed
  bodyPose.detectStart(video, gotPoses);
  // Initialize framerate calculation
  startTime = millis();
}

function calculateFramerate() {
  frameCount++;

  // Calculate FPS every 15 frames
  if (frameCount >= 15) {
    let currentTime = millis();
    let elapsedTime = currentTime - startTime;
    calculatedFPS = (15 / elapsedTime) * 1000; // Convert to FPS

    // Reset for next calculation
    frameCount = 0;
    startTime = currentTime;
    lastFPSUpdate = currentTime;
  }
}

function drawSkeleton(pose) {
  // Draw skeleton connections
  stroke(255, 255, 255, 200);
  strokeWeight(3);
  for (let connection of bodyConnections) {
    let pointA = pose[connection[0]];
    let pointB = pose[connection[1]];
    // Only draw connection if both points have sufficient confidence
    if (pointA && pointB && pointA.confidence > 0.1 && pointB.confidence > 0.1) {
      line(pointA.x, pointA.y, pointB.x, pointB.y);
    }
  }
}

function drawKeypoints(pose) {
  // Define colors for different body parts
  const keypointColors = {
    // Head
    nose: [255, 100, 100],
    left_eye: [100, 255, 100],
    right_eye: [100, 255, 100],
    left_ear: [100, 100, 255],
    right_ear: [100, 100, 255],

    // Arms
    left_shoulder: [255, 255, 100],
    right_shoulder: [255, 255, 100],
    left_elbow: [255, 150, 100],
    right_elbow: [255, 150, 100],
    left_wrist: [255, 100, 255],
    right_wrist: [255, 100, 255],

    // Torso
    left_hip: [100, 255, 255],
    right_hip: [100, 255, 255],

    // Legs
    left_knee: [150, 255, 150],
    right_knee: [150, 255, 150],
    left_ankle: [255, 200, 150],
    right_ankle: [255, 200, 150]
  };

  noStroke();

  // Draw keypoints for all body parts
  for (let [keypoint, color] of Object.entries(keypointColors)) {
    if (pose[keypoint] && pose[keypoint].confidence > 0.1) {
      fill(color[0], color[1], color[2], 200);

      // Vary circle size based on keypoint type
      let size = 12;
      if (keypoint === 'nose') size = 20;
      else if (keypoint.includes('shoulder') || keypoint.includes('hip')) size = 16;
      else if (keypoint.includes('eye') || keypoint.includes('ear')) size = 8;
      circle(pose[keypoint].x, pose[keypoint].y, size);
    }
  }
}

function displayFramerateInfo() {
  // Display framerate information
  fill(255, 255, 255, 200);
  noStroke();
  rect(10, 10, 200, 60);

  fill(0);
  textAlign(LEFT);
  textSize(12);
  text(`Target FPS: ${targetFramerate}`, 15, 25);
  text(`Actual FPS: ${calculatedFPS.toFixed(1)}`, 15, 40);
  text(`Use ↑↓ arrows to adjust`, 15, 55);
}

function draw() {
  // Calculate framerate
  calculateFramerate();
  push();
  image(video,9,9);// 0, 0, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
  pop();

  // Ensure at least one pose is detected before proceeding
  if (poses.length > 0) {
    let pose = poses[0];

    // Draw full skeleton
    drawSkeleton(pose);

    // Draw all keypoints
    drawKeypoints(pose);
  }

  // Display framerate information
  displayFramerateInfo();
}