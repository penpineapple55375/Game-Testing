// const KEY_UP = 38;
// const KEY_DOWN = 40;
// const KEY_SPACE = 32;
const MakeTimer = function() {
  let t = {
    start: function(duration, func, callback) {
      this.func = func;
      this.duration = duration;
      this.callback = callback;
      this.timer = setInterval(function() {
        func();
        if (typeof callback === "function") {
          callback();
        }
      }, duration);
    },
    stop: function() {
      clearInterval(this.timer);
      return;
    }
  };
  return {
    start: t.start,
    stop: t.stop
  };
};

var highscore = 0
const Rock = function(id) {
  this.rockImg = "https://raw.githubusercontent.com/pahosler/crappyrocks/master/src/assets/images/rock.png";
  this.rock = {
    id: id,
    rockStyle: {
      "background-image": `url(${this.rockImg})`,
    position: "absolute",
    height: "50px",
    width: "50px",
    "-moz-animation": "rockSpin 4s linear infinite",
    animation: "rockSpin 4s linear infinite",
    // color: "rgba(0,0,0,0)",
    "z-index": "5"
    },
    divStyle: {
      position: "absolute",
      height: "50px",
      width: "50px",
    },
    timer: new MakeTimer(),
    div: $(`<div id=${id}><div id=spin${id}></div></div>`),
    rockX: 650,
    rockY:  [30, 80, 130, 180, 230, 280, 330,30, 80, 130, 180, 230, 280, 330,30, 80, 130, 180, 230, 280, 330][Math.floor(Math.random() *21)],
    rockDX: [1, 1,2,2,2,2,2, 2, 2, 2, 2, 2, 2, 4, 3,3,3,3, 3, 3, 3][Math.floor(Math.random() * 21)]
  };
return this.rock;

};

const app = {
  init: function() {
    this.state();
    this.cacheDom();
    this.bindEvents();
    $ship.css({ left: "150px", top: "70px" });
  },
  state: function() {
    // poor man's game physics
    mouseTimer = new MakeTimer(); // gravity.... sort of
    launch = new MakeTimer(); // rock lobster... errr... lobber
    // this is ships starting place
    shipY = 70;
    shipX = 150;
    // some events that happen
    mouseDown = false;
    start = false;
    gameover = false;
    collision = false;
    dead = false;
    score = 0;
    // look ma no rocks!
    rock = [
      // {
      //   id: null
      // }
    ];
    // no rock timers yet either
    rockTimer = [];
  },
  createRock: function(id) {
    // a new rock is born, ahhhhh
    // and it's id is array.length
    // we should change it to an object
    // instead of having an array that grows forever
    // even though it's hard to get past even 100 rocks 
    this.ROCK = new Rock(id);
    // console.log(this.ROCK.id,this.ROCK.rockY,'<<<')
    // push the new rock onto the "stack"     
    rock.push(this.ROCK);
    // rock.forEach(e=>console.log(e.id))
    // console.log(rock[this.ROCK])
    // add the rock to the dom and give it some style too
    $space.append(rock[id].div);
    $(`#${rock[id].id}`).css(rock[id].divStyle);
    // don't forget to make it spin!
    $(`#spin${rock[id].id}`).css(rock[id].rockStyle);
    
    // be really mean, every third rock aims at the ships current position!
    if (id % 2 === 0) {
      rock[id].rockY = shipY;
    }
    
    // the rocks css is added
    $(`#${rock[id].id}`).css({ top: rock[id].rockY, left: rock[id].rockX });
    // rock! start your engine
    this.ROCK.timer.start(
      10,
      function() {
        return this.moveRock(rock[id].id);
      }.bind(this)
    );
  },
  collision: function(id) {
    // did a rock hit your crappy ship?
    if (
      rock[id].id !== null &&
      rock[id].rockX <= shipX + 80 &&
      rock[id].rockX >= shipX &&
      rock[id].rockY + 35 >= shipY &&
      rock[id].rockY <= shipY + 45
    ) {
      return true;
    }
  },
  moveRock: function(id) {
    rock[id].rockX -= rock[id].rockDX;
    if (rock[id].rockX > -60) {
      $(`#${rock[id].id}`).css({ top: rock[id].rockY, left: rock[id].rockX });
    } else {
      rock[id].timer.stop();
      $(`#${rock[id].id}`).remove();
       rock[id] = null;
      ++score;
      highscore = highscore <= score ? score : highscore;
      $score.text(`${score}`);
      $highscore.text(`${highscore || score}`);
    }
    if (this.collision(id)) {
      dead = true;
      this.stopRocks();
      this.exit();
    }
  },
  stopRocks: function() {
    launch.stop();
    for (let id = 1; id < rock.length; ++id) {
      if (rock[id] !== null) {
        rock[id].timer.stop();
        $(`#${id}`).remove();
      }
    }
    rock = [];
  },
  cacheDom: function() {
    $el = $("#app");
    $space = $el.find("#space");
    $rock = $el.find("#rock");
    $ship = $el.find("#ship");
    $score = $el.find("#score");
    $highscore = $el.find("#highscore");
    // $start = $el.find(".start");
  },
  bindEvents: function() {
    $space.on(
      "mousedown touchstart",
      function(e) {
        if (!start) {
          start = true;
          $(".start").toggle();
          $score.text(score);
        //   $highscore.text(score);
          launch.start(
            700,
            function() {
              // create rocks at end of array
            //   console.log(rock.length ? rock[rock.length -1].id +1 : 0);
              this.createRock(rock.length ? rock[rock.length -1].id +1 : 0);
            }.bind(this)
          );
          this.gameLoop();
        }
        if (shipY === 345) {
          shipY = 344;
        }
        mouseDown = true;
        mouseTimer.stop();
        if (!dead) {
          mouseTimer.start(10, this.shipUp.bind(this));
        }
      }.bind(this)
    );

    $space.on(
      "mouseup touchend",
      function() {
        mouseDown = false;
        mouseTimer.stop();
        if (!dead && start) {
          mouseTimer.start(10, this.shipDown.bind(this));
        }
      }.bind(this)
    );
  },
  shipUp: function() {
    shipY -= 3;
    if (shipY <= 0) {
      shipY = 0;
    }
    $ship.css({ position: "absolute", top: shipY });
    this.gameLoop();
  },
  shipDown: function() {
    shipY += 3;
    if (shipY >= 345) {
      shipY = 345;
    }
    $ship.css({ position: "absolute", top: shipY });
    this.gameLoop();
  },
  gameLoop: function() {
    if (!mouseDown && shipY === 0) {
      shipY = 1;
    }
    if (mouseDown && shipY === 345) {
      shipY = 344;
    }
  },
  exit: function() {
    // console.log(rock)
    launch.stop();
    mouseTimer.stop();
    start = false;
    rock = [];
    score = 0;
    $(".start").toggle();
    this.init();
  }
};
$(document).ready(()=>{
    app.init();
})