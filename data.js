// Optional sound plays when an item is collected or placed. Omit it for silence.
const items = {
  1: { id: 1, name: "Wrench", image: "puzzles/gears/images/key.png" },
  2: { id: 2, name: "Photo", image: "puzzles/photo/images/photo.png", sound: "sounds/paper.mp3" },
  3: { id: 3, name: "Cloth", image: "images/cloth.svg" },
  4: { id: 4, name: "Knife", image: "puzzles/glasses/images/knife.png" },
  5: { id: 5, name: "Scythe", image: "puzzles/gears/images/hand.svg" }
};

const puzzleMusic = {
  "shadow-cage": { sound: "sounds/lullaby.mp3", volume: 0.15 },
  "photo": { sound: "sounds/ghost-protocol.mp3", volume: 0.15 },
  "glasses": { sound: "sounds/dissection.mp3", volume: 0.6 },
  "fracture": { sound: "sounds/museum.mp3", volume: 0.1 },
  "gears": { sound: "sounds/5pm.mp3", volume: 0.1 },
  "flower-clock": { sound: "sounds/blossom-theme.mp3", volume: 0.15 }
};
