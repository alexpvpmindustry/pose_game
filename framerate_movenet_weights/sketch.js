// ml5.js Real-Time Body Pose Detection with Angle Measurement and Rep Counting
// Enhanced version with angle display and dumbbell shoulder raise repetition counting

let video;
let bodyPose;
let poses = [];

// Canvas dimensions
let canvasWidth = 480;
let canvasHeight = 480;

// Framerate variables
let targetFramerate = 30;
let frameCount = 0;
let startTime = 0;
let calculatedFPS = 0;
let lastFPSUpdate = 0;

// Repetition counting variables
let leftArmReps = 0;
let rightArmReps = 0;
let leftArmState = 'down'; // 'down' or 'up'
let rightArmState = 'down';
let leftArmAngleHistory = [];
let rightArmAngleHistory = [];
let smoothingFrames = 5; // Number of frames to average for smoothing

// Thresholds for shoulder raise detection
const RAISE_THRESHOLD = 120; // Angle threshold for "raised" position
const LOWER_THRESHOLD = 90;  // Angle threshold for "lowered" position

// Body connections for skeleton drawing
const bodyConnections = [
  // Head connections
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],

  // Torso connections
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
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
  } else if (key === 'r' || key === 'R') {
    // Reset rep counters
    leftArmReps = 0;
    rightArmReps = 0;
    leftArmState = 'down';
    rightArmState = 'down';
    leftArmAngleHistory = [];
    rightArmAngleHistory = [];
    console.log('Rep counters reset');
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

function calculateAngle(point1, point2, point3) {
  // Calculate angle between three points (point2 is the vertex)
  let angle1 = atan2(point1.y - point2.y, point1.x - point2.x);
  let angle2 = atan2(point3.y - point2.y, point3.x - point2.x);
  
  let angle = abs(angle1 - angle2);
  if (angle > PI) {
    angle = 2 * PI - angle; 
  }
  
  return degrees(angle);
}

function getMidpoint(point1, point2) {
  // Calculate midpoint between two points
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2
  };
}

function smoothAngle(angleHistory, newAngle) {
  // Add new angle to history
  angleHistory.push(newAngle);
  
  // Keep only recent frames
  if (angleHistory.length > smoothingFrames) {
    angleHistory.shift();
  }
  
  // Calculate average
  let sum = angleHistory.reduce((a, b) => a + b, 0);
  return sum / angleHistory.length;
}

function updateRepCounting(leftShoulderAngle, rightShoulderAngle) {
  // Smooth the angles
  let smoothedLeftAngle = smoothAngle(leftArmAngleHistory, leftShoulderAngle);
  let smoothedRightAngle = smoothAngle(rightArmAngleHistory, rightShoulderAngle);
  
  // Left arm rep counting
  if (leftArmState === 'down' && smoothedLeftAngle > RAISE_THRESHOLD) {
    leftArmState = 'up';
  } else if (leftArmState === 'up' && smoothedLeftAngle < LOWER_THRESHOLD) {
    leftArmState = 'down';
    leftArmReps++;
  }
  
  // Right arm rep counting
  if (rightArmState === 'down' && smoothedRightAngle > RAISE_THRESHOLD) {
    rightArmState = 'up';
  } else if (rightArmState === 'up' && smoothedRightAngle < LOWER_THRESHOLD) {
    rightArmState = 'down';
    rightArmReps++;
  }
}

function drawAngles(pose) {
  // Check if all required keypoints are available with sufficient confidence
  const requiredPoints = ['left_hip', 'left_shoulder', 'left_elbow', 'left_wrist', 
                         'right_hip', 'right_shoulder', 'right_elbow', 'right_wrist'];
  
  let allPointsValid = true;
  for (let pointName of requiredPoints) {
    if (!pose[pointName] || pose[pointName].confidence < 0.1) {
      allPointsValid = false;
      break;
    }
  }
  
  if (!allPointsValid) return;
  
  // Calculate angles
  let leftHipShoulderElbow = calculateAngle(pose.left_hip, pose.left_shoulder, pose.left_elbow);
  let leftShoulderElbowWrist = calculateAngle(pose.left_shoulder, pose.left_elbow, pose.left_wrist);
  let rightHipShoulderElbow = calculateAngle(pose.right_hip, pose.right_shoulder, pose.right_elbow);
  let rightShoulderElbowWrist = calculateAngle(pose.right_shoulder, pose.right_elbow, pose.right_wrist);
  
  // Update repetition counting (using shoulder angles for shoulder raises)
  updateRepCounting(leftHipShoulderElbow, rightHipShoulderElbow);
  
  // Calculate midpoints for angle display
  let leftShoulderMid = getMidpoint(pose.left_hip, pose.left_elbow);
  let leftElbowMid = getMidpoint(pose.left_shoulder, pose.left_wrist);
  let rightShoulderMid = getMidpoint(pose.right_hip, pose.right_elbow);
  let rightElbowMid = getMidpoint(pose.right_shoulder, pose.right_wrist);
  
  // Display angles with background boxes for better visibility
  textAlign(CENTER);
  textSize(14);
  
  // Left hip-shoulder-elbow angle
  fill(0, 0, 0, 150);
  rect(leftShoulderMid.x - 25, leftShoulderMid.y - 12, 50, 24);
  fill(255, 255, 0);
  text(Math.round(leftHipShoulderElbow) + "°", leftShoulderMid.x, leftShoulderMid.y + 4);
  
  // Left shoulder-elbow-wrist angle
  fill(0, 0, 0, 150);
  rect(leftElbowMid.x - 25, leftElbowMid.y - 12, 50, 24);
  fill(255, 100, 255);
  text(Math.round(leftShoulderElbowWrist) + "°", leftElbowMid.x, leftElbowMid.y + 4);
  
  // Right hip-shoulder-elbow angle
  fill(0, 0, 0, 150);
  rect(rightShoulderMid.x - 25, rightShoulderMid.y - 12, 50, 24);
  fill(255, 255, 0);
  text(Math.round(rightHipShoulderElbow) + "°", rightShoulderMid.x, rightShoulderMid.y + 4);
  
  // Right shoulder-elbow-wrist angle
  fill(0, 0, 0, 150);
  rect(rightElbowMid.x - 25, rightElbowMid.y - 12, 50, 24);
  fill(255, 100, 255);
  text(Math.round(rightShoulderElbowWrist) + "°", rightElbowMid.x, rightElbowMid.y + 4);
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

function displayRepCounter() {
  // Display repetition counter
  fill(255, 255, 255, 220);
  noStroke();
  rect(canvasWidth - 160, 10, 150, 80);

  fill(0);
  textAlign(LEFT);
  textSize(14);
  text(`Shoulder Raises`, canvasWidth - 155, 28);
  text(`Left Arm: ${leftArmReps}`, canvasWidth - 155, 45);
  text(`Right Arm: ${rightArmReps}`, canvasWidth - 155, 62);
  textSize(10);
  text(`Press 'R' to reset`, canvasWidth - 155, 78);
}

function draw() {
  // Calculate framerate
  calculateFramerate();
  image(video, 0, 0, canvasWidth, canvasHeight);
  
  // Ensure at least one pose is detected before proceeding
  if (poses.length > 0) {
    let pose = poses[0];

    // Draw full skeleton
    drawSkeleton(pose);

    // Draw all keypoints
    drawKeypoints(pose);
    
    // Draw angles at midpoints
    drawAngles(pose);
  }

  // Display framerate information
  displayFramerateInfo();
  
  // Display repetition counter
  displayRepCounter();
}