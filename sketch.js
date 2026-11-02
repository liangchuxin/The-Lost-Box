let currentPuzzle = "menu";
let selectedObjectId = null;
let ambientSound;

const slots = document.querySelectorAll(".slot");
const puzzleFrames = document.querySelectorAll("iframe");

function preload() {
  menuImage = loadImage("images/old_attic.jpeg");
  keyImage = loadImage("images/key.svg");
}

function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("scene");
  canvas.mousePressed(canvasClicked);
  ellipseMode(CENTER);
  textSize(30);
  textAlign(CENTER);

  ambientSound = new Audio("sounds/windy_ambience.mp3");
  ambientSound.loop = true;
  for (const slot of slots) {
    slot.addEventListener("click", () => selectObject(slot));
  }
  for (const button of document.querySelectorAll("[data-puzzle]")) {
    button.addEventListener("click", () => openPuzzle(button.dataset.puzzle));
  }
  document.getElementById("back").addEventListener("click", showHub);
  for (const frame of puzzleFrames) {
    frame.addEventListener("load", () => {
      if (frame.hidden) frame.contentWindow.postMessage("pause-puzzle", location.origin);
      else frame.focus();
    });
  }
}

function selectObject(slot) {
  for (const other of slots) other.classList.remove("selected");
  slot.classList.add("selected");
  selectedObjectId = null;
  if (slot.textContent.trim() !== "" && slot.dataset.itemId) {
    selectedObjectId = Number(slot.dataset.itemId);
  }
}

function addItem(id) {
  const item = items[id];
  if (!item) return;
  for (const slot of slots) {
    if (Number(slot.dataset.itemId) === id) return;
  }
  for (const slot of slots) {
    if (!slot.dataset.itemId) {
      slot.textContent = item.name;
      slot.dataset.itemId = id;
      slot.setAttribute("aria-label", item.name);
      return;
    }
  }
}

function showHub() {
  for (const frame of puzzleFrames) {
    if (frame.hasAttribute("src")) frame.contentWindow.postMessage("pause-puzzle", location.origin);
    frame.hidden = true;
  }
  currentPuzzle = "home";
  document.getElementById("puzzle-panel").hidden = true;
  document.getElementById("hub").hidden = false;
  loop();
}

function openPuzzle(id) {
  const frame = document.getElementById(id);
  currentPuzzle = id;
  document.getElementById("hub").hidden = true;
  document.getElementById("puzzle-panel").hidden = false;
  frame.hidden = false;
  if (!frame.hasAttribute("src")) frame.src = frame.dataset.src;
  else {
    frame.contentWindow.postMessage("resume-puzzle", location.origin);
    frame.focus();
  }
  noLoop();
}

function draw() {
  push();
  if (currentPuzzle === "menu") drawMenu();
  else if (currentPuzzle === "key") drawKeyPuzzle();
  else background("#c9b194");
  pop();
}

function canvasClicked() {
  if (currentPuzzle === "menu") clickMenu();
  else if (currentPuzzle === "key") clickKeyPuzzle();
}
