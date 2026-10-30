let hasKey = false;
let keyImage;

const KEY_X = 200;
const KEY_Y = 150;
const KEY_SIZE = 90;

function drawKeyPuzzle() {
  background(255);
  if (!hasKey) {
    image(keyImage, KEY_X, KEY_Y, KEY_SIZE, KEY_SIZE);
  }
}

function clickKeyPuzzle() {
  if (!hasKey && mouseOverKey()) {
    pickUpKey();
  }
}

function pickUpKey() {
  hasKey = true;
  const item = items[1];
  slots[0].textContent = item.name;
  slots[0].dataset.itemId = item.id;
  slots[0].setAttribute("aria-label", item.name);
}

function mouseOverKey() {
  return (
    mouseX > KEY_X && mouseX < KEY_X + KEY_SIZE &&
    mouseY > KEY_Y && mouseY < KEY_Y + KEY_SIZE
  );
}
