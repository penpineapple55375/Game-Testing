// Block Jumper
// UPDATES: 
// 1. Fixed same skin colour issue.
// 2. Fixed the glitch that renders a wall that's so high you can't jump over it.
// 3. Fixed only spikes gBooplitch.

//If there are any more glitches, please tell me about them in the comments!
let COLOR_SET = ["#ff0000", "#ff4000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#4000ff", "	#009900", "#007399", "#730099", "	#178267", "#A04000", "#7D3C98", "#0E6655", "#196F3D", "#994d00", "#269900", "#ef3532", "#f27f26", "#f7d12a", "#17c646", "#3053f2", "#9318e0", "#ff3f8f", "#ffffff"];
let SCENE_MANAGER;
let UTIL = {
  inRange: (v, a, b) => v >= a && v <= b && a <= b || v <= a && v >= b && a >= b,
  rangeIntersect: (a1, a2, b1, b2) => UTIL.inRange(a1, b1, b2) || UTIL.inRange(a2, b1, b2) || UTIL.inRange(b1, a1, a2) || UTIL.inRange(b2, a1, a2) };

HIGH_SCORE = 0;

function setup() {
  let canv = createCanvas(windowWidth, windowHeight);
  canv.position(0, 0);
  SCENE_MANAGER = new SceneManager();
  SCENE_MANAGER.scenes.menu = new MenuScene();
  SCENE_MANAGER.scenes.game = new GameScene();
  SCENE_MANAGER.scene = "menu";
}

function draw() {
  SCENE_MANAGER.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  SCENE_MANAGER.interactBegin(mouseX, mouseY);
  return false;
}

function mouseDragged() {
  SCENE_MANAGER.interactMove(mouseX, mouseY);
  return false;
}

function mouseReleased() {
  SCENE_MANAGER.interactEnd();
  return false;
}

function keyPressed() {
  SCENE_MANAGER.interactBegin(mouseX, mouseY);
  return false;
}

function keyReleased() {
  SCENE_MANAGER.interactEnd();
  return false;
}

class SceneManager {
  constructor() {
    this.scenes = {};
    this.currentScene = "default";
  }

  set scene(scene) {
    this.currentScene = scene;
    this.scenes[this.currentScene].setup();
  }

  get scene() {
    return this.currentScene;
  }

  draw() {
    this.scenes[this.currentScene].draw();
  }

  interactBegin(x, y) {
    this.scenes[this.currentScene].interactBegin(x, y);
  }

  interactMove(x, y) {
    this.scenes[this.currentScene].interactMove(x, y);
  }

  interactEnd() {
    this.scenes[this.currentScene].interactEnd();
  }}


class MenuScene {
  constructor() {
  }

  setup() {
  }

  draw() {
    background(40);
    push();
    fill(60);
    stroke(24);
    strokeWeight(8);
    ellipse(width / 2, height / 2, 192);
    fill(40);
    triangle(width / 2 - 40, height / 2 + 60, width / 2 - 40, height / 2 - 60, width / 2 + 60, height / 2);
    fill(60);
    strokeWeight(16);
    textFont("Montserrat");
    textSize(120);
    textAlign(CENTER);
    text("Block Jumper", width / 2, height / 4);
    textSize(60);
    text("High Score: " + HIGH_SCORE, width / 2, height - 40);
    pop();
  }

  interactBegin(x, y) {
    if (dist(x, y, width / 2, height / 2) <= 96) {
      SCENE_MANAGER.scene = "game";
    }
  }

  interactMove(x, y) {
  }

  interactEnd() {
  }}


class GameScene {
  constructor() {
    this.camera = new GameCamera();
    this.speed = 0;
    this.obstacles = [];
    this.timer = 0;
    this.ground = new GameObjectBlock(createVector(-9999, 0), createVector(1000000000, 5000));
  }

  setup() {
    this.camera.pos = createVector(0, 0);
    this.player = new GamePlayer();
    this.player.y = -200;
    this.player.colorA = random(COLOR_SET);
    this.player.colorB = random(COLOR_SET);
    this.speed = 0;
    this.obstacles = [];
    this.generator = new GameLevelGenerator(this.obstacles, this.ground);
    this.timer = 0;
    this.score = 0;
  }

  endGame() {
    if (this.score > HIGH_SCORE) {
      HIGH_SCORE = this.score;
    }
    SCENE_MANAGER.scene = "menu";
  }

