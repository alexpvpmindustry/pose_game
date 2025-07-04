let gridSize = 8;
let cellSize = 80;
let blocks = [];
let draggingBlock = null;
let offsetX, offsetY;
let currentSeed;

let restartBtn, newLevelBtn;

function setup() {
  createCanvas(gridSize * cellSize, gridSize * cellSize + 50);
  setupButtons();
  generateLevel();
}

function setupButtons() {
  restartBtn = createButton('Restart');
  restartBtn.position(10, height - 40);
  restartBtn.mousePressed(() => {
    generateLevel(currentSeed);
    loop();
  });

  newLevelBtn = createButton('New Level');
  newLevelBtn.position(100, height - 40);
  newLevelBtn.mousePressed(() => {
    generateLevel();
    loop();
  });
}

function generateLevel(seed = floor(random(10000))) {
  randomSeed(seed);
  currentSeed = seed;
  blocks = [];

  // Add red block at goal (solved)
  blocks.push(new Block(4, 2, 2, 1, true));

  // Add fixed other blocks
  blocks.push(new Block(0, 0, 1, 2));
  blocks.push(new Block(3, 0, 1, 2));
  blocks.push(new Block(0, 4, 2, 1));
  blocks.push(new Block(4, 4, 2, 1));
  blocks.push(new Block(2, 3, 1, 2));

  // Shuffle others via valid reverse moves
  let steps = 30;
  for (let i = 0; i < steps; i++) {
    let movable = blocks.filter(b => b !== blocks[0]); // non-red
    let b = random(movable);
    let dir = random(['up', 'down', 'left', 'right']);
    let dx = 0, dy = 0;

    if (b.w > b.h) {
      if (dir === 'left') dx = -1;
      if (dir === 'right') dx = 1;
    } else {
      if (dir === 'up') dy = -1;
      if (dir === 'down') dy = 1;
    }

    let newX = b.x + dx;
    let newY = b.y + dy;

    if (
      newX >= 0 &&
      newY >= 0 &&
      newX + b.w <= gridSize &&
      newY + b.h <= gridSize &&
      !blocks.some(o => o !== b && o.collides(newX, newY, o))
    ) {
      b.x = newX;
      b.y = newY;
    }
  }

  // Move red block from solved to starting pos
  blocks[0].x = 0;
}

function draw() {
  background(240);

  // Draw border with open exit at row 2
  stroke(0);
  strokeWeight(4);
  line(0, 0, width, 0);
  line(0, 0, 0, height - 50);
  line(0, height - 50, width, height - 50);
  for (let i = 0; i < gridSize; i++) {
    if (i !== 2) {
      line(width - 1, i * cellSize, width - 1, (i + 1) * cellSize);
    }
  }

  // Draw blocks
  for (let block of blocks) {
    block.show();
  }

  // Win condition
  let red = blocks[0];
  if (red.x + red.w === gridSize) {
    fill(0, 200, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("You Win!", width / 2, height / 2);
    noLoop();
  }
}

function mousePressed() {
  if (mouseY > height - 50) return;
  for (let block of blocks) {
    if (block.contains(mouseX, mouseY)) {
      draggingBlock = block;
      offsetX = mouseX - block.x * cellSize;
      offsetY = mouseY - block.y * cellSize;
      break;
    }
  }
}

function mouseDragged() {
  if (draggingBlock) {
    draggingBlock.drag(mouseX - offsetX, mouseY - offsetY, blocks);
  }
}

function mouseReleased() {
  if (draggingBlock) {
    draggingBlock.snap();
    draggingBlock = null;
  }
}

class Block {
  constructor(x, y, w, h, isRed = false) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.isRed = isRed;
  }

  show() {
    fill(this.isRed ? 'red' : 'tan');
    stroke(0);
    rect(this.x * cellSize, this.y * cellSize, this.w * cellSize, this.h * cellSize);
  }

  contains(px, py) {
    return (
      px > this.x * cellSize &&
      px < (this.x + this.w) * cellSize &&
      py > this.y * cellSize &&
      py < (this.y + this.h) * cellSize
    );
  }

  drag(px, py, others) {
    let newX = round(px / cellSize);
    let newY = round(py / cellSize);

    if (this.w > this.h) newY = this.y;
    else newX = this.x;

    newX = constrain(newX, 0, gridSize - this.w);
    newY = constrain(newY, 0, gridSize - this.h);

    for (let b of others) {
      if (b !== this && this.collides(newX, newY, b)) return;
    }

    this.x = newX;
    this.y = newY;
  }

  collides(nx, ny, other) {
    return !(
      nx + this.w <= other.x ||
      nx >= other.x + other.w ||
      ny + this.h <= other.y ||
      ny >= other.y + other.h
    );
  }

  snap() {
    this.x = round(this.x);
    this.y = round(this.y);
  }
}
