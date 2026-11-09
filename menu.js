let menuImage;

// Positions are percentages of the attic image, so objects scale with the room.
const roomObjects = [
  { id: "shadow-cage", name: "Oil lamp", file: "lantern.png", x: 58.9, y: 34.3, w: 2.7, h: 8.5, crop: [378,174,259,610], size: [1024,1024], reward: 2 },
  { id: "photo", name: "Photo frame", file: "photoframe.png", x: 11.3, y: 45, w: 8, h: 7.15, crop: [0,0,249,167], size: [249,167], reward: 3 },
  { id: "glasses", name: "Glasses", file: "glasses.png", x: 48, y: 41.1, w: 3.4, h: 2.74, crop: [0,0,459,277], size: [459,277], reward: 4 },
  { id: "fracture", name: "Wallet", file: "wallet.png", x: 47, y: 60.7, w: 4.2, h: 3.24, crop: [0,0,126,73], size: [126,73], reward: 1 },
  { id: "gears", name: "Wall clock", file: "clock.png", x: 80.2, y: 25.2, w: 11.8, h: 24.8, crop: [204,181,489,775], size: [896,1216], reward: 5 },
  { id: "flower-clock", name: "Flower pot", file: "pot.png", x: 43.8, y: 67.4, w: 6.5, h: 9, crop: [300,293,426,443], size: [1024,1024] }
];

function createRoomObjects() {
  const hub = document.getElementById("hub");
  for (const object of roomObjects) {
    const button = document.createElement("button");
    button.className = "room-object";
    button.dataset.puzzle = object.id;
    button.setAttribute("aria-label", object.name);
    button.style.cssText = `left:${object.x}%;top:${object.y}%;width:${object.w}%;height:${object.h}%`;
    button.innerHTML = `<svg viewBox="${object.crop.join(" ")}" aria-hidden="true"><image href="images/hub/${object.file}" width="${object.size[0]}" height="${object.size[1]}" /></svg>`;
    button.onclick = () => openPuzzle(object.id);
    hub.appendChild(button);
  }
}

function drawMenu() {
  image(menuImage, 0, 0, width, height);
}

function startGame() {
  showHub();
}

// Wind plays in the attic; its music plays only before the first completed puzzle.
function setHomeAudio(playing) {
  for (const [index, sound] of homeAudio.entries()) {
    if (playing && completedPuzzles.length < roomObjects.length && (index === 0 || completedPuzzles.length === 0)) {
      sound.play().catch(error => {
        if (error.name !== "AbortError") console.warn("Home audio could not start:", error.message);
      });
    } else {
      sound.pause();
    }
  }
}

function setPuzzleAudio(activeId) {
  for (const [id, audio] of Object.entries(puzzleAudio)) {
    if (id === activeId) {
      audio.play().catch(error => {
        if (error.name !== "AbortError") console.warn("Puzzle music could not start:", error.message);
      });
    } else {
      audio.pause();
    }
  }
}

function updateEndingFlowers() {
  const pot = document.querySelector('[data-puzzle="flower-clock"] svg');
  const finished = completedPuzzles.length === roomObjects.length;
  // Match the pot body, allowing the bouquet to extend above and to its sides.
  pot.setAttribute("viewBox", finished ? "334 555 356 370" : "300 293 426 443");
  pot.style.overflow = finished ? "visible" : "hidden";
  pot.querySelector("image").setAttribute("href", finished ? "images/hub/blooming-pot.png" : "images/hub/pot.png");
}