  draw() {
    background(40);
    this.generator.doIteration();
    this.timer++;
    while (this.timer >= 60) {
      this.timer -= 60;
      this.score++;
    }
    this.speed = this.speed * 0.92 + 8 * 0.08;
    this.player.x += 32 - this.speed * 3;
    this.camera.pos.x += this.speed;
    this.camera.followY(this.player);
    if (this.ground.doEffects(this.player)) {
      this.endGame();
    }
    for (let o of this.obstacles) {
      if (o.doEffects(this.player)) {
        this.endGame();
      }
    }
    push();
    this.camera.translate();
    this.player.draw();
    this.ground.draw();
    for (let o of this.obstacles) {
      o.draw();
    }
    pop();
    push();
    fill(60);
    stroke(24);
    strokeWeight(16);
    textFont("Montserrat");
    textSize(60);
    textAlign(CENTER);
    text(this.score, width / 2, 60);
    pop();
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (this.obstacles[i].pos1.x < this.camera.pos.x && this.obstacles[i].pos2.x < this.camera.pos.x) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  interactBegin(x, y) {
    this.player.beginCharge();
  }

  interactMove(x, y) {
  }

  interactEnd() {
    this.player.endCharge();
  }}


class GamePlayer {
  constructor() {
    this.width = 80;
    this.widthM = 1;
    this.widthMV = 0;
    this.height = 80;
    this.heightM = 1;
    this.heightMV = 0;
    this.jumpCharge = 0;
    this.charging = false;
    this.x = 0;
    this.y = -100;
    this.yv = 0;
    this.colorA = "#000000";
    this.colorB = "#000000";
    this.chargeTimer = 0;
  }

  draw() {
    if (this.charging) {
      if (this.chargeTimer > 0) {
        this.jumpCharge = this.jumpCharge * 0.92 + 0.08;
        this.widthM = 1 + this.jumpCharge * 0.5;
        this.heightM = 1 - this.jumpCharge * 0.25;
      }
    } else {
      this.jumpCharge = 0;
      this.widthMV = ((1 - this.widthM) * 0.1 + this.widthMV) * 0.8;
      this.widthM += this.widthMV;
      this.heightMV = ((1 - this.heightM) * 0.1 + this.heightMV) * 0.8;
      this.heightM += this.heightMV;
    }
    this.y += this.yv;
    this.yv += 1;
    this.yv *= 0.96;
    this.chargeTimer = max(this.chargeTimer - 1, 0);
    if (!this.hidden) {
      push();
      stroke(24);
      strokeWeight(8);
      fill(this.colorA);
      rect(this.x - this.width * this.widthM * 0.5, this.y + this.height * (1 - this.heightM), this.width * this.widthM, this.height * this.heightM);
      fill(this.colorB);
      rect(this.x - 10, this.y + (this.height / 2 - 10) + this.height * (1 - this.heightM), 20, 20);
      pop();
    }
  }

  beginCharge() {
    this.charging = true;
  }

  endCharge() {
    this.charging = false;
    if (this.jumpCharge > 0 && this.chargeTimer > 0) {
      this.yv = this.jumpCharge * -35;
    }
  }}


class GameCamera {
  constructor() {
    this.pos = createVector(0, 0);
  }

  translate() {
    translate(-this.pos.x, -this.pos.y + height / 2);
  }

  followY(player) {
    this.pos.y = this.pos.y * 0.95 + player.y * 0.05;
  }}


class GameObjectBlock {
  constructor(pos1, pos2) {
    this.pos1 = pos1;
    this.pos2 = pos2;
  }

  intersects(player) {
    return UTIL.rangeIntersect(this.pos1.x, this.pos2.x, player.x - player.width * player.widthM * 0.5, player.x + player.width * player.widthM * 0.5) && UTIL.rangeIntersect(this.pos1.y, this.pos2.y, player.y + player.height * (1 - player.heightM), player.y + player.height);
  }

  doEffects(player) {
    if (this.intersects(player)) {
      let into = min(this.pos1.y, this.pos2.y) - (player.y + player.height);
      if (into < -16) {
        return true;
      }
      player.chargeTimer = 3;
      player.y += into;
      if (into < 0 && player.yv >= 0) {
        player.yv = 0;
      }
    }
    return false;
  }

  draw() {
    push();
    fill(60);
    stroke(24);
    strokeWeight(8);
    rectMode(CORNERS);
    rect(this.pos1.x, this.pos1.y, this.pos2.x, this.pos2.y);
    fill(24);
    noStroke();
    rect(this.pos1.x, this.pos1.y - 4, this.pos2.x, this.pos1.y + 4);
    pop();
  }}


class GameObjectSpike {
  constructor(pos1, pos2) {
    this.pos1 = pos1;
    this.pos2 = pos2;
  }

  intersects(player) {
    let ptsA = [createVector(player.x - player.width * player.widthM * 0.5, player.y + player.height * (1 - player.heightM)), createVector(player.x - player.width * player.widthM * 0.5, player.y + player.height), createVector(player.x + player.width * player.widthM * 0.5, player.y + player.height * (1 - player.heightM)), createVector(player.x + player.width * player.widthM * 0.5, player.y + player.height)];
    let ptsB = [this.pos1, createVector(this.pos2.x, this.pos1.y), createVector((this.pos1.x + this.pos2.x) / 2, this.pos2.y)];
    for (let a = 0; a < ptsA.length; a++) {
      for (let b = 0; b < ptsB.length; b++) {
        let a1 = ptsA[a];
        let a2 = ptsA[(a + 1) % ptsA.length];
        let b1 = ptsB[b];
        let b2 = ptsB[(b + 1) % ptsB.length];
        let i = intersect(a1, a2, b1, b2);
        if (i.x != 99999 || i.y != 99999) {
          return true;
        }
      }
    }
    return false;
  }

