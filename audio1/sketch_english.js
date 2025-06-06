// Sound classification and text animation demo

let soundClassifier;
let textAnimations = []; // Array to store text animations

function preload() {
  const options = {
    probabilityThreshold: 0.95,
  };
  soundClassifier = ml5.soundClassifier("SpeechCommands18w", options);
}

function setup() {
  createCanvas(800, 450);
  soundClassifier.classify(gotCommand);
}

function gotCommand(error, results) {
  if (error) {
    console.error(error);
  }
  console.log(results[0].label, results[0].confidence);
  
  // Create text animation object
  textAnimations.push({
    text: results[0].label + ' (' + results[0].confidence.toFixed(4) + ')',
    x: width/2,
    y: height/2,
    alpha: 255,
    frames: 0
  });
}

function draw() {
  background(0);

  // Draw and update text animations
  for (let i = textAnimations.length - 1; i >= 0; i--) {
    let anim = textAnimations[i];
    textSize(60);
    textAlign(CENTER);
    fill(255, anim.alpha);
    text(anim.text, anim.x, anim.y);
    
    // Update animation properties
    anim.alpha -= 5; // Fade out
    anim.y -= 1; // Move up
    anim.frames++;
    
    // Remove animation if it's faded out or been around too long
    if (anim.alpha <= 0 || anim.frames > 60) {
      textAnimations.splice(i, 1);
    }
  }
}
