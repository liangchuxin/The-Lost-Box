let currentPuzzle = "menu";
let selectedObjectId = null;
let ambientSound;
let treeStage = 0;

const slots = document.querySelectorAll(".slot");
const puzzleFrames = document.querySelectorAll("iframe");

function preload() {
  menuImage = loadImage("images/old_attic.jpeg");
  keyImage = loadImage("images/key.svg");
  treeImages = loadImage("images/tree_stages.png")
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

function removeInventoryItem(id) {
  for(let i = 0; i < slots.length; i++){
    if (Number(slots[i].dataset.itemId) === id) {
      slots[i].textContent = "";
      delete slots[i].dataset.itemId;
      slots[i].classList.remove("selected");
      slots[i].setAttribute("aria-label", "Item slot " + (i + 1));
      if (selectedObjectId === id) selectedObjectId = null;
    }
  }
}

function getSelectedItem() {
  return selectedObjectId;
}

function showHub() {
  for (const frame of puzzleFrames) {
    if (frame.hasAttribute("src")) frame.contentWindow.postMessage("pause-puzzle", location.origin);
    frame.hidden = true;
  }
  currentPuzzle = "home";

  let str = localStorage.getItem('collected_items')
  if(str == null){
      str = "[]";
  }
  const collected = JSON.parse(str);
  const buttons = document.querySelectorAll("#hub [data-puzzle]");
  for(let i = 0; i < buttons.length; i++){
    buttons[i].hidden = i != collected.length;
  }
  treeStage = collected.length;

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
  else {
    background("#c9b194");
    if (currentPuzzle === "home") drawTree();
  }
  pop();
}


const treeCrops = [
  [125, 261, 51, 45],
  [201, 220, 51, 86],
  [280, 185, 61, 121],
  [366, 132, 89, 173],
  [481, 83, 155, 222],
  [662, 54, 231, 251]
];

function drawTree() {
  let [sx, sy, sw, sh] = treeCrops[treeStage];
  let groundY = height / 2 + 150;
  push()
  fill('#34251f')
  ellipse(width / 2, groundY - sh/2, sw + 40, sh + 40);
  pop()
  image(treeImages, width / 2 - sw / 2, groundY - sh, sw, sh, sx, sy, sw, sh);
}

function canvasClicked() {
  if (currentPuzzle === "menu") clickMenu();
  else if (currentPuzzle === "key") clickKeyPuzzle();
}
