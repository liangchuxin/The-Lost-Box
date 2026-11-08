// Keep cutting quickly to break the photo, then move the pieces to uncover the key.
// Each Piece stores its shape and movement. The original photo supplies its image.
let pieces = [];
let cuts = []; // Each cut is shared by the pieces it separates.
let trails = [];
let dust = [];
let photoImage, keyImage;
let broken = false;
let keyCollected = false;
let chainProgress = 0;
let lastCut = -10;
let spaceHeld = false;
let pausedAt = null;
let hitPause = 0;
let shake = 0;

const HEAL_TIME = 0.8; // Seconds until the pieces close completely.
const CHAIN_WINDOW = 0.3; // A longer gap between cuts resets the chain.
const CUT_POWER = 5; // Twenty connected cuts reach 100.
const BOX = {}; // The photo's four edges on the canvas.

function preload() {
  photoImage = loadImage("assets/husband.png");
  keyImage = loadImage("assets/key.svg");
}

function setup() {
  const canvas = createCanvas(740, 620).parent("scene");
  const photoHeight = height - 60;
  const photoWidth = photoHeight * photoImage.width / photoImage.height;
  BOX.left = (width - photoWidth) / 2;
  BOX.right = (width + photoWidth) / 2;
  BOX.top = 30;
  BOX.bottom = height - 30;

  // Only clicking the canvas cuts; clicking Retry should not also cut.
  canvas.elt.addEventListener("pointerdown", clickPhoto);
  document.getElementById("reset").onclick = resetPuzzle;
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => { spaceHeld = false; });
  window.addEventListener("message", handlePuzzleMessage);
  resetPuzzle();
  getInventoryItem();
}

function resetPuzzle() {
  pieces = [new Piece(photoCorners())];
  cuts = [];
  trails = [];
  dust = [];
  broken = false;
  keyCollected = false;
  spaceHeld = false;
  chainProgress = 0;
  lastCut = -10;
  hitPause = 0;
  shake = 0;
}

function draw() {
  const now = millis() / 1000;
  let dt = min(deltaTime, 32) / 1000; // Seconds since the previous frame.
  if (spaceHeld && !broken && now - lastCut >= 0.14) randomCut();
  if (hitPause > 0) {
    hitPause -= dt;
    dt = 0; // Briefly hold the shake and particles after a cut.
  }

  // The newest cut heals last. Once it closes, use one whole photo again.
  if (!broken && cuts.length > 0 && now - lastCut >= HEAL_TIME) {
    pieces = [new Piece(photoCorners())];
    cuts = [];
    chainProgress = 0;
  }

  background("#34251f");
  noFill();
  stroke("#5b4535");
  strokeWeight(1);
  rect(10, 10, width - 20, height - 20);

  push();
  translate(random(-shake, shake), random(-shake, shake));
  shake *= exp(-20 * dt);
  if (broken && !keyCollected) {
    image(keyImage, width / 2 - 45, height / 2 - 45, 90, 90);
  }
  for (const piece of pieces) {
    piece.update(dt, now);
    piece.display();
  }
  drawCutEffects(dt);
  pop();

  if(keyCollected){
    home_button.display();
  }
}

class Piece {
  constructor(points, source) {
    this.points = points;
    this.center = { x: 0, y: 0 };
    for (const point of points) {
      this.center.x += point.x / points.length;
      this.center.y += point.y / points.length;
    }
    this.x = 0;
    this.y = 0;
    this.cuts = []; // Each entry stores a cut and this piece's side: +1 or -1.
    if (source) {
      this.x = source.x;
      this.y = source.y;
      this.cuts = source.cuts.slice(); // Both new halves inherit earlier cuts.
    }
  }

  update(dt, now) {
    if (broken) {
      this.targetX += this.driftX * dt;
      this.targetY += this.driftY * dt;
      const follow = 1 - exp(-18 * dt); // Smooth movement, even at different frame rates.
      this.x = lerp(this.x, this.targetX, follow);
      this.y = lerp(this.y, this.targetY, follow);
    } else {
      this.x = 0;
      this.y = 0;
      // Add the movement from every cut that still affects this piece.
      for (const effect of this.cuts) {
        const age = now - effect.cut.start;
        const opening = 1 - pow(1 - constrain(age / 0.035, 0, 1), 3);
        const offset = opening * healAmount(age) * effect.sign;
        this.x += effect.cut.dx * offset;
        this.y += effect.cut.dy * offset;
      }
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    // A clipping path only shows the part of the photo inside this polygon.
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      drawingContext.lineTo(this.points[i].x, this.points[i].y);
    }
    drawingContext.closePath();
    drawingContext.clip();
    image(photoImage, BOX.left, BOX.top, BOX.right - BOX.left, BOX.bottom - BOX.top);
    drawingContext.restore();
    pop();
  }
}

// Open in 0.035 seconds, then close quickly at first and gently at the end.
function healAmount(age) {
  const t = constrain((age - 0.035) / (HEAL_TIME - 0.035), 0, 1);
  return (1 - t) * (1 - t);
}

