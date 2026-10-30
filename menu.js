let menuImage;

const BEGIN_X = 320;
const BEGIN_Y = 360;
const BEGIN_RADIUS = 50;

function drawMenu() {
  image(menuImage, 0, 0, width, height);
  fill(mouseOverBegin() ? "#242a47" : "#244247");
  ellipse(BEGIN_X, BEGIN_Y, BEGIN_RADIUS * 2, BEGIN_RADIUS * 2);
  fill("#F7F5F2");
  text("Begin", BEGIN_X, BEGIN_Y + 10);
}

function clickMenu() {
  if (mouseOverBegin()) {
    startGame();
  }
}

async function startGame() {
  currentPuzzle = "key";
  if (typeof userStartAudio === "function") await userStartAudio();
  if (!ambientSound.isPlaying()) {
    ambientSound.start();
  }
}

function mouseOverBegin() {
  return dist(mouseX, mouseY, BEGIN_X, BEGIN_Y) < BEGIN_RADIUS;
}
