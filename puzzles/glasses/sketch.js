let drops_left = [];
let drops_right = [];
let currpsswd = [0, 0, 0, 0]
let psswd = [0, 2, 1, 4];
let solved = false;
let knifeCollected = false;
let showTool = false;

async function setup() {
  createCanvas(640, 480).parent("scene");
  knife_art = await loadImage('images/knife.png')
  dirtBuffer = createGraphics(640, 480);
  textAlign(CENTER);
  textSize(30);
  ellipseMode(CENTER);
  rightLens = new Lens(width/4, height/2);
  leftLens = new Lens(3*width/4, height/2);
  code0 = new Code(width/4-50, height/2-20, psswd[0]);
  code1 = new Code(width/4 + 40, height/2+40, psswd[1]);
  code2 = new Code(3*width/4 -40, height/2 + 60, psswd[2]);
  code3 = new Code(3*width/4 + 20, height/2-40, psswd[3]);
  for(let i =0; i < 3000; i++){
    let newdropRight = new Drop(width/4, height/2, rightLens)
    drops_right.push(newdropRight)
    let newdropLeft = new Drop(3*width/4, height/2, leftLens);
    drops_left.push(newdropLeft);
  }
  //imageMode(CENTER)
}

function draw(){
    if(!solved && psswd.join('') == currpsswd.join('')) {
        solved = true;
        document.getElementById("match-sound").play().catch(error => {
            console.warn("Match sound could not start:", error.message);
        });
    }
    background('#d9cec0');
    strokeWeight(5);
    rightLens.display();
    leftLens.display();
    drawGlasses();
    strokeWeight(1);
    codeManager();
    fill(0);
    displayPassword();
    if(solved){
        if(!knifeCollected){
            image(knife_art, 40, height/2 - 20, 245)
        }
        if(frameCount % 10 == 0){
            if(drops_left.length < 100){
                drops_left.splice(0, 5);
                drops_right.splice(0, 5);
            }
            else if(drops_left.length < 300){
                drops_left.splice(0, 10);
                drops_right.splice(0, 10);
            }
            else{
                drops_left.splice(0, 50);
                drops_right.splice(0, 50);
            }
        }
    }
    for(let i=0; i < drops_right.length; i++){
        drops_right[i].display();
        drops_left[i].display();
    }
}

function mousePressed(){
    getInventoryItem();
    if(!solved){
        clickPassword();
    }
    if(!knifeCollected && solved){
        collectKnife();
    }
}

function getInventoryItem(){
    if (parent.getSelectedItem() === 3) {
        parent.removeInventoryItem(3);
        showTool= true;
    }
}

function collectKnife(){
    if(mouseX > 40 && mouseX < 40+245 && mouseY > height/2 - 20 && mouseY < height/2 - 20 + 42){
        knifeCollected = true;
        document.getElementById("knife-pickup-sound").play().catch(error => {
            console.warn("Knife sound could not start:", error.message);
        });
        if (typeof parent.addItem === "function") parent.addItem(4);
        if (typeof parent.completePuzzle === "function") parent.completePuzzle("glasses");
    }
}

function codeManager(){
    if(solved){
        return;
    }
    //adding random numbers so they don't all just sync up
    if(frameCount % (code0.maxCounter*2 + 100) == 0){
        code0.counter = 0;
    }
    if(frameCount % (code1.maxCounter*2 + 207) == 0){
        code1.counter = 0;
    }
    if(frameCount % (code2.maxCounter*2 + 100) == 0){
        code2.counter = 0;
    }
    if(frameCount % (code3.maxCounter*2 + 207) == 0){
        code3.counter = 0;
    }
    code0.display();
    code1.display();
    code2.display();
    code3.display();
}

function displayPassword(){
    let margin = 20;
    //password entry
    fill(0)
    if(solved) fill('green');
    text(currpsswd[0], width/2-margin - 40, 3*height/4 + margin + 30)
    text(currpsswd[1], width/2-margin, 3*height/4 + margin + 30)
    text(currpsswd[2], width/2+margin, 3*height/4 + margin + 30)
    text(currpsswd[3], width/2+margin + 40, 3*height/4 + margin + 30)
    fill(0)
    if(solved) noFill(); noStroke();
    //top arrows
    triangle(width/2-margin-10, 3*height/4 + margin, width/2-margin, 3*height/4,width/2-margin+10, 3*height/4 + margin)
    triangle(width/2+margin-10, 3*height/4 + margin, width/2+margin, 3*height/4,width/2+margin+10, 3*height/4 + margin)
    triangle(width/2+margin+30, 3*height/4 + margin, width/2+margin + 40, 3*height/4,width/2+margin+50, 3*height/4 + margin)
    triangle(width/2-margin-30, 3*height/4 + margin, width/2-margin - 40, 3*height/4,width/2-margin-50, 3*height/4 + margin)
    //bottom arrows
    triangle(width/2-margin-10, 3*height/4 + margin + 40, width/2-margin, 3*height/4 + margin + 60,width/2-margin+10, 3*height/4 + margin + 40)
    triangle(width/2+margin-10, 3*height/4 + margin + 40, width/2+margin, 3*height/4 + margin + 60,width/2+margin+10, 3*height/4 + margin + 40)
    triangle(width/2+margin+30, 3*height/4 + margin + 40, width/2+margin + 40, 3*height/4 + margin + 60,width/2+margin+50, 3*height/4 + margin + 40)
    triangle(width/2-margin-30, 3*height/4 + margin + 40, width/2-margin - 40, 3*height/4 + margin + 60,width/2-margin-50, 3*height/4 + margin + 40)
}

