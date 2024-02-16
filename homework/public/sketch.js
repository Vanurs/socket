/*
modified from the original web socket remote painter code
modified from the Daniel Shiffman's matter.js tutorial
edited by Xintong Li
*/

/*remote 2D physical dropper with customized emoji specific to each user
support customizable color and size of the 2D physical shapes
Gyro supported when open website on iPhone
*/
//only show other people's drawing
//*** https://carpal-deluxe-attraction.glitch.me*/






//create markov
let displayText = "Don't show this boring sentence, click to generate some text instead!";
let generateLetter = false;

//data structure
let lines = []; // for cut up generator
let words = [];
let wordToPlay;
let dWords = [];
let uLetter;
let fontSize;

let uID;


// Create connection to Node.JS Server
const socket = io();
let clientCount = 0;

let rSlider, gSlider, bSlider, colorSwatch, sizeSlider;
let r = 255;
let g = 0;
let b = 100;
let bSize = 1;

let canvas;
let gui;
let drawIsOn = false;

let recievedMouseX = 0;
let recievedMouseY = 0;

let button;

//orientation
//global variables
let askButton;

// device motion
let accX = 0;
let accY = 0;
let accZ = 0;
let rrateX = 0;
let rrateY = 0;
let rrateZ = 0;

// device orientation
let rotateDegrees = 0;
let frontToBack = 0;
let leftToRight = 0;

//----------------------------------------------------------
const { Engine, World, Bodies, Composite, Svg } = Matter;

let engine;
let world;
let boxes = [];
let ground;
//----------------------------------------------------------
//emoji data
let data;
let emojis = [];
let peopleEmoji = [];

function preload() {
  //loadStrings() breaks your text on new line character
  lines = loadStrings("words.txt");
  //load JSON
  data = loadJSON("emojis.json");
  console.log("preload");
}

function setup() {}

  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-container");
  canvas.mousePressed(canvasMousePressed);
  canvas.touchStarted(canvasTouchStarted);



  gui = select("#gui-container");
  gui.addClass("open");//forcing it open at the start, remove if you want it closed

  colorSwatch = createDiv("");
  colorSwatch.parent(gui);
  colorSwatch.addClass("color-swatch");

  rSlider = createSlider(0, 255, r);
  rSlider.parent(gui);
  rSlider.addClass("slider");
  gSlider = createSlider(0, 255, g);
  gSlider.parent(gui);
  gSlider.addClass("slider");
  bSlider = createSlider(0, 255, b);
  bSlider.parent(gui);
  bSlider.addClass("slider");
  sizeSlider = createSlider(0.3, 5, bSize);
  sizeSlider.parent(gui);
  sizeSlider.addClass("slider");


  rSlider.input(handleSliderInputChange);
  gSlider.input(handleSliderInputChange);
  bSlider.input(handleSliderInputChange);
  sizeSlider.input(handleSliderInputChange);

  //call this once at start so the color matches our mapping to slider width
  handleSliderInputChange();

  button = createButton(">");
  button.addClass("button");

  //Add the play button to the parent gui HTML element
  button.parent(gui);

  //Adding a mouse pressed event listener to the button 
  button.mousePressed(handleButtonPress);
  rectMode(CENTER);
  angleMode(DEGREES);

  //----------
  //the bit between the two comment lines could be move to a three.js sketch except you'd need to create a button there
  if (typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+
    askButton = createButton('Permission');//p5 create button
    askButton.mousePressed(handlePermissionButtonPressed);//p5 listen to mousePressed event
  } else {
    //if there is a device that doesn't require permission
    window.addEventListener('devicemotion', deviceMotionHandler, true);
    window.addEventListener('deviceorientation', deviceTurnedHandler, true)
  }
  //------------------------------engine--------------------
  // create an engine
  engine = Engine.create();
  world = engine.world;
  // Engine.run is deprecated
  ground = new Boundary(0, windowHeight, windowWidth, 50);
  wallA = new Boundary(0, 0, 50, windowHeight);
  wallB = new Boundary(windowWidth, windowHeight, 50, windowHeight);
  Composite.add(world, ground, wallA, wallB);

  //--------------------------------------------------------------
  console.log("setup", data);
  emojis = data.emojis;
  //--------------------------------------------------------------
  
  noStroke();

  fontSize = map(displayText.length, 0, 200, 30, 20, true);
  textSize(fontSize);
  textWrap(WORD);
  textAlign(CENTER);

  pushPEmoji("People-Body");
  uletter = peopleEmoji[int(random(peopleEmoji.length))].Representation;

}