  doEffects(player) {
    return this.intersects(player);
  }

  draw() {
    push();
    fill(60);
    stroke(24);
    strokeWeight(8);
    rectMode(CORNERS);
    triangle(this.pos1.x, this.pos1.y, this.pos2.x, this.pos1.y, (this.pos1.x + this.pos2.x) / 2, this.pos2.y);
    pop();
  }}


function intersect(p1, p2, p3, p4) {
  var den = (p4.y - p3.y) * (p2.x - p1.x) -
  (p4.x - p3.x) * (p2.y - p1.y);

  if (den != 0) {
    var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / den;
    var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / den;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return createVector(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
    } else {
      return createVector(99999, 99999);
    }
  } else {
    return createVector(99999, 99999);
  }
}

class GameLevelGenerator {
  constructor(obstacles, ground) {
    this.obstacles = obstacles;
    this.ground = ground;
    this.player = new GamePlayer();
    this.player.hidden = true;
    this.playerCharging = false;
    this.blockGenTime = 0;
    this.switchTime = 0;
    this.time = 0;
    for (let i = 0; i < 400; i++) {
      this.doIteration();
    }
  }

  onTopOf(block) {
    return this.player.x + this.player.width / 2 > min(block.pos1.x, block.pos2.x) && this.player.x - this.player.width / 2 < max(block.pos1.x, block.pos2.x);
  }

  doIteration() {
    this.blockGenTime++;
    this.switchTime++;
    this.time++;
    this.player.x += 8;
    if ((random() < 0.02 || this.switchTime > 90) && this.time > 90) {
      this.playerCharging = !this.playerCharging;
      this.switchTime = 0;
      if (this.playerCharging) {
        this.player.beginCharge();
      } else {
        this.player.endCharge();
      }
    }

    this.ground.doEffects(this.player);
    for (let o of this.obstacles) {
      o.doEffects(this.player);
    }

    this.player.draw();

    if (this.time > 90) {
      if (this.player.yv > 1 && (random() < 0.05 || this.blockGenTime > 60)) {
        let onTopOfBlock = false;
        for (let o of this.obstacles) {
          if (o instanceof GameObjectBlock && this.onTopOf(o)) {
            onTopOfBlock = true;
          }
        }
        if (!onTopOfBlock) {
          let blockHeight = min(this.player.y + random(80, 100), 0);
          for (let i = this.obstacles.length; i >= 0; i--) {
            if (this.obstacles[i] instanceof GameObjectBlock) {
              if (blockHeight < min(this.obstacles[i].pos1.y, this.obstacles[i].pos2.y) - 150) {
                blockHeight = min(this.obstacles[i].pos1.y, this.obstacles[i].pos2.y) - 150;
              }
              break;
            }
          }
          this.obstacles.push(new GameObjectBlock(createVector(this.player.x - random(100, 200), 0), createVector(this.player.x + random(200, 600), blockHeight)));
          this.blockGenTime = 0;
        }
      }
      if (random() < 0.1) {
        let minY = 0;
        for (let o of this.obstacles) {
          if (o instanceof GameObjectBlock && this.onTopOf(o)) {
            minY = min(minY, min(o.pos1.y, o.pos2.y));
          }
        }
        if (minY - (this.player.y + this.player.height) > 80) {
          let onTopOfSpike = false;
          for (let o of this.obstacles) {
            if (o instanceof GameObjectSpike && abs(this.player.x - (o.pos1.x + 20)) < 40) {
              onTopOfSpike = true;
              break;
            }
          }
          if (!onTopOfSpike) {
            let spikeY = 0;
            for (let o of this.obstacles) {
              if (o instanceof GameObjectBlock && min(o.pos1.x, o.pos2.x) + 20 < this.player.x && max(o.pos1.x, o.pos2.x) - 20 > this.player.x) {
                spikeY = min(o.pos1.y, o.pos2.y);
              }
            }
            this.obstacles.push(new GameObjectSpike(createVector(this.player.x - 20, spikeY), createVector(this.player.x + 20, spikeY - 40)));
          }
        }
      }
      if (random() < 0.005) {
        let y = this.player.y - random(300, 500);
        this.obstacles.push(new GameObjectSpike(createVector(this.player.x - 20, y), createVector(this.player.x + 20, y + 40)));
        this.obstacles.push(new GameObjectBlock(createVector(this.player.x - 20, y - 40), createVector(this.player.x + 20, y)));
      }
    }
  }}