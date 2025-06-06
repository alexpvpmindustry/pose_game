// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/147-chrome-dinosaur.html
// https://youtu.be/l0HoJHc-63Q

// Google Chrome Dinosaur Game (Unicorn, run!)
// https://editor.p5js.org/codingtrain/sketches/v3thq2uhk

let unicorn;
let uImg;
let tImg;
let bImg;
let trains = [];
let soundClassifier;
let textAnimations = []; // Array to store text animations

function preload() {
  const options = {
    probabilityThreshold: 0.95,
  };
  soundClassifier = ml5.soundClassifier("SpeechCommands18w", options);
  uImg = loadImage("unicorn.png");
  tImg = loadImage("train.png");
  bImg = loadImage("background.jpg");
}

function mousePressed() {
  trains.push(new Train());
}

function setup() {
  createCanvas(800, 450);
  unicorn = new Unicorn();
  soundClassifier.classify(gotCommand);
}

function gotCommand(error, results) {
  if (error) {
    console.error(error);
  }
  console.log(results[0].label, results[0].confidence);
  if (results[0].label == "up") {
    unicorn.jump();
  }
  
  // Create text animation object
  textAnimations.push({
    text: results[0].label,
    x: width/2,
    y: height/2,
    alpha: 255,
    frames: 0
  });
}

function keyPressed() {
  if (key == " ") {
    unicorn.jump();
  }
}

function draw() {
  if (random(1) < 0.004) {
    trains.push(new Train());
  }

  background(bImg);
  for (let t of trains) {
    t.move();
    t.show();
    if (unicorn.hits(t)) {
      console.log("game over");
      noLoop();
    }
  }

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

  unicorn.show();
  unicorn.move();
}
