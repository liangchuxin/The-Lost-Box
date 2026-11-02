let hasPhoto = false;
let photoImage;
let boxfaceImage;
let photoSoln;
let solved = false;

let photo_x = 330;
let photo_y = 115;
const PHOTO_WIDTH = 210;
const PHOTO_HEIGHT = 291

function drawPhotoPuzzle() {
  image(boxfaceImage, 0, 0);
  displayLetters();
  if (!hasPhoto) {
    image(photoImage, photo_x, photo_y, PHOTO_WIDTH, PHOTO_HEIGHT);
  }
  if(solved == true){
    text('G H O S T', 225, 350)
  }
}

function dragPhotoPuzzle(){
    if(!hasPhoto && solved == false){
        photo_x += mouseX - pmouseX;
        photo_y += mouseY - pmouseY;
        keepInBounds();
        if(dist(photo_x, photo_y, 93, 98) < 5){
            solved = true;
        }
    }
}


function clickPhotoPuzzle() {
  if (!hasPhoto && mouseOverPhoto()) {
    //pickUpPhoto();
  }
}

function pickUpPhoto() {
  hasPhoto = true;
  if (typeof parent.addItem === "function") parent.addItem(2);
}

function mouseOverPhoto() {
  return (
    mouseX > photo_x && mouseX < photo_x + PHOTO_WIDTH &&
    mouseY > photo_y && mouseY < photo_y + PHOTO_HEIGHT
  );
}

function keepInBounds(){
    if (photo_x < 0){
        photo_x = 0;
    }
    else if(photo_x + PHOTO_WIDTH > width){
        photo_x = width - PHOTO_WIDTH;
    }

    if(photo_y < 0){
        photo_y = 0
    }
    else if(photo_y +PHOTO_HEIGHT > height){
        photo_y = height - PHOTO_HEIGHT
    }
}

let letterPositions = null;
let correctLetters = null;
const NUM_LETTERS = 50;

function displayLetters(){
    textSize(22)
    if (!letterPositions) {
        setupSoln();
        letterPositions = [];
        const MIN_DIST = 30;
        for (let i = 0; i < NUM_LETTERS; i++) {
            let x, y;
            do {
                x = random(width);
                y = random(height);
            } while (correctLetters.some(pos => dist(x, y, pos.x, pos.y) < MIN_DIST));
            letterPositions.push({
                x: x,
                y: y,
                letter: String.fromCharCode(65 + floor(random(26)))
            });
        }
    }

    for (const pos of letterPositions) {
        fill("#cfcfcf")
        text(pos.letter, pos.x, pos.y);
    }
    for (const pos of correctLetters) {
        fill('red')
        text(pos.letter, pos.x, pos.y);
    }
}

function setupSoln(){
    //fill('red')
    correctLetters = [];
    correctLetters.push({
        x: 140,
        y: 175,
        letter: "G"
    });
    correctLetters.push({
        x: 175,
        y: 155,
        letter: "H"
    });
    correctLetters.push({
        x: 160,
        y: 195,
        letter: "O"
    });
    correctLetters.push({
        x: 140,
        y: 225,
        letter: "S"
    });
    correctLetters.push({
        x: 180,
        y: 225,
        letter: "T"
    });
}
