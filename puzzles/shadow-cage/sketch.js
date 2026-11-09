// Real objects and their symbolic shadows use separate image assets.
// Their positions follow a point-light projection; opening the cage is story animation.
let art = {};
let selected = null;
let placed = [null, null, null];
let lampX = 420;
let moving = 0;
let draggingLamp = false;
let lastLampMove = -Infinity;
let solved = false;
let photoCollected = false;
let flightTime = 0;

const LIGHT_DEPTH = 600;
const LIGHT_HEIGHT = 550;
const crops = {
  cage: [322, 196, 409, 578],
  pen: [224, 148, 621, 610],
  ribbon: [317, 312, 380, 406],
  lantern: [378, 174, 259, 610],
  cageShadow: [337, 240, 361, 509],
  cageOpen: [337, 240, 502, 509],
  keyShadow: [0, 0, 2064, 512],
  butterfly: [0, 0, 80, 64],
};
const names = { cage: "Birdcage", ribbon: "Ribbon", pen: "Fountain pen" };
const restingPlaces = {
  cage: { screenX: 175, screenY: 611 },
  ribbon: { screenX: 800, screenY: 532 },
  pen: { screenX: 800, screenY: 645 },
};
const itemSizes = {
  cage: { w: 104, h: 147, bottom: -4 },
  ribbon: { w: 74, h: 79, bottom: -4 },
  pen: { w: 130, h: 127, bottom: 16 },
};
// The key must reach this point on the closed cage image.
const latchPoint = { x: 578, y: 578 };
const cageScale = 600 / (600 - 260);
const bowScale = 600 / (600 - 170);
const keyScale = 600 / (600 - 340);
const targetCageX = 365;
const targetLatchX =
  targetCageX + ((latchPoint.x - 337) / 361 - 0.5) * 130 * cageScale;
const targetLatchY =
  420 - 185 * cageScale + ((latchPoint.y - 240) / 509) * 185 * cageScale;
// Work backward from one aligned composition to find real object positions.
const slots = [
  {
    x: 520 + (targetCageX - 520) / cageScale,
    z: 260,
    screenX: 330,
    screenY: 605,
  },
  {
    x: 520 + (targetCageX - 520) / bowScale,
    z: 170,
    screenX: 435,
    screenY: 530,
  },
  {
    x: 520 + (targetLatchX - 520) / keyScale,
    z: 340,
    screenX: 650,
    screenY: 615,
  },
];
const objectHeights = {
  cage: LIGHT_HEIGHT + (420 - LIGHT_HEIGHT) / cageScale,
  ribbon: LIGHT_HEIGHT + (targetLatchY - LIGHT_HEIGHT) / bowScale,
  pen: LIGHT_HEIGHT + (targetLatchY - LIGHT_HEIGHT) / keyScale,
};

function preload() {
  art.room = loadImage("assets/room.png");
  art.cage = loadImage("assets/birdcage.png");
  art.pen = loadImage("assets/pen.png");
  art.ribbon = loadImage("assets/ribbon.png");
  art.lantern = loadImage("assets/lantern.png");
  art.cageShadow = loadImage("assets/cage-shadow.png");
  art.cageOpen = loadImage("assets/cage-open.png");
  art.keyShadow = loadImage("assets/key-shadow.png");
  art.butterfly = loadImage("assets/butterfly-simple.svg");
  art.photo = loadImage("../photo/images/photo.png");
}

function setup() {
  createCanvas(960, 760).parent("scene");
  textFont("Georgia");
  document.getElementById("reset").onclick = resetPuzzle;
  document.getElementById("collect-photo").onclick = collectPhoto;
  for (const button of document.querySelectorAll("[data-item]")) {
    button.onclick = () => {
      if (solved) return;
      const id = button.dataset.item;
      const index = placed.indexOf(id);
      if (selected && selected !== id && index >= 0) {
        placeItem(index);
        return;
      }
      selected = selected === id ? null : id;
      if (selected) playObjectSound("pickup");
      updateControls();
    };
  }
  for (const button of document.querySelectorAll("[data-slot]")) {
    button.onclick = () => placeItem(Number(button.dataset.slot));
  }
  for (const button of document.querySelectorAll("[data-move]")) {
    button.addEventListener("pointerdown", (event) => {
      if (solved) return;
      moving = Number(button.dataset.move);
      button.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    button.addEventListener("pointerup", () => (moving = 0));
    button.addEventListener("pointercancel", () => (moving = 0));
  }
  window.addEventListener("blur", () => {
    moving = 0;
    draggingLamp = false;
    setLampSound(false);
  });
  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.origin !== location.origin) return;
    if (event.data === "pause-puzzle") {
      moving = 0;
      draggingLamp = false;
      setLampSound(false);
    }
  });
  updateControls();
}

function placeItem(index) {
  if (solved) return;
  if (!selected) {
    selected = placed[index];
    if (selected) playObjectSound("pickup");
    updateControls();
    return;
  }
  const oldIndex = placed.indexOf(selected);
  if (oldIndex >= 0) placed[oldIndex] = null;
  placed[index] = selected; // The displaced item returns to its spare spot on the table.
  playObjectSound("place");
  selected = null;
  updateControls();
}

