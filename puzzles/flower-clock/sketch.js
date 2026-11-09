let flowerImages = [], handImage;
let flowers = [];
let handAngle = 210;
let handInstalled = false;
let dragging = false, lastMouseAngle = 0;
let patterns = [
  [1, 2, 3],
  [2, 1, 3],
  // [3, 2, 1]
];
let patternIndex = 0, matched = 0;
let completionReported = false;
let lastPlantSoundFrame = -1;
let flowerFrames = [
  [306, 395, 412, 232, 512, 625],
  [371, 258, 280, 507, 514, 762],
  [256, 194, 511, 662, 512, 853],
  [352, 153, 321, 734, 512, 884]
];
let flowerHeights = [60, 112, 155, 164];

function preload() {
  for (let i = 0; i < 4; i++) {
    flowerImages[i] = loadImage('assets/stage-' + i + '.png');
  }
  handImage = loadImage('assets/hand.svg');
}

function setup() {
  createCanvas(960, 960).parent('clock-canvas');
  angleMode(DEGREES);
  startRound();
}

function startRound() {
  flowers = new Array(12).fill(null);
  flowers[7] = new Flower(7);
  if (handInstalled) playPlantSound();
  handAngle = 210;
  matched = 0;
  dragging = false;
  showPattern(true);
}

function draw() {
  if (matched === 3 && patternIndex < patterns.length - 1) {
    patternIndex++;
    startRound();
  }
  if (!focused) dragging = false;
  if (handInstalled && focused && !dragging) {
    let speed = min(deltaTime, 50) * 0.05;
    if (keyIsDown(RIGHT_ARROW)) turnHand(speed);
    if (keyIsDown(LEFT_ARROW)) turnHand(-speed);
  }
  background('#c9b194');
  translate(width / 2, height / 2);
  drawDial();
  for (let flower of flowers) {
    if (flower) flower.display();
  }
  if (handInstalled) {
    rotate(handAngle - 180);
    imageMode(CENTER);
    image(handImage, 0, 0, 900, 900);
  }
}

class Flower {
  constructor(slot) {
    this.slot = slot;
    this.age = 0;
    this.stage = 0;
    this.bounceStart = millis();
    this.cut = false;
    this.rootAlpha = 255;
  }

  update(amount) {
    if (this.cut) {
      this.rootAlpha = max(0, this.rootAlpha - abs(amount) * 255 / 30);
      return;
    }
    if (amount > 0) this.age = min(180, this.age + amount);
    let nextStage = min(3, floor((this.age + 0.001) / 60));
    if (nextStage !== this.stage) {
      this.stage = nextStage;
      this.bounceStart = millis();
      playPlantSound();
    }
  }

  display() {
    push();
    rotate(this.slot * 30);
    translate(0, -215);
    if (this.cut) {
      stroke(142, 163, 118, this.rootAlpha);
      strokeWeight(4);
      line(0, 0, 0, -12);
    } else {
      let t = constrain((millis() - this.bounceStart) / 450, 0, 1);
      let bounce = sin(t * 540) * (1 - t) * 0.28;
      scale(1 - bounce * 0.4, 1 + bounce);
      let frame = flowerFrames[this.stage];
      let size = flowerHeights[this.stage] / frame[3];
      imageMode(CORNER);
      image(flowerImages[this.stage],
        (frame[0] - frame[4]) * size, (frame[1] - frame[5]) * size,
        frame[2] * size, frame[3] * size,
        frame[0], frame[1], frame[2], frame[3]);
    }
    pop();
  }
}

function turnHand(amount) {
  if (!handInstalled || matched === 3 || amount === 0) return;
  let target = round(handAngle + amount, 6);
  let direction = amount > 0 ? 1 : -1;
  let tick = direction > 0 ? floor(handAngle / 30) + 1 : ceil(handAngle / 30) - 1;
  while (direction * (target - tick * 30) >= 0) {
    advanceHand(tick * 30);
    let slot = ((tick % 12) + 12) % 12;
    if (!flowers[slot] || flowers[slot].cut) {
      flowers[slot] = new Flower(slot);
      playPlantSound();
    }
    harvest((slot + 6) % 12);
    if (matched === 3) return;
    tick += direction;
  }
  advanceHand(target);
}

