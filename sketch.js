let currentPuzzle = "menu";
let selectedObjectId = null;
let homeAudio = [];
const itemSounds = {};
const inventoryPickupSound = new Audio("sounds/object-pickup.mp3");
const puzzleAudio = {};
let completedPuzzles = [];
let inventory = [];
const SAVE_KEY = "lost-box-progress";
const slots = document.querySelectorAll("#inventory .slot");
const puzzleFrames = document.querySelectorAll("iframe");

function preload() {
  menuImage = loadImage("images/old_attic.jpeg");
  keyImage = loadImage("images/key.svg");
}

function setup() {
  const canvas = createCanvas(960, 720);
  canvas.parent("scene");
  canvas.mousePressed(canvasClicked);
  ellipseMode(CENTER);
  textSize(30);
  textAlign(CENTER);
  homeAudio = [new Audio("sounds/windy_ambience.mp3"), new Audio("sounds/attic-music.mp3")];
  homeAudio[0].volume = 0.12;
  homeAudio[1].volume = 0.35;
  for (const sound of homeAudio) sound.loop = true;
  for (const item of Object.values(items)) {
    if (!item.sound) continue;
    const audio = document.createElement("audio");
    audio.src = new URL(item.sound, document.baseURI).href;
    audio.preload = "auto";
    audio.dataset.itemId = item.id;
    document.body.appendChild(audio);
    itemSounds[item.id] = audio;
  }
  for (const [id, track] of Object.entries(puzzleMusic)) {
    const audio = new Audio(track.sound);
    audio.loop = true;
    audio.volume = track.volume;
    puzzleAudio[id] = audio;
  }
  createRoomObjects();
  loadProgress();
  updateAudioCredits();
  renderInventory();
  for (const slot of slots) slot.onclick = () => selectObject(slot);
  document.getElementById("begin").onclick = startGame;
  document.getElementById("reset-game").onclick = resetGame;
  document.getElementById("back").onclick = showHub;
  document.getElementById("return-room").onclick = showHub;
  for (const frame of puzzleFrames) {
    frame.addEventListener("load", () => {
      if (frame.hidden) frame.contentWindow.postMessage("pause-puzzle", location.origin);
      else frame.focus();
    });
  }
  noLoop();
}

// Save at completed-puzzle checkpoints. Reloading restarts the unfinished
// puzzle with its entry tools, even if it had already taken a tool out.
function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved && Array.isArray(saved.completed)) {
      for (const object of roomObjects) {
        if (!saved.completed.includes(object.id)) break;
        completedPuzzles.push(object.id);
      }
      inventory = Array.isArray(saved.inventory) ? saved.inventory.filter(id => items[id]) : [];
    } else {
      const collected = JSON.parse(localStorage.getItem("collected_items") || "[]");
      for (const object of roomObjects) {
        if (!object.reward || !Array.isArray(collected) || !collected.includes(object.reward)) break;
        completedPuzzles.push(object.id);
      }
      if (completedPuzzles.length === 5 && localStorage.getItem("completed_game") === "true") {
        completedPuzzles.push("flower-clock");
      }
    }
  } catch (error) {
    completedPuzzles = [];
    inventory = [];
  }
  const count = completedPuzzles.length;
  if (count > 0 && count < roomObjects.length) {
    const requiredItem = roomObjects[count - 1].reward;
    if (!inventory.includes(requiredItem)) inventory.push(requiredItem);
  }
  saveProgress();
}

function saveProgress() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ completed: completedPuzzles, inventory }));
}

function renderInventory() {
  for (let i = 0; i < slots.length; i++) {
    const id = inventory[i];
    const item = items[id];
    const slot = slots[i];
    slot.replaceChildren();
    if (item) {
      slot.dataset.itemId = id;
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = "";
      image.draggable = false;
      const tooltip = document.createElement("span");
      tooltip.className = "item-tooltip";
      tooltip.textContent = item.name;
      slot.append(image, tooltip);
    } else {
      delete slot.dataset.itemId;
    }
    slot.classList.toggle("selected", id === selectedObjectId);
    slot.setAttribute("aria-label", item ? item.name : "Item slot " + (i + 1));
  }
}

