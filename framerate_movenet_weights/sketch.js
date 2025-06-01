// ml5.js Real-Time Body Pose Detection with Angle Measurement and Rep Counting
// Enhanced version with angle display and dumbbell shoulder raise repetition counting

let video;
let bodyPose;
let poses = [];

// Canvas dimensions
let canvasWidth = 320;
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
let leftArmState = 'down'; // 'down', 'up'
let rightArmState = 'down';
let leftArmAngleHistory = [];
let rightArmAngleHistory = [];
let smoothingFrames = 5; // Number of frames to average for smoothing

// Status tracking for visual indicators
let leftArmStatus = 'raise'; // 'raise', 'lower'
let rightArmStatus = 'raise';
let statusChangeTime = 0; // For flashing effect
let showCelebration = false;
let celebrationTime = 0;

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
    leftArmStatus = 'raise';
    rightArmStatus = 'raise';
    showCelebration = false;
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
  
  // Left arm rep counting and status updates
  if (leftArmState === 'down' && smoothedLeftAngle > RAISE_THRESHOLD) {
    leftArmState = 'up';
    leftArmReps++;
    leftArmStatus = 'lower';
    statusChangeTime = millis();
    showCelebration = true;
    celebrationTime = millis();
  } else if (leftArmState === 'up' && smoothedLeftAngle < LOWER_THRESHOLD) {
    leftArmState = 'down';
    leftArmStatus = 'raise';
    statusChangeTime = millis();
  } else if (leftArmState === 'down' && smoothedLeftAngle > LOWER_THRESHOLD && smoothedLeftAngle < RAISE_THRESHOLD) {
    leftArmStatus = 'raise';
  } else if (leftArmState === 'up' && smoothedLeftAngle < RAISE_THRESHOLD && smoothedLeftAngle > LOWER_THRESHOLD) {
    leftArmStatus = 'lower';
  }
  
  // Right arm rep counting and status updates
  if (rightArmState === 'down' && smoothedRightAngle > RAISE_THRESHOLD) {
    rightArmState = 'up';
    rightArmReps++;
    rightArmStatus = 'lower';
    statusChangeTime = millis();
    showCelebration = true;
    celebrationTime = millis();
  } else if (rightArmState === 'up' && smoothedRightAngle < LOWER_THRESHOLD) {
    rightArmState = 'down';
    rightArmStatus = 'raise';
    statusChangeTime = millis();
  } else if (rightArmState === 'down' && smoothedRightAngle > LOWER_THRESHOLD && smoothedRightAngle < RAISE_THRESHOLD) {
    rightArmStatus = 'raise';
  } else if (rightArmState === 'up' && smoothedRightAngle < RAISE_THRESHOLD && smoothedRightAngle > LOWER_THRESHOLD) {
    rightArmStatus = 'lower';
  }
}

function drawStatusIndicators(pose) {
  // Check if required points are available
  if (!pose.left_shoulder || !pose.right_shoulder || 
      pose.left_shoulder.confidence < 0.3 || pose.right_shoulder.confidence < 0.3) {
    return;
  }
  
  let currentTime = millis();
  
  // Draw left arm status indicator
  drawArmStatusIndicator(pose.left_shoulder, leftArmStatus, 'LEFT', currentTime);
  
  // Draw right arm status indicator  
  drawArmStatusIndicator(pose.right_shoulder, rightArmStatus, 'RIGHT', currentTime);
  
  // Draw celebration effect when rep is completed
  if (showCelebration && currentTime - celebrationTime < 1000) {
    drawCelebrationEffect(currentTime);
  } else if (currentTime - celebrationTime >= 1000) {
    showCelebration = false;
  }
}

