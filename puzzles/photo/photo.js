let hasCloth = false;
let photoImage;
let photoSoln;
let solved = false;
let particles = [];
let clothClicked = false;
let showTool = false;

let photo_x = 330;
let photo_y = 115;
const PHOTO_WIDTH = 210;
const PHOTO_HEIGHT = 291
let solve_x = 93;
let solve_y = 98;

home_button = {
    x: 640/2,
    y: 480/4,
    size: 100,
    mouseover: function(){
        if(dist(mouseX, mouseY, this.x, this.y) < this.size/2){
            return true;
        }
        return false;
    },
    display: function(){
        fill('#32965D');
        if(this.mouseover()) fill('#21633e');
        ellipse(this.x, this.y, this.size, this.size);
        fill(255);
        textSize(30);
        textAlign(CENTER, CENTER);
        text("next", this.x, this.y);
    },
    clickNext: function(){
        if(this.mouseover()){
            if (typeof parent.showHub === "function") parent.showHub();
        }
    }
}

function drawPhotoPuzzle() {
  background('#34251f')
  displayLetters();
  if (!hasCloth && showTool) {
    image(photoImage, photo_x, photo_y, PHOTO_WIDTH, PHOTO_HEIGHT);
  }
  if(hasCloth){
    home_button.display();
  }
  if(solved == true && !hasCloth){
    fill('red')
    for (const pos of correctLetters) {
        text(pos.letter, pos.x, pos.y);
    }
    text('G H O S T', 225, 350)
    if(clothClicked){
        clothTransformation();
        fill("#f2ebdeff")
        rect(photo_x, photo_y, PHOTO_WIDTH, PHOTO_HEIGHT);
    }
  }
}

function getInventoryItem(){
    if (parent.getSelectedItem() === 2) {
        parent.removeInventoryItem(2);
        showTool= true;
    }
}

function clothTransformation(){
    //on click
    //particle explosion, triangles
    for(let i=particles.length-1; i >=0; i--){
        particles[i].display();
    }
    //turns to white rectangle
    //another click and it goes in the inventory
    
}

function setupParticles(){
    for(let i=100; i >=0; i--){
        let new_particle = new Particle(random(photo_x, photo_x+PHOTO_WIDTH), random(photo_y, photo_y+PHOTO_HEIGHT) );
        particles.push(new_particle);
    }
}

class Particle{
    constructor(x, y){
        this.x = x
        this.y = y
        this.alph = 255
        this.size = random(25, 75);
        if(random([0, 1]) == 0){
            this.to_x = random(640);
            this.to_y = random([0, 480]);
        }
        else{
            this.to_y = random(480);
            this.to_x = random([0, 640]);
        }
    }
    display(){
        this.x = lerp(this.x, this.to_x, 0.05)
        this.y = lerp(this.y, this.to_y, 0.05)
        this.alph = lerp(this.alph, 0, 0.15)
        if(this.alph <= 5){
            particles.splice(particles.indexOf(this), 1)
        }
        noStroke();
        fill(255, 255, 255, this.alph);
        triangle(this.x - this.size/3, this.y + this.size/3, this.x, this.y - this.size/3, this.x + this.size/3, this.y + this.size/3)
    }
}

function dragPhotoPuzzle(){
    if(!hasCloth && solved == false){
        const prevX = photo_x;
        const prevY = photo_y;
        photo_x += mouseX - pmouseX;
        photo_y += mouseY - pmouseY;
        keepInBounds();
        const dx = photo_x - prevX;
        const dy = photo_y - prevY;

        for (const pos of letterLayers[0]) {
            pos.x += dx * 0.1;
            pos.y += dy * 0.1;
        }
        for (const pos of letterLayers[1]) {
            pos.x += dx * 0.05;
            pos.y += dy * 0.05;
        }
        solve_x += dx * 0.05;
        solve_y += dy * 0.05;
        for (const pos of letterLayers[2]) {
            pos.x += dx * 0.02;
            pos.y += dy * 0.02;
        }

        if(dist(photo_x, photo_y, solve_x, solve_y) < 5){
            solved = true;
        }
    }
}


// function dragPhotoPuzzle(){
//     if(!hasCloth && solved == false){
//         photo_x += mouseX - pmouseX;
//         photo_y += mouseY - pmouseY;
//         keepInBounds();
//         if(dist(photo_x, photo_y, 93, 98) < 5){
//             solved = true;
//         }
//         for (const pos of letterLayers[0]) {

//             pos.x += (mouseX - pmouseX) * 0.1;
//             pos.y += (mouseY - pmouseY)*0.1;
//             //text(pos.letter, pos.x, pos.y);
//         }
//         for (const pos of letterLayers[1]) {
//             pos.x += (mouseX - pmouseX) * 0.05;
//             pos.y += (mouseY - pmouseY)*0.05;
//             //text(pos.letter, pos.x, pos.y);
//         }
//         solve_x += (mouseX - pmouseX) * 0.05;
//         solve_y += (mouseY - pmouseY)*0.05;
//         for (const pos of letterLayers[2]) {
//             pos.x += (mouseX - pmouseX) * 0.02;
//             pos.y += (mouseY - pmouseY)*0.02;
//             //text(pos.letter, pos.x, pos.y);
//         }
//     }
// }


function clickPhotoPuzzle() {
    if(!hasCloth && solved && clothClicked && mouseOverPhoto()){
        pickUpPhoto();
    }
    if (!hasCloth && solved && !clothClicked && mouseOverPhoto()) {
        clothClicked = true;
        setupParticles();
    }
    if(hasCloth){
        home_button.clickNext();
    }
}

function pickUpPhoto() {
  hasCloth = true;
  if (typeof parent.addItem === "function") parent.addItem(3);
  let str = localStorage.getItem('collected_items')
  if(str == null){
    str = "[]";
  }
  let collected_items = JSON.parse(str);
  collected_items.push(3);
  localStorage.setItem('collected_items', JSON.stringify(collected_items));
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
let letterLayers = null;

function displayLetters(){
    if (!letterPositions) {
        setupSoln();
        letterPositions = [];
        letterLayers = [[],[],[]]
        for (const pos of correctLetters) {
        letterLayers[1].push(pos)
        text(pos.letter, pos.x, pos.y);
        }
        const MIN_DIST = 30;
        for (let i = 0; i < NUM_LETTERS; i++) {
            let x, y;
            do {
                x = random(width);
                y = random(height);
            } while (correctLetters.some(pos => dist(x, y, pos.x, pos.y) < MIN_DIST));
            letterLayers[i%3].push({
                x: x,
                y: y,
                letter: String.fromCharCode(65 + floor(random(26)))
            });
        }
    }
    fill("#C9B194")
    for (const pos of letterLayers[0]) {
        textSize(20)
        text(pos.letter, pos.x, pos.y);
    }
    for (const pos of letterLayers[1]) {
        textSize(22)
        text(pos.letter, pos.x, pos.y);
    }
    for (const pos of letterLayers[2]) {
        textSize(24)
        text(pos.letter, pos.x, pos.y);
    }
    // for (const pos of correctLetters) {
    //     letterLayers[1].push(pos)
    //     text(pos.letter, pos.x, pos.y);
    // }
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