function updateControls() {
  for (const button of document.querySelectorAll("[data-item]")) {
    const id = button.dataset.item;
    const bounds = itemBounds(id);
    button.style.left = `${(bounds.x / 960) * 100}%`;
    button.style.top = `${(bounds.y / 760) * 100}%`;
    button.style.width = `${(bounds.w / 960) * 100}%`;
    button.style.height = `${(bounds.h / 760) * 100}%`;
    button.setAttribute("aria-pressed", selected === id);
    button.disabled = solved;
  }
  document.querySelectorAll("[data-slot]").forEach((button, i) => {
    button.disabled = solved;
    button.setAttribute(
      "aria-label",
      `${["Front-left", "Back-left", "Right"][i]} position: ${names[placed[i]] || "empty"}`,
    );
  });
  document
    .querySelectorAll("[data-move]")
    .forEach((button) => (button.disabled = solved));
  const photoButton = document.getElementById("collect-photo");
  photoButton.hidden = !solved || photoCollected;
  document.getElementById("reset").disabled = photoCollected;
  if (solved && !photoCollected) {
    const bounds = photoBounds(cageBounds(project("cage")));
    photoButton.style.left = `${(bounds.x / 960) * 100}%`;
    photoButton.style.top = `${(bounds.y / 760) * 100}%`;
    photoButton.style.width = `${(bounds.w / 960) * 100}%`;
    photoButton.style.height = `${(bounds.h / 760) * 100}%`;
  }
}

function resetPuzzle() {
  setLampSound(false);
  lastLampMove = -Infinity;
  placed = [null, null, null];
  selected = null;
  lampX = 420;
  moving = 0;
  draggingLamp = false;
  solved = false;
  photoCollected = false;
  flightTime = 0;
  updateControls();
}

function project(id) {
  const index = placed.indexOf(id);
  if (index < 0) return null;
  const slot = slots[index];
  const scale = LIGHT_DEPTH / (LIGHT_DEPTH - slot.z);
  return {
    x: lampX + (slot.x - lampX) * scale,
    y: LIGHT_HEIGHT + (objectHeights[id] - LIGHT_HEIGHT) * scale,
    scale,
  };
}

function cageBounds(cage) {
  return {
    x: cage.x - 65 * cage.scale,
    y: cage.y - 185 * cage.scale,
    w: 130 * cage.scale,
    h: 185 * cage.scale,
  };
}

function getLatch(box) {
  return {
    x: box.x + ((latchPoint.x - 337) / 361) * box.w,
    y: box.y + ((latchPoint.y - 240) / 509) * box.h,
  };
}

function isAligned(cage, key, bow) {
  if (!cage || !key || !bow) return false;
  const box = cageBounds(cage);
  const latch = getLatch(box);
  const halfWing = 27.5 * bow.scale;
  return (
    dist(key.x, key.y, latch.x, latch.y) < 11 &&
    bow.x - halfWing > box.x + box.w * 0.12 &&
    bow.x + halfWing < box.x + box.w * 0.88 &&
    bow.y - 18 * bow.scale > box.y + box.h * 0.4 &&
    bow.y + 18 * bow.scale < box.y + box.h * 0.88
  );
}

function draw() {
  const dt = min(deltaTime, 50) / 1000;
  const previousLampX = lampX;
  if (!solved) {
    if (draggingLamp) lampX = constrain(mouseX, 360, 720);
    else lampX = constrain(lampX + moving * 100 * dt, 360, 720);
  }
  const cage = project("cage"),
    key = project("pen"),
    bow = project("ribbon");
  const aligned = isAligned(cage, key, bow);
  if (!solved && aligned) {
    solved = true;
    moving = 0;
    draggingLamp = false;
    selected = null;
    updateControls();
  } else if (solved) {
    flightTime += dt;
  }
  if (lampX !== previousLampX) lastLampMove = millis();
  // Bridge short gaps between mouse updates without restarting the sound each frame.
  setLampSound(
    !solved && (draggingLamp || moving !== 0) && millis() - lastLampMove < 100,
  );
  drawRoom();
  drawShadows(cage, key, bow);
  drawSlots();
  drawObjects();
  drawLantern();
}

function drawRoom() {
  image(art.room, 0, 0, width, height);
  const ctx = drawingContext;
  const glow = ctx.createRadialGradient(
    460 + (lampX - 520) * 0.08,
    260,
    80,
    460,
    260,
    430,
  );
  glow.addColorStop(0, "rgba(255,240,195,.92)");
  glow.addColorStop(0.65, "rgba(249,224,175,.55)");
  glow.addColorStop(1, "rgba(249,224,175,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(46, 42, 868, 407);
}

function drawSlots() {
  noStroke();
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    fill(43, 28, 20, 45);
    ellipse(slot.screenX, slot.screenY, 112, 22);
    noFill();
    stroke(225, 202, 155, placed[i] ? 50 : 140);
    strokeWeight(1);
    ellipse(slot.screenX, slot.screenY, 112, 22);
  }
}

