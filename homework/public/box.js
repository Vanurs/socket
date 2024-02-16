class Box {
  constructor(x, y, w, h, t,c, s, accX) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.t = t;
    this.color = c;
    this.scale = s;
    this.accelerationX = accX;
    this.accelerationY = accY;
    let options = {
      friction: 0.3,
      restitution: 0.6
    }

    this.body = Bodies.rectangle(this.x, this.y, this.w*this.scale, this.h*this.scale, options);

    Composite.add(world, this.body);
  }

  show() {
    let pos = this.body.position;
    let angle = this.body.angle;
    let s = 
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    rectMode(CENTER);
    fill(this.color);
    rect(0, 0, this.w*this.scale, this.h*this.scale);
    //fill(0);
    //rectMode(CORNER);
    text(this.t, 0, 0, this.w * 2*this.scale);

    pop();
  }
}