function drawArmStatusIndicator(shoulderPoint, status, side, currentTime) {
  let x = shoulderPoint.x;
  let y = shoulderPoint.y;
  
  // Offset for left vs right side
  let offsetX = side === 'LEFT' ? -60 : 60;
  
  // Flash effect for status changes
  let flashIntensity = 1;
  if (currentTime - statusChangeTime < 500) {
    flashIntensity = 0.5 + 0.5 * sin((currentTime - statusChangeTime) * 0.02);
  }
  
  // Draw status background
  fill(0, 0, 0, 150 * flashIntensity);
  noStroke();
  rect(x + offsetX - 25, y - 40, 50, 30, 5);
  
  // Draw status text and arrow
  textAlign(CENTER);
  textSize(12);
  
  if (status === 'raise') {
    // Draw upward arrow and "RAISE" text
    fill(0, 255, 0, 255 * flashIntensity); // Green
    text('RAISE', x + offsetX, y - 22);
    
    // Draw upward arrow
    stroke(0, 255, 0, 255 * flashIntensity);
    strokeWeight(3);
    // Arrow shaft
    line(x + offsetX, y - 15, x + offsetX, y - 5);
    // Arrow head
    line(x + offsetX, y - 15, x + offsetX - 5, y - 10);
    line(x + offsetX, y - 15, x + offsetX + 5, y - 10);
    
  } else if (status === 'lower') {
    // Draw downward arrow and "LOWER" text
    fill(255, 165, 0, 255 * flashIntensity); // Orange
    text('LOWER', x + offsetX, y - 22);
    
    // Draw downward arrow
    stroke(255, 165, 0, 255 * flashIntensity);
    strokeWeight(3);
    // Arrow shaft
    line(x + offsetX, y - 15, x + offsetX, y - 5);
    // Arrow head
    line(x + offsetX, y - 5, x + offsetX - 5, y - 10);
    line(x + offsetX, y - 5, x + offsetX + 5, y - 10);
  }
  
  noStroke();
}

function drawCelebrationEffect(currentTime) {
  // Pulsing celebration text
  let pulseScale = 1 + 0.3 * sin((currentTime - celebrationTime) * 0.02);
  
  // Semi-transparent overlay
  fill(255, 255, 0, 50);
  rect(0, 0, canvasWidth, canvasHeight);
  
  // Celebration text
  push();
  translate(canvasWidth / 2, canvasHeight / 2);
  scale(pulseScale);
  textAlign(CENTER);
  textSize(36);
  fill(255, 215, 0); // Gold
  stroke(255, 140, 0);
  strokeWeight(2);
  text('REP COMPLETED!', 0, 0);
  
  textSize(18);
  fill(255, 255, 255);
  noStroke();
  text('Keep going!', 0, 30);
  pop();
  
  // Sparkle effects
  for (let i = 0; i < 8; i++) {
    let angle = (currentTime - celebrationTime) * 0.01 + i * PI / 4;
    let radius = 100 + 20 * sin((currentTime - celebrationTime) * 0.03);
    let sparkleX = canvasWidth / 2 + cos(angle) * radius;
    let sparkleY = canvasHeight / 2 + sin(angle) * radius;
    
    fill(255, 255, 0, 200);
    noStroke();
    circle(sparkleX, sparkleY, 8);
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
  // Display repetition counter with enhanced styling
  fill(255, 255, 255, 220);
  noStroke();
  rect(canvasWidth - 160, 10, 150, 100, 5);

  fill(0);
  textAlign(LEFT);
  textSize(16);
  text(`Shoulder Raises`, canvasWidth - 155, 30);
  
  // Enhanced rep display with status colors
  textSize(14);
  
  // Left arm with status color
  if (leftArmStatus === 'raise') fill(0, 180, 0);
  else if (leftArmStatus === 'lower') fill(255, 140, 0);
  else fill(0);
  text(`Left: ${leftArmReps}`, canvasWidth - 155, 50);
  
  // Right arm with status color
  if (rightArmStatus === 'raise') fill(0, 180, 0);
  else if (rightArmStatus === 'lower') fill(255, 140, 0);
  else fill(0);
  text(`Right: ${rightArmReps}`, canvasWidth - 155, 70);
  
  // Instructions
  fill(0);
  textSize(10);
  text(`Press 'R' to reset`, canvasWidth - 155, 90);
  text(`Follow the arrows!`, canvasWidth - 155, 102);
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
    
    // Draw status indicators and arrows
    drawStatusIndicators(pose);
  }

  // Display framerate information
  displayFramerateInfo();
  
  // Display repetition counter
  displayRepCounter();
}