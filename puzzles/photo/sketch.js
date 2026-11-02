let photoDragging = false;

function preload() {
  photoImage = loadImage("images/photo.png");
  boxfaceImage = loadImage("images/boxface.png");
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
  photoDragging = !hasPhoto && !solved && mouseOverPhoto();
  clickPhotoPuzzle();
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
