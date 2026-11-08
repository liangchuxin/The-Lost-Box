let photoDragging = false;

function preload() {
  photoImage = loadImage("images/photo.png");
}

function setup() {
  createCanvas(640, 480).parent("scene");
  textAlign(CENTER);
  textSize(30);
}

function draw() {
  background("#c9b194");
  drawPhotoPuzzle();
}

function mousePressed() {
  photoDragging = !hasCloth && !solved && mouseOverPhoto();
  clickPhotoPuzzle();
  getInventoryItem();
}

function mouseDragged() {
  if (photoDragging) {
    dragPhotoPuzzle();
    return false;
  }
}

function mouseReleased() {
  photoDragging = false;
}