function draw() {
  background(255, 60);
  let totalMovement = Math.abs(accX)+Math.abs(accY)+Math.abs(accZ);//movement in any direction
  //set your own threshold for how sensitive you want this to be
  if(totalMovement > 2){
     background(255,0,0);
  }else{
     background(255);
  }
  //----------------------------------------------------engine--------------------------
  Engine.update(engine);
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].show();
  }
  ground.show();
  wallA.show();
  wallB.show();
 // Box.applyForce(boxes, {x:boxes.x, y:boxes.y}, {x:accX, y:accY});


  //-------------------------------------------------------

  //Creating a tilt sensor mechanic that has a sort of boolean logic (on or off)
  //if the phone is rotated front/back/left/right we will get an arrow point in that direction 
  push();
  translate(width / 2, height / 2);

  if (frontToBack > 40) {
    push();
    rotate(-180);
    triangle(-30, -40, 0, -100, 30, -40);
    pop();
  } else if (frontToBack < 0) {
    push();
    triangle(-30, -40, 0, -100, 30, -40);
    pop();
  }

  if (leftToRight > 20) {
    push();
    rotate(90);
    triangle(-30, -40, 0, -100, 30, -40);
    pop();
  } else if (leftToRight < -20) {
    push();
    rotate(-90);
    triangle(-30, -40, 0, -100, 30, -40);
    pop();
  }
  pop();

  //-------------------------------------------acceleration-------------------------------------------

  engine.world.gravity.y += frontToBack;
  //---------------------------------------------
  if (drawIsOn) {
    fill(r, g, b);

    text(uletter, mouseX, mouseY, 400);

  }
  
  console.log(boxes.length);

}

//we only want to draw if the click is on the canvas not on our GUI
function canvasMousePressed() {
  drawIsOn = true;
  
  //don't emit if we aren't drawing on the canvas
  if (!drawIsOn) {
    return;
  }

  socket.emit("drawing", {
    xpos: mouseX / width,
    ypos: mouseY / height,
    userR: r,
    userG: g,
    userB: b,
    letter: uletter,
    // userS: bSize / width //scaling brush size to user window
    userS: bSize,

  });

}

function mouseReleased() {
  drawIsOn = false;
}

function mouseDragged() {

  //don't emit if we aren't drawing on the canvas
  if (!drawIsOn) {
    return;
  }

  socket.emit("drawing", {
    xpos: mouseX / width,
    ypos: mouseY / height,
    userR: r,
    userG: g,
    userB: b,
    letter: uletter,
    userS: bSize,

  });

}

//make it work on mobile
function canvasTouchStarted() {
  drawIsOn = true;
}

function touchEnded() {
  drawIsOn = false;
}

function touchMoved() {
  if (!drawIsOn) {
    return;
  }

  //user data

  socket.emit("drawing", {
    xpos: mouseX / width,
    ypos: mouseY / height,
    userR: r,
    userG: g,
    userB: b,
    letter: uletter,
    userS: bSize
  });

}


function onDrawingEvent(data) {
  let c = color(data.userR, data.userG, data.userB);
  boxes.push(new Box(mouseX, mouseY, random(50, 200), random(50, 200), data.letter, c, data.userS, accX, accY));
 
}


function handleButtonPress() {
  gui.toggleClass("open");
}