// Crop only when rendering, leaving the supplied PNG files unchanged.
function sprite(id, x, y, w, h) {
  const crop = crops[id];
  image(art[id], x, y, w, h, crop[0], crop[1], crop[2], crop[3]);
}

function itemBounds(id) {
  const index = placed.indexOf(id);
  const position = index < 0 ? restingPlaces[id] : slots[index];
  const size = itemSizes[id];
  return {
    x: position.screenX - size.w / 2,
    y: position.screenY + size.bottom - size.h,
    w: size.w,
    h: size.h,
    groundX: position.screenX,
    groundY: position.screenY,
  };
}

function drawObjects() {
  // Every object stays on the table; unplaced objects sit beside the three slots.
  const order = Object.keys(names).sort(
    (a, b) => itemBounds(a).groundY - itemBounds(b).groundY,
  );
  for (const id of order) {
    const b = itemBounds(id);
    noStroke();
    fill(43, 28, 20, 45);
    ellipse(b.groundX, b.groundY, b.w * 0.85, 15);
    if (selected === id) {
      noFill();
      stroke(242, 214, 158, 200);
      strokeWeight(2);
      ellipse(b.groundX, b.groundY, b.w + 12, 23);
    }
    sprite(id, b.x, b.y, b.w, b.h);
  }
}

function drawLantern() {
  noStroke();
  fill(45, 29, 17, 55);
  ellipse(lampX, 711, 105, 17);
  const ctx = drawingContext;
  const glow = ctx.createRadialGradient(lampX, 655, 8, lampX, 655, 85);
  glow.addColorStop(0, "rgba(253,205,106,.2)");
  glow.addColorStop(1, "rgba(253,205,106,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(lampX - 85, 570, 170, 170);
  sprite("lantern", lampX - 32, 558, 64, 151);
}

function drawShadows(cage, key, bow) {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(46, 42, 868, 407);
  ctx.clip();
  if (bow && !solved) drawButterfly(bow);
  if (cage) {
    const box = cageBounds(cage);
    drawCageShadow(box);
    if (solved && !photoCollected) drawPhoto(box);
  }
  if (key) {
    const w = 100 * key.scale,
      h = (w * 512) / 2064;
    sprite("keyShadow", key.x, key.y - (h * 254) / 512, w, h);
  }
  // Once through the open door, the butterfly flies in front of the bars.
  if (bow && solved) drawButterfly(bow);
  ctx.restore();
}

// butterfly implementation with help of codex 11.4

function drawButterfly(bow) {
  const t = flightTime;
  const flap = solved ? 0.58 + abs(sin(flightTime * 8)) * 0.42 : 1;
  push();
  translate(bow.x + t * 140, bow.y - pow(t, 1.25) * 95);
  scale(flap, 1);
  sprite(
    "butterfly",
    -29.5 * bow.scale,
    -25.1 * bow.scale,
    59 * bow.scale,
    47.2 * bow.scale,
  );
  pop();
}

function drawCageShadow(box) {
  const id = solved ? "cageOpen" : "cageShadow";
  // Keep the cage body fixed; the open image has extra width for its door.
  sprite(id, box.x, box.y, (box.w * crops[id][2]) / crops.cageShadow[2], box.h);
}

// The photo lies flat on the floor of the open cage.
function photoBounds(box) {
  return {
    x: box.x + box.w * 0.27,
    y: box.y + box.h * 0.82,
    w: box.w * 0.46,
    h: box.h * 0.14,
  };
}

function drawPhoto(box) {
  const b = photoBounds(box);
  push();
  translate(b.x + b.w / 2, b.y + b.h / 2);
  rotate(-0.08);
  imageMode(CENTER);
  image(art.photo, 0, 0, b.w, b.h);
  pop();
}

function mousePressed(event) {
  if (event.target.tagName !== "CANVAS") return;
  if (
    !solved &&
    mouseX > lampX - 42 &&
    mouseX < lampX + 42 &&
    mouseY > 558 &&
    mouseY < 725
  )
    draggingLamp = true;
}
function mouseReleased() {
  draggingLamp = false;
  if (moving === 0) setLampSound(false);
}

function collectPhoto() {
  if (!solved || photoCollected) return;
  photoCollected = true;
  updateControls();
  if (typeof parent.addItem === "function") parent.addItem(2);
  if (typeof parent.completePuzzle === "function")
    parent.completePuzzle("shadow-cage");
}

function playObjectSound(action) {
  const audio = document.getElementById("object-" + action + "-sound");
  audio.currentTime = 0;
  audio.play().catch((error) => {
    if (error.name !== "AbortError")
      console.warn("Object sound could not start:", error.message);
  });
}

function setLampSound(playing) {
  const audio = document.getElementById("lamp-drag-sound");
  if (playing && audio.paused) {
    audio.play().catch((error) => {
      if (error.name !== "AbortError")
        console.warn("Lamp sound could not start:", error.message);
    });
  } else if (!playing && !audio.paused) {
    audio.pause();
    audio.currentTime = 0;
  }
}
