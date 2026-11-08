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

mykey = {
    x: 100,
    y: 100,
    img: "art",
    display: function(){
        if(!solved){
            image(this.img, this.x, this.y, 150, 165);
        }
    },
    mouseover: function(){
        if(mouseX > this.x -50 && mouseX < this.x +50 && mouseY > this.y - 55 && mouseY < this.y + 55){
            return true;
        }
        return false;
    }
}
solved = false;
handCollected = false;
particles = [];
//FOR TESTING
let showTool = true;
// let showTool = false;
async function setup(){
    createCanvas(640, 480).parent("scene");
    key_art = await loadImage('images/key.png');
    mykey.img = key_art
    hand_art = await loadImage('images/hand.svg');
    gear0_art = await loadImage('images/gear_0.png');
    gear1_art = await loadImage('images/gear_1.png');
    gear2_art = await loadImage('images/gear_2.png');
    gear3_art = await loadImage('images/gear_3.png');
    gear4_art = await loadImage('images/gear_4.png');
    let size = 150
    gear_0 = new Gear(width/2 - size, height/2, gear0_art);
    gear_1 = new Gear(width/2 - size/2, height/2 + size-20, gear1_art);
    gear_2 = new Gear(width/2, height/2, gear2_art);
    gear_3 = new Gear(width/2 + size/2, height/2 + size-20, gear3_art)
    gear_4 = new Gear(width/2 + size, height/2, gear4_art);
    gears = [gear_0, gear_1, gear_2, gear_3, gear_4]
    imageMode(CENTER);
}
function draw(){
    //background(127);
    background('#c9b194');
    for(gear of gears){
        gear.display();
    }
    if(showTool){
        mykey.display();
    }
    checkSolved();
    if(solved){
        for(let i = particles.length-1; i >= 0; i--){
            particles[i].display();
        }
        if(!handCollected){
            tint(255, 255)
            angleMode(DEGREES)
            push()
            imageMode(CENTER)
            translate(mykey.x, mykey.y)
            rotate(-20)
            image(hand_art, 0,0, 300, 300);
            pop()
        }
        else{
            home_button.display();
        }
    }
}

function mousePressed(){
    getInventoryItem();
    if(!handCollected && solved){
        collectHand();
    }
    if(handCollected){
        home_button.clickNext();
    }
}

function mouseDragged(){
    if(solved){
        return;
    }
    if(mykey.mouseover()){
        mykey.x = mouseX;
        mykey.y = mouseY;
        return;
    }
    for(gear of gears){
        if(dist(mouseX, mouseY, gear.x, gear.y) < gear.size/2){
            if(mouseY < gear.y){
                gear.angle += mouseX - pmouseX
            }
            else{
                gear.angle += pmouseX - mouseX;
            }
        }
    }
}

function getInventoryItem(){
    if (parent.getSelectedItem() === 1) {
        parent.removeInventoryItem(1);
        console.log("here");
        showTool= true;
    }
}

function collectHand(){
    let xmarg = 40;
    let ymarg = 150;
    if(mouseX > mykey.x -xmarg && mouseX < mykey.x + xmarg && mouseY > mykey.y - ymarg  && mouseY < mykey.y + ymarg ){
        handCollected = true;
        if (typeof parent.addItem === "function") parent.addItem(5);
        let str = localStorage.getItem('collected_items')
        if(str == null){
            str = "[]";
        }
        let collected_items = JSON.parse(str);
        collected_items.push(5);
        localStorage.setItem('collected_items', JSON.stringify(collected_items));
    }
}

function checkSolved(){
    let angle_2 = constrain(gear_2.angle%360, 0, 360)
    let angle_3 = constrain(gear_3.angle%360, 0, 360)
    let angle_4 = constrain(gear_4.angle%360, 0, 360)
    if (!((angle_2 > 356 || angle_2%360 < 5) && (angle_3%360 > 356 || angle_3%360 < 5) && (angle_4%360 > 356 || angle_4%360 < 5))){
        return
    }
    let idealx = 396;
    let idealy = 305;
    let wiggle = 3;

    if(!(mykey.x > idealx - wiggle && mykey.x < idealx + wiggle && mykey.y > idealy - wiggle && mykey.y < idealy + wiggle)){
        return
    }
    let wasSolved = solved;
    solved = true;
    if(!wasSolved){
        for(let i = 0; i < 200; i++){
            //leg1: x= random(mykey.x - 50, mykey + 50) y = random(mykey.y - 40, mykey.y - 50)
            let x = random(-50, 50)
            let y = random(-50, 50)
            newparticle = new Particle(mykey.x + x, mykey.y + y);
            particles.push(newparticle)
        }
    }
}


class Particle{
    constructor(x, y){
        this.x = x
        this.y = y
        this.alph = 255
        this.size = random(25, 75);
        this.to_x = this.x + 2*(this.x - mykey.x)
        this.to_y = this.y + 2*(this.y - mykey.y)
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
        ellipse(this.x, this.y, this.size, this.size)
    }
}

class Gear{
    constructor(x, y, img){
        this.x = x;
        this.y = y;
        this.img = img
        this.size = 150;
        this.angle = random(360)
    }
    display(){
        if(solved){
            tint(255, 128);
        }
        this.twist();
    }
    twist(){
        angleMode(DEGREES)
        push()
        imageMode(CENTER)
        translate(this.x, this.y)
        rotate(this.angle)
        image(this.img, 0, 0, this.size, this.size);
        pop()
        //this.angle += 1;
    }
}