function handleSliderInputChange() {
  r = map(rSlider.value(), 0, rSlider.width, 0, 255);
  g = map(gSlider.value(), 0, gSlider.width, 0, 255);
  b = map(bSlider.value(), 0, bSlider.width, 0, 255);
  bSize = sizeSlider.value();

  colorSwatch.style("background-color", "rgb(" + r + "," + g + "," + b + ")");
}

function handlePermissionButtonPressed() {

  DeviceMotionEvent.requestPermission()
    .then(response => {
      // alert(response);//quick way to debug response result on mobile, you get a mini pop-up
      if (response === 'granted') {
        window.addEventListener('devicemotion', deviceMotionHandler, true);
      }
    });

  DeviceOrientationEvent.requestPermission()
    .then(response => {
      if (response === 'granted') {
        // alert(response);//quick way to debug response result on mobile, you get a mini pop-up
        window.addEventListener('deviceorientation', deviceTurnedHandler, true)
      }
    })
    .catch(console.error);
}

function deviceMotionHandler(event) {

  accX = event.acceleration.x;
  accY = event.acceleration.y;
  accZ = event.acceleration.z;

  rrateZ = event.rotationRate.alpha;//alpha: rotation around z-axis
  rrateX = event.rotationRate.beta;//rotating about its X axis; that is, front to back
  rrateY = event.rotationRate.gamma;//rotating about its Y axis: left to right

}

//https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event
function deviceTurnedHandler(event) {

  //degrees 0 - 365
  rotateDegrees = event.alpha; // alpha: rotation around z-axis
  frontToBack = event.beta; // beta: front back motion
  leftToRight = event.gamma; // gamma: left to right

}

//Events we are listening for
function windowResized() {

  //wipes out the history of drawing if resized, potential fix, draw to offscreen buffer
  //https://p5js.org/reference/#/p5/createGraphics
  resizeCanvas(windowWidth, windowHeight);

  //ratio fix... but then need to make a bunch of other UX decisions like whether you zoom into the canvas or center it somehow
  if (windowWidth > windowHeight) {
    resizeCanvas(windowWidth, windowWidth);
  } else {
    resizeCanvas(windowHeight, windowHeight);
  }
}

// Connect to Node.JS Server
socket.on("connect", () => {
  clientCount += 1;
  console.log(clientCount);
  console.log(socket.id);

});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
  clientCount -= 1;
  console.log(clientCount);
  console.log(socket.id);
});

// Callback function to recieve message from Node.JS
socket.on("drawing", (data) => {
  console.log(data);
  onDrawingEvent(data);

});


function dataLoaded(data) {
  emoji = data;
  //emoji = JSON.stringify(data);
  loading = false;
}

function displayEmojiCategory(emojiCategory) {

  let emojiString = "";

  for (let i = 0; i < emojis.length; i++) {
    if (emojis[i].Group == emojiCategory) {
      emojiString += emojis[i].Representation + " ";
    }
  }

  return emojiString;
}

function pushPEmoji(emojiCategory) {

  for (let i = 0; i < emojis.length; i++) {
    if (emojis[i].Group == emojiCategory) {
      peopleEmoji.push(emojis[i]);
    }
  }
}


//create string from array of emoji objects
function createEmojiString(emojiArray) {

  let emojiString = "";

  //using an array to loop and add to string (you could also use the p5 join() functionality instead)
  for (let i = 0; i < emojiArray.length; i++) {
    emojiString += emojiArray[i].Representation + " ";//add white space between each emoji
  }

  return emojiString;
}

//example of array filtering with an array of objects
//check in all emojis for a key value pair
function filterEmojis(key, value) {

  let array = emojis.filter(function (item) {
    return item[key].includes(value);
  });

  return array;
}

//example of array filtering with an array of objects
//check in Group of emojis for a key value pair
function filterEmojisInCategory(category, key, value) {

  let array = emojis.filter(function (item) {
    return item.Group === category && item[key].includes(value);
  });

  return array;
}