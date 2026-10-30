let currentPuzzle = "menu";
let selectedObjectId = null;
let ambientSound;

const slots = document.querySelectorAll(".slot");

async function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("scene");

  menuImage = await loadImage("images/old_attic.jpeg");
  keyImage = await loadImage("images/key.svg");
  ambientSound = await loadSound("sounds/windy_ambience.mp3");
  ambientSound.loop(true);

  ellipseMode(CENTER);
  textSize(30);
  textAlign(CENTER);
  canvas.mousePressed(canvasClicked);

  for (const slot of slots) {
    slot.addEventListener("click", () => {
      selectObject(slot);
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

function draw() {
  push();
  switch (currentPuzzle) {
    case "menu":
      drawMenu();
      break;
    case "key":
      drawKeyPuzzle();
      break;

    /*add future puzzles scenes
    case ...
    */
  }
  pop();
}

function canvasClicked() {
  switch (currentPuzzle) {
    case "menu":
      clickMenu();
      break;
    case "key":
      clickKeyPuzzle();
      break;

    /* future puzzle click interaction */
  }
}