function randomCut() {
  if (broken) return;
  const angle = random(TWO_PI);
  const x = random(lerp(BOX.left, BOX.right, 0.2), lerp(BOX.left, BOX.right, 0.8));
  const y = random(lerp(BOX.top, BOX.bottom, 0.2), lerp(BOX.top, BOX.bottom, 0.8));
  const dx = cos(angle) * 700;
  const dy = sin(angle) * 700;
  slash({ x: x - dx, y: y - dy }, { x: x + dx, y: y + dy });
}

function slash(a, b) {
  const now = millis() / 1000;
  if (now - lastCut < 0.065) return;
  const length = dist(a.x, a.y, b.x, b.y);
  const normalX = -(b.y - a.y) / length;
  const normalY = (b.x - a.x) / length;
  // Move the two sides away from the cut line, rather than along it.
  const cut = { start: now, dx: normalX * random(6, 9), dy: normalY * random(6, 9) };
  const nextPieces = [];
  let splitCount = 0;
  for (const piece of pieces) {
    const left = splitPolygon(piece.points, a, b, 1);
    const right = splitPolygon(piece.points, a, b, -1);
    // Avoid tiny slivers and too many fragments.
    if (area(left) > 55 && area(right) > 55 && pieces.length + splitCount < 240) {
      const leftPiece = new Piece(left, piece);
      const rightPiece = new Piece(right, piece);
      leftPiece.cuts.push({ cut: cut, sign: 1 });
      rightPiece.cuts.push({ cut: cut, sign: -1 });
      nextPieces.push(leftPiece, rightPiece);
      splitCount++;
    } else {
      nextPieces.push(piece);
    }
  }
  if (splitCount === 0) return;
  pieces = nextPieces;
  cuts.push(cut);
  if (now - lastCut > CHAIN_WINDOW) chainProgress = 0;
  chainProgress = min(100, chainProgress + CUT_POWER);
  lastCut = now;
  hitPause = 0.024;
  shake = 2 + chainProgress * 0.012;
  trails.push({
    a: { x: a.x - (b.x - a.x) * 2, y: a.y - (b.y - a.y) * 2 },
    b: { x: b.x + (b.x - a.x) * 2, y: b.y + (b.y - a.y) * 2 },
    life: 0.2
  });
  for (let i = 0; i < 8; i++) {
    dust.push({
      x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
      vx: random(-180, 180), vy: random(-180, 180), life: random(0.2, 0.5)
    });
  }
  if (chainProgress >= 100) breakPhoto(cut, a, b, now);
}

function breakPhoto(lastEffect, a, b, now) {
  broken = true;
  shake = 4;
  hitPause = 0.035;
  for (const piece of pieces) {
    let driftX = 0;
    let driftY = 0;
    for (const effect of piece.cuts) {
      let remaining = healAmount(now - effect.cut.start);
      if (effect.cut === lastEffect) remaining = 1;
      driftX += effect.cut.dx * remaining * effect.sign;
      driftY += effect.cut.dy * remaining * effect.sign;
    }
    piece.targetX = (piece.center.x - width / 2) * 0.045 + driftX;
    piece.targetY = (piece.center.y - height / 2) * 0.045 + driftY;
    // Keep drifting in the cut direction. If offsets cancel, use the newest cut.
    if (dist(0, 0, driftX, driftY) < 0.1) {
      let sign = 1;
      if (side(piece.center, a, b) < 0) sign = -1;
      const length = dist(a.x, a.y, b.x, b.y);
      driftX = -(b.y - a.y) / length * sign;
      driftY = (b.x - a.x) / length * sign;
    }
    const speed = random(3, 5) / dist(0, 0, driftX, driftY);
    piece.driftX = driftX * speed;
    piece.driftY = driftY * speed;
  }
}

function clickPhoto(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  if (broken) {
    if(keyCollected) home_button.clickNext();
    // Convert browser coordinates to canvas coordinates when CSS scales the canvas.
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * width / bounds.width;
    const y = (event.clientY - bounds.top) * height / bounds.height;
    moveFragments(x, y);
  } else {
    randomCut();
  }
}

