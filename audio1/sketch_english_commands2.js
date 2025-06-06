// A demonstration of the ml5.soundClassifier using a pre-trained set
// of speech commands (SpeechCommands18w), including: the ten digits from "zero" to "nine", 
// "up", "down", "left", "right", "go", "stop", "yes", "no", as well as the 
// additional categories of "unknown word" and "background noise"."
//
// By Jon Froehlich
// http://makeabilitylab.io/
//
// See: 
//  - Official documentation: 
//      https://learn.ml5js.org/#/reference/sound-classifier
//  - Coding Train video: 
//      https://youtu.be/cO4UP2dX944

let soundClassifier;
let classificationResults;
let unicornImg;
let unicornX;
let unicornY;
let ballX;
let ballY;
let score = 0;
const GRID_SIZE = 50; // Match the movement distance

function preload(){
  // the default probabilityThreshold is 0
  let options = { probabilityThreshold: 0.8 };
  soundClassifier = ml5.soundClassifier('SpeechCommands18w', options);
  unicornImg = loadImage('unicorn.png');
}

function setup() {
  createCanvas(400, 400);
  soundClassifier.classify(onNewSoundClassified);
  noLoop();
  // Initialize unicorn position at center
  unicornX = width / 2;
  unicornY = height / 2;
  // Place initial ball
  placeBall();
}

function placeBall() {
  // Place ball at random grid position
  ballX = floor(random(width / GRID_SIZE)) * GRID_SIZE + GRID_SIZE/2;
  ballY = floor(random(height / GRID_SIZE)) * GRID_SIZE + GRID_SIZE/2;
}

function draw() {
  background(0);
  
  // Draw unicorn at current position
  imageMode(CENTER);
  // Draw unicorn at 1/3 of its original size
  image(unicornImg, unicornX, unicornY, unicornImg.width/3, unicornImg.height/3);
  
  // Draw target ball
  fill(255, 0, 0);
  noStroke();
  circle(ballX, ballY, 20);
  
  // Display the recognized command
  fill(0, 240, 0);
  if(classificationResults){
    textSize(32);
    textStyle(BOLD);
    let strWidth = textWidth(classificationResults[0].label);
    text(classificationResults[0].label, width / 2 - strWidth / 2, height - 50);
  }
  
  // Display frame count and frame rate
  fill(0, 240, 0);
  textSize(16);
  textAlign(LEFT);
  text('Frame Count: ' + frameCount, 10, height - 40);
  text('Frame Rate: ' + nf(frameRate(), 0, 2), 10, height - 20);
  
  // Display score
  textAlign(RIGHT);
  text('Score: ' + score, width - 10, height - 20);
}

function checkCollision() {
  const unicornWidth = unicornImg.width/3;
  const unicornHeight = unicornImg.height/3;
  const ballRadius = 10;
  
  // Check if unicorn and ball are close enough
  if (dist(unicornX, unicornY, ballX, ballY) < (unicornWidth/2 + ballRadius)) {
    score++;
    placeBall();
  }
}

function onNewSoundClassified(error, results){
  // Display error in the console
  if (error) {
    console.error(error);
  }

  classificationResults = results;
  
  // Update unicorn position based on voice command
  if (results && results[0].confidence > 0.8) {
    const command = results[0].label;
    const moveDistance = 50; // Move 50 pixels per command
    const unicornWidth = unicornImg.width/3;
    const unicornHeight = unicornImg.height/3;
    
    switch(command) {
      case 'up':
        unicornY = max(unicornHeight/2, unicornY - moveDistance);
        break;
      case 'down':
        unicornY = min(height - unicornHeight/2, unicornY + moveDistance);
        break;
      case 'left':
        unicornX = max(unicornWidth/2, unicornX - moveDistance);
        break;
      case 'right':
        unicornX = min(width - unicornWidth/2, unicornX + moveDistance);
        break;
    }
    
    // Check for collision after movement
    checkCollision();
  }
  
  redraw();
}