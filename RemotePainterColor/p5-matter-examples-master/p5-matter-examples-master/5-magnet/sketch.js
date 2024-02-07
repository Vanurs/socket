let magnet;
let boxes;


function setup() {
  const canvas = createCanvas(800, 600);

  // create an engine
  let engine = Matter.Engine.create();
  let world = engine.world;

  // no gravity
  engine.world.gravity.scale = 0;

  // add a group of identical boxes
  boxes = new Stack(
    world,
    { x: width/2, y: 100, cols: 10, rows: 10, colGap: 5, rowGap: 5, color: 'white',
      create: (x, y) => Matter.Bodies.rectangle(x, y, 25, 10, { restitution: 0.9 })
    }
  );

  // add magnet
  magnet = new Magnet(
    world,
    { x: width/2, y: height/2, r: 100, color: 'grey', attraction: 0.45e-5 },
    { isStatic: true }
  );
  magnet.addAttracted(boxes.body.bodies);

  // add a mouse to manipulate Matter objects
  mouse = new Mouse(engine, canvas, { stroke: 'magenta', strokeWeight: 2 });

  // run the engine
  Matter.Runner.run(engine);
}

function draw() {
  background(0);

  if (mouseIsPressed) {
    // smoothly move the attractor body towards the mouse
    Matter.Body.translate(magnet.body, {
      x: (mouseX - magnet.body.position.x) * 0.25,
      y: (mouseY - magnet.body.position.y) * 0.25
    });
  }

  magnet.attract();
  magnet.draw();
  boxes.draw();
  mouse.draw();
}
