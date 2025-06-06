// Sound classification and text animation demo

let recognition;
let textAnimations = []; // Array to store text animations

function preload() { 
}

function setup() {
  createCanvas(800, 450); 
  
  // Initialize speech recognition
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
  
  // Set up event handlers
  recognition.onresult = handleResult;
  recognition.onerror = handleError;
  
  // Start listening
  recognition.start();
}

function handleResult(event) {
  // Process all results
  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;
    
    if (result.isFinal) {
      // Create text animation object for each final result with random position
      textAnimations.push({
        text: `${transcript} (${confidence.toFixed(4)})`,
        x: random(100, width - 100), // Random x position with padding
        y: random(100, height - 100), // Random y position with padding
        alpha: 255,
        frames: 0
      });
    }
  }
}

function handleError(event) {
  console.error('Speech recognition error:', event.error);
}

function draw() {
  background(0);
  textSize(24);
  textAlign(CENTER);
  fill(255);
  text("Speak into your microphone - Your words will appear here", width/2, height - 30);

  // Draw and update text animations
  for (let i = textAnimations.length - 1; i >= 0; i--) {
    let anim = textAnimations[i];
    textSize(30);
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