function resetGame() {
  // Clear only this game's saves and unload each puzzle's in-memory state.
  for (const frame of puzzleFrames) {
    if (frame.hasAttribute("src")) frame.contentWindow.postMessage("pause-puzzle", location.origin);
    frame.hidden = true;
    frame.removeAttribute("src");
  }
  completedPuzzles = [];
  inventory = [];
  selectedObjectId = null;
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem("collected_items");
  localStorage.removeItem("completed_game");
  saveProgress();
  renderInventory();
  startGame();
}

function selectObject(slot) {
  selectedObjectId = slot.dataset.itemId ? Number(slot.dataset.itemId) : null;
  if (items[selectedObjectId]) {
    inventoryPickupSound.currentTime = 0;
    inventoryPickupSound.play().catch(error => {
      if (error.name !== "AbortError") console.warn("Inventory sound could not start:", error.message);
    });
  }
  renderInventory();
}

function addItem(id) {
  if (!items[id] || inventory.includes(id)) return;
  inventory.push(id);
  renderInventory();
  playItemSound(id);
}

function removeInventoryItem(id) {
  if (!inventory.includes(id)) return;
  inventory = inventory.filter(itemId => itemId !== id);
  if (selectedObjectId === id) selectedObjectId = null;
  renderInventory();
  playItemSound(id);
}

function playItemSound(id) {
  const audio = itemSounds[id];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(error => {
    if (error.name !== "AbortError") console.warn("Item sound could not start:", error.message);
  });
}

function getSelectedItem() {
  return selectedObjectId;
}

function completePuzzle(id) {
  const next = roomObjects[completedPuzzles.length];
  if (!next || next.id !== id || currentPuzzle !== id) return;
  completedPuzzles.push(id);
  saveProgress();
  updateAudioCredits();
  document.getElementById("back").hidden = true;
  document.getElementById("return-room").hidden = false;
}

function showHub() {
  for (const frame of puzzleFrames) {
    if (frame.hasAttribute("src")) frame.contentWindow.postMessage("pause-puzzle", location.origin);
    frame.hidden = true;
  }
  currentPuzzle = "home";
  setPuzzleAudio(completedPuzzles.length === roomObjects.length ? "flower-clock" : null);
  setHomeAudio(true);
  document.getElementById("reset-controls").hidden = true;
  document.getElementById("begin").hidden = true;
  document.getElementById("puzzle-panel").hidden = true;
  document.getElementById("return-room").hidden = true;
  document.getElementById("hub").hidden = false;
  const buttons = document.querySelectorAll("#hub [data-puzzle]");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].hidden = i > completedPuzzles.length;
    buttons[i].disabled = i < completedPuzzles.length;
    buttons[i].setAttribute("aria-label", roomObjects[i].name + (buttons[i].disabled ? " (completed)" : ""));
  }
  updateEndingFlowers();
  updateAudioCredits();
  document.getElementById("ending").hidden = completedPuzzles.length !== roomObjects.length;
  redraw();
}

function openPuzzle(id) {
  const next = roomObjects[completedPuzzles.length];
  if (!next || next.id !== id) return;
  const frame = document.getElementById(id);
  currentPuzzle = id;
  setHomeAudio(false);
  setPuzzleAudio(id);
  document.getElementById("reset-controls").hidden = true;
  document.getElementById("hub").hidden = true;
  document.getElementById("puzzle-panel").hidden = false;
  document.getElementById("back").hidden = id === "shadow-cage";
  document.getElementById("return-room").hidden = true;
  frame.hidden = false;
  if (!frame.hasAttribute("src")) frame.src = frame.dataset.src;
  else {
    frame.contentWindow.postMessage("resume-puzzle", location.origin);
    frame.focus();
  }
  noLoop();
}

function draw() {
  if (currentPuzzle === "key") drawKeyPuzzle();
  else drawMenu();
}

function canvasClicked() {
  if (currentPuzzle === "key") clickKeyPuzzle();
}

function updateAudioCredits() {
  document.getElementById("audio-credits").hidden = completedPuzzles.length !== roomObjects.length;
}