// Handle repeated keydown events too, so holding Space does not scroll the page.
function handleKeyDown(event) {
  if (event.code !== "Space" || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  event.preventDefault();
  if (!spaceHeld && !broken) randomCut();
  spaceHeld = true;
}

function handleKeyUp(event) {
  if (event.code === "Space") {
    event.preventDefault();
    spaceHeld = false;
  }
}

function moveFragments(x, y) {
  if (tryCollectKey(x, y)) return;
  for (const piece of pieces) {
    let dx = piece.center.x + piece.x - x;
    let dy = piece.center.y + piece.y - y;
    let distance = dist(0, 0, dx, dy);
    if (distance > 180 && !pieceCovers(piece, x, y)) continue;
    if (distance < 1) {
      dx = piece.driftX || 1;
      dy = piece.driftY || 0;
      distance = dist(0, 0, dx, dy);
    }
    // Divide by distance to get a direction; nearby pieces receive a larger push.
    const force = 65 * max(0.25, 1 - distance / 200);
    piece.targetX += dx / distance * force;
    piece.targetY += dy / distance * force;
    piece.driftX = dx / distance * 4;
    piece.driftY = dy / distance * 4;
  }
}

function tryCollectKey(x, y) {
  if (keyCollected) return false;
  const keyX = x - (width / 2 - 45);
  const keyY = y - (height / 2 - 45);
  // Match the ring and diagonal shaft inside the 90 x 90 SVG.
  const onRing = dist(keyX, keyY, 20, 70) < 22;
  const onShaft = keyX > 27 && keyX < 86 && keyY > 4 && keyY < 65 && abs(keyX + keyY - 90) < 11;
  if (!onRing && !onShaft) return false;
  for (const piece of pieces) {
    if (pieceCovers(piece, x, y)) return false; // Cannot collect through the photo.
  }
  keyCollected = true;
  addItemToLocalStorage();
  if (typeof parent.addItem === "function") parent.addItem(1);
  return true;
}

function drawCutEffects(dt) {
  // Work backward so splice() does not skip the next particle.
  for (let i = dust.length - 1; i >= 0; i--) {
    const particle = dust[i];
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 160 * dt;
    stroke(228, 202, 159, max(0, particle.life) * 330);
    strokeWeight(1.5);
    line(particle.x, particle.y, particle.x - particle.vx * 0.015, particle.y - particle.vy * 0.015);
    if (particle.life <= 0) dust.splice(i, 1);
  }
  for (let i = trails.length - 1; i >= 0; i--) {
    const trail = trails[i];
    trail.life -= dt;
    stroke(245, 233, 205, max(0, trail.life / 0.2) * 220);
    strokeWeight(1 + max(0, trail.life) * 10);
    line(trail.a.x, trail.a.y, trail.b.x, trail.b.y);
    if (trail.life <= 0) trails.splice(i, 1);
  }
}

// Geometry helpers: polygon points stay in their original photo coordinates.
function photoCorners() {
  return [
    { x: BOX.left, y: BOX.top }, { x: BOX.right, y: BOX.top },
    { x: BOX.right, y: BOX.bottom }, { x: BOX.left, y: BOX.bottom }
  ];
}

// The sign tells which side of the directed line a point lies on; zero is on it.
function side(point, a, b) {
  return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
}

function splitPolygon(points, a, b, sign) {
  const result = [];
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length]; // Wrap from last point to first.
    const currentSide = side(current, a, b) * sign;
    const nextSide = side(next, a, b) * sign;
    if (currentSide >= 0) result.push(current);
    if ((currentSide > 0 && nextSide < 0) || (currentSide < 0 && nextSide > 0)) {
      // This edge crosses the cut. Add the intersection to both new shapes.
      const t = currentSide / (currentSide - nextSide);
      result.push({ x: lerp(current.x, next.x, t), y: lerp(current.y, next.y, t) });
    }
  }
  return result;
}

function area(points) {
  // Polygon area from pairs of neighboring corners; used to reject tiny pieces.
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += a.x * b.y - b.x * a.y;
  }
  return abs(total) / 2;
}

function pieceCovers(piece, x, y) {
  const point = { x: x - piece.x, y: y - piece.y };
  // Our pieces are convex: an inside point lies on the inside of every edge.
  for (let i = 0; i < piece.points.length; i++) {
    const a = piece.points[i];
    const b = piece.points[(i + 1) % piece.points.length];
    if (side(point, a, b) < -0.001) return false;
  }
  return true;
}

function handlePuzzleMessage(event) {
  if (event.source !== parent || event.origin !== location.origin) return;
  if (event.data === "pause-puzzle") {
    spaceHeld = false;
    if (pausedAt === null) pausedAt = millis() / 1000;
  }
  if (event.data === "resume-puzzle" && pausedAt !== null) {
    // module.js pauses draw(), but millis() keeps running. Shift the timers too.
    const pausedTime = millis() / 1000 - pausedAt;
    lastCut += pausedTime;
    for (const cut of cuts) cut.start += pausedTime;
    pausedAt = null;
  }
}

home_button = {
    x: 740/2,
    y: 620/4,
    size: 150,
    mouseover: function(){
        if(dist(mouseX, mouseY, this.x, this.y) < this.size/2){
            return true;
        }
        return false;
    },
    display: function(){
        fill('#32965D');
        if(this.mouseover()) fill('#21633e');
        ellipse(this.x, this.y, this.size, this.size);
        fill(255);
        textSize(45);
        textAlign(CENTER, CENTER);
        text("next", this.x, this.y);
    },
    clickNext: function(){
        if(this.mouseover()){
            if (typeof parent.showHub === "function") parent.showHub();
        }
    }
}

function addItemToLocalStorage(){
  if (typeof parent.addItem === "function") parent.addItem(1);
    let str = localStorage.getItem('collected_items')
    if(str == null){
        str = "[]";
    }
    let collected_items = JSON.parse(str);
    collected_items.push(1);
    localStorage.setItem('collected_items', JSON.stringify(collected_items));
}

function getInventoryItem(){
    //if (parent.getSelectedItem() === 4) {
        parent.removeInventoryItem(4);
    //}
}