function clickPassword(){
    const previousPassword = currpsswd.join('');
    let margin = 20;
    //pos 0 up
    if(dist(mouseX, mouseY, width/2 - margin - 40, 3*height/4 + 2*margin/3) < 15){
        currpsswd[0]++;
        if(currpsswd[0] == 10) currpsswd[0] = 0;
    }
    //pos 1 up
    if(dist(mouseX, mouseY, width/2 - margin, 3*height/4 + 2*margin/3) < 15){
        currpsswd[1]++;
        if(currpsswd[1] == 10) currpsswd[1] = 0;
    }
    //pos 2 up
    if(dist(mouseX, mouseY, width/2 + margin, 3*height/4 + 2*margin/3) < 15){
        currpsswd[2]++;
        if(currpsswd[2] == 10) currpsswd[2] = 0;
    }
    //pos 3 up
    if(dist(mouseX, mouseY, width/2 + margin + 40, 3*height/4 + 2*margin/3) < 15){
        currpsswd[3]++;
        if(currpsswd[3] == 10) currpsswd[3] = 0;
    }

    //pos 0 down
    if(dist(mouseX, mouseY, width/2 - margin - 40, 3*height/4 + margin + 40 + margin/3) < 15){
        currpsswd[0]--;
        if(currpsswd[0] == -1) currpsswd[0] = 9;
    }
    //pos 1 down
    if(dist(mouseX, mouseY, width/2 - margin, 3*height/4 + margin + 40 + margin/3) < 15){
        currpsswd[1]--;
        if(currpsswd[1] == -1) currpsswd[1] = 9;
    }
    //pos 2 down
    if(dist(mouseX, mouseY, width/2 + margin, 3*height/4 + margin + 40 + margin/3) < 15){
        currpsswd[2]--;
        if(currpsswd[2] == -1) currpsswd[2] = 9;
    }
    //pos 3 down
    if(dist(mouseX, mouseY, width/2 + margin + 40, 3*height/4 + margin + 40 + margin/3) < 15){
        currpsswd[3]--;
        if(currpsswd[3] == -1) currpsswd[3] = 9;
    }
    if (currpsswd.join('') !== previousPassword) {
        const sound = document.getElementById("adjust-sound");
        sound.volume = 0.1;
        sound.currentTime = 0;
        sound.play().catch(error => {
            if (error.name !== "AbortError") console.warn("Adjustment sound could not start:", error.message);
        });
    }
}

class Code{
    constructor(x, y, ch){
        this.x = x;
        this.y = y;
        this.ch = ch;

        this.maxCounter = 180;
        this.counter = -1;
        this.fadeSpeed = 1;
    }
    display(){
        if(this.counter == -1){
            this.fadeSpeed =1;
            return;
        }
        let alph = map(this.counter, this.maxCounter, 0, 255, 0);
        noStroke();
        fill(0, 0, 0, alph);
        text(this.ch, this.x, this.y);
        this.counter += this.fadeSpeed;
        if(this.counter == this.maxCounter) this.fadeSpeed *= -1;
    }
}

class Lens{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = 250;
        this.height = 150;
    }

    display(){
        noFill();
        stroke('black');
        ellipse(this.x, this.y, this.width, this.height);
    }
}

function drawGlasses(){
    line(rightLens.x-rightLens.width/2, rightLens.y, 0, rightLens.y - 20);
    line(leftLens.x+leftLens.width/2, leftLens.y, width, leftLens.y - 20);
    let x1 = rightLens.x + rightLens.width/2;
    let y1 = rightLens.y;
    let x2 = leftLens.x - leftLens.width/2;
    let y2 = leftLens.y;
    let curveHeight = 30;
    bezier(x1, y1, x1 + (x2 - x1)/3, y1 - curveHeight, x1 + 2*(x2 - x1)/3, y2 - curveHeight, x2, y2);
}

class Drop{
    constructor(x, y, lens){
        this.x = x;
        this.y = y;
        this.lens = lens;
        this.size = 10;
        this.offset = random(2000);
        this.countBounce = 0;
        this.countRun = 0;
    }
    display(){
        noStroke();
        fill("#BF4342");
        this.move();
        this.constrain();
        ellipse(this.x, this.y, this.size, this.size);
    }
    move(){
        if(this.isTouching()) this.countBounce = 60;
        let rad = 20;
        if(!showTool) rad = 0
        if(dist(this.x, this.y, mouseX, mouseY)<rad) this.countRun = 60;
        let xmove = map(noise(this.offset), 0, 1, -2, 2)
        let ymove = map(noise(this.offset+10), 0, 1, -2, 2)
        this.offset += 0.01;
        if(this.countBounce > 0){
            this.countBounce--;
            xmove *= -1
            ymove *= -1
        }
        if(this.countRun > 0){
            this.countRun--;
            mouseX < this.x ? xmove = 1 : xmove = -1
            mouseY < this.y ? ymove = 1 : ymove = -1
            // xmove *=2
            // ymove *=2
        }
        this.x += xmove;
        this.y += ymove;
    }
    edgeValue() {
        let r = this.size / 2;
        let a = this.lens.width / 2 - r;
        let b = this.lens.height / 2 - r;
        let dx = this.x - this.lens.x;
        let dy = this.y - this.lens.y;
        return (dx * dx) / (a * a) + (dy * dy) / (b * b);
    }
    isTouching() {
        return this.edgeValue() >= 1;
    }
    constrain() {
        let v = this.edgeValue();
        if (v > 1) {
            let k = 1 / sqrt(v);
            this.x = this.lens.x + (this.x - this.lens.x) * k;
            this.y = this.lens.y + (this.y - this.lens.y) * k;
        }
    }

}