function advanceHand(angle) {
  for (let flower of flowers) {
    if (flower) flower.update(angle - handAngle);
  }
  handAngle = angle;
}

function harvest(slot) {
  let flower = flowers[slot];
  if (!flower || flower.cut) return;
  flower.cut = true;
  if (flower.stage === 0) return;
  if (flower.stage === patterns[patternIndex][matched]) matched++;
  else matched = 0;
  showPattern();
  if (matched === 3 && patternIndex === patterns.length - 1 && !completionReported) {
    completionReported = true;
    if (typeof parent.completePuzzle === "function") parent.completePuzzle("flower-clock");
  }
}

function showPattern(newSequence = false) {
  let icons = document.querySelectorAll('#pattern img');
  let names = ['Sprout', 'Bud', 'Flower', 'Seed pod'];
  for (let i = 0; i < 3; i++) {
    icons[i].src = 'assets/stage-' + patterns[patternIndex][i] + '.png';
    icons[i].alt = names[patterns[patternIndex][i]];
    icons[i].className = i < matched ? 'done' : '';
    if (newSequence) icons[i].classList.add('bounce');
  }
  document.getElementById('pattern').style.visibility = 'visible';
}

function drawDial() {
  stroke('#211b15');
  strokeWeight(4);
  fill('#a47c53');
  circle(0, 0, 912);
  fill('#34251f');
  circle(0, 0, 852);
  textFont('Georgia');
  textSize(20);
  textAlign(CENTER, CENTER);
  for (let i = 0; i < 12; i++) {
    push();
    rotate(i * 30);
    stroke('#e4d6bb');
    strokeWeight(3);
    line(0, -408, 0, -420);
    pop();
    noStroke();
    fill('#30241a');
    text(i || 12, sin(i * 30) * 441, -cos(i * 30) * 441);
  }
}

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  if (!handInstalled) {
    if (dist(mouseX, mouseY, width / 2, height / 2) < 456) installHand();
    return;
  }
  if (matched === 3) return;
  let x = mouseX - width / 2;
  let y = mouseY - height / 2;
  let along = x * sin(handAngle) - y * cos(handAngle);
  let across = x * cos(handAngle) + y * sin(handAngle);
  let shaft = abs(across) < 35 && abs(along) < 380;
  let blade = along < -230 && along > -410 && across > -150 && across < 35;
  if ((shaft || blade) && dist(0, 0, x, y) > 30) {
    dragging = true;
    lastMouseAngle = atan2(y, x);
  }
}

function mouseDragged() {
  if (!dragging || dist(mouseX, mouseY, width / 2, height / 2) < 30) return;
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  let change = angle - lastMouseAngle;
  if (change > 180) change -= 360;
  if (change < -180) change += 360;
  turnHand(change);
  lastMouseAngle = angle;
  return false;
}

function mouseReleased() {
  dragging = false;
}

function keyPressed() {
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) return false;
}

function installHand() {
  if (handInstalled || typeof parent.getSelectedItem !== 'function') return;
  if (parent.getSelectedItem() !== 5) return;
  handInstalled = true;
  parent.removeInventoryItem(5);
  document.getElementById("place-sound").play().catch(error => {
    console.warn("Place sound could not start:", error.message);
  });
}

function playPlantSound() {
  // Several flowers may grow together; play only once in the same frame.
  if (lastPlantSoundFrame === frameCount) return;
  lastPlantSoundFrame = frameCount;
  const sound = document.getElementById("plant-sound").cloneNode();
  sound.play().catch(error => {
    if (error.name !== "AbortError") console.warn("Plant sound could not start:", error.message);
  });
}
