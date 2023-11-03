var gameStarted = false;
var jumping = false;
var doubleJumping = false;
var jumpInterval;

var doubleJumpInterval;
var jumpAmount = 60;

var lastPressTime = 0;

document.body.onkeyup = function(e) {
  if (e.keyCode == 32) {
    if (gameStarted == false) {
      $(".game h1").addClass("gameOn");
      beginGame();
      gameStarted = true;
    } else {
      var ourDate = new Date();
      var newPressTime = ourDate.getTime();
      var timeGap = (newPressTime - lastPressTime) / 10000;
      lastPressTime = newPressTime;
      console.log(timeGap);

      if (jumping == false && doubleJumping == false) {
        jumping = true;

        jumpAmount = 50;
        jump();
        jumpInterval = setInterval(function() {
          jumping = false;
          console.log(jumping);
          clearTimeout(jumpInterval);
        }, 400);
        return false;
        // }
      } else {
        if (timeGap < 0.4 && doubleJumping == false) {
          doubleJumping = true;
          jumpAmount = 85;
          jump();

          doubleJumpInterval = setInterval(function() {
            doubleJumping = false;
            console.log("doubleJump");
            clearTimeout(doubleJumpInterval);
          }, 400);
          return false;
        }
      }
    }
  }
};


var canvas = document.getElementById("gameGo");

// Set up touch events for mobile, etc
canvas.addEventListener("touchstart", function (e) {
        mousePos = getTouchPos(canvas, e);
  var touch = e.touches[0];
  var mouseEvent = new MouseEvent("mousedown", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
}, false);


$(".game").mousedown(function() {
  if (gameStarted == false) {
    $(".game h1").addClass("gameOn");
    beginGame();
    gameStarted = true;
  } else {
    var ourDate = new Date();
    var newPressTime = ourDate.getTime();
    var timeGap = (newPressTime - lastPressTime) / 10000;
    lastPressTime = newPressTime;
    console.log(timeGap);

    if (jumping == false && doubleJumping == false) {
      jumping = true;

      jumpAmount = 50;
      jump();
      jumpInterval = setInterval(function() {
        jumping = false;
        console.log(jumping);
        clearTimeout(jumpInterval);
      }, 400);
      return false;
      // }
    } else {
      if (timeGap < 0.4 && doubleJumping == false) {
        doubleJumping = true;
        jumpAmount = 85;
        jump();

        doubleJumpInterval = setInterval(function() {
          doubleJumping = false;
          console.log("doubleJump");
          clearTimeout(doubleJumpInterval);
        }, 400);
        return false;
      }
    }
  }
});

var jumpTween;
function jump() {
  jumpTween = TweenMax.to($(".character"), 0.2, {
    bottom: jumpAmount + "%",
    ease: Sine.easeOut
  });
  TweenMax.delayedCall(0.3, backtozero);

  return;
}

function doubleJump() {
  TweenMax.to($(".character"), 0.2, {
    bottom: jumpAmount + "%",
    ease: Sine.easeOut
  });
  TweenMax.delayedCall(0.4, dubbacktozero);

  return;
}
var jumpTween2;
function backtozero() {
  jumpTween2 = TweenMax.to($(".character"), 0.2, {
    bottom: "0",
    ease: Sine.easeIn
  });
  return;
}

function dubbacktozero() {
  TweenMax.to($(".character"), 0.3, {
    bottom: "0",
    ease: Sine.easeIn
  });
  return;
}
var intTime;
var makeTime;
var makeTimeInterval;
var blockSpeed;
var blockNumber;
var blockInterval;
var collisionInterval;
var bestScore = 0;
var lives;
var currentScore;
var makeAmount = 1;
var maxAmount = 1;

function beginGame() {
  //BlockMakeInterval
  gameStarted = true;
  lives = 3;
  intTime = 4000;
  makeTime = 2000;
  blockSpeed = $(window).width() / 500;
  blockNumber = 1;
  currentScore = 0;
  $("#lives").removeClass();
  beginCheck();
  makeAmount = 1;
  maxAmount = 1;

  blockInterval = setInterval(function() {
    makeTime = makeTime - 10;
    if (makeTime < 500) {
      makeTime = 500;
    }
    blockSpeed = blockSpeed - 0.05;
    if (blockSpeed < 1) {
      blockSpeed = 1;
    }

    // blockSpeed = ( Math.floor((Math.random() * 15) + 10)) / 10;

    if (blockNumber > 10 && blockNumber < 20) {
      maxAmount = 2;
    }
    if (blockNumber > 19 && blockNumber < 30) {
      maxAmount = 3;
    }
    if (blockNumber > 29) {
      maxAmount = 4;
    }
    makeAmount = 0;
    makeTimeInterval = setInterval(function() {
      if (gameStarted == false) {
        return false;
      }
      makeBlock(blockNumber);
      blockNumber++;
      console.log(makeTime);
      console.log(blockSpeed);

      makeAmount++;

      if (makeAmount > maxAmount) {
        clearInterval(makeTimeInterval);
      }
    }, makeTime);
    // clearInterval(makeTimeInterval);
  }, intTime);
}

function removeBlocks() {
  $(".block").remove();
  return;
}
function makeBlock(thisBlock) {
  if (thisBlock < 20) {
    var randNum = Math.floor(Math.random() * 5 + 1);
  }
  if (thisBlock > 19 && thisBlock < 30) {
    var randNum = Math.floor(Math.random() * 10 + 0);
  }
  if (thisBlock > 29) {
    var randNum = Math.floor(Math.random() * 20 + 1);
  }

  if (randNum == 1) {
    $(".game").append(
      '<div class="block heart" id="blockNum_' +
        thisBlock +
        '"><i class="fa fa-heart" aria-hidden="true"></i></div>'
    );
  }
  if (randNum == 2) {
    $(".game").append(
      '<div class="block stack" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 3) {
    $(".game").append(
      '<div class="block float" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 4) {
    $(".game").append(
      '<div class="block longfloat" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 5) {
    $(".game").append(
      '<div class="block mid" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 6) {
    $(".game").append(
      '<div class="block bobber1" id="blockNum_' + thisBlock + '"></div>'
    );
  }

  if (randNum == 7) {
    $(".game").append(
      '<div class="block bobber1" id="blockNum_' + thisBlock + '"></div>'
    );
  }

  if (randNum == 8) {
    $(".game").append(
      '<div class="block bobber2" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 9) {
    $(".game").append(
      '<div class="block slider1" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 10) {
    $(".game").append(
      '<div class="block" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 11) {
    $(".game").append(
      '<div class="block bobber1" id="blockNum_' + thisBlock + '"></div>'
    );
  }

  if (randNum == 12) {
    $(".game").append(
      '<div class="block bobber2" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 13) {
    $(".game").append(
      '<div class="block slider1" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 14) {
    $(".game").append(
      '<div class="block" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 15) {
    $(".game").append(
      '<div class="block slider2" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 16) {
    $(".game").append(
      '<div class="block slider2" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 17) {
    $(".game").append(
      '<div class="block longfloat" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 18) {
    $(".game").append(
      '<div class="block mid" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 19) {
    $(".game").append(
      '<div class="block bobber1" id="blockNum_' + thisBlock + '"></div>'
    );
  }
  if (randNum == 20) {
    $(".game").append(
      '<div class="block stack" id="blockNum_' + thisBlock + '"></div>'
    );
  }

  $(".score").html(thisBlock);
  if (thisBlock > bestScore) {
    bestScore = thisBlock;
    $(".best").html(bestScore);
  }
  TweenMax.to($("#blockNum_" + thisBlock), blockSpeed, {
    left: "-500px",
    ease: Power0.easeNone
  });
  return true;
}

//detection
//Top,Bottom,Left, Right
function beginCheck() {
  var charPos = [0, 0, 0, 0];
  collisionInterval = setInterval(function() {
    var charHeight = $(".character").height();
    var charWidth = $(".character").width();
    charPos[0] = $(".character").offset().top;
    charPos[1] = charPos[0] + charHeight;
    charPos[2] = $(".character").offset().left;
    charPos[3] = charPos[2] + charWidth;

    var charCenterY = (charPos[0] + charPos[1]) * 0.5;
    var charCenterX = (charPos[2] + charPos[3]) * 0.5;
    // console.log(charPos);

    $(".block").each(function() {
      if ($(this).hasClass("colided")) {
        return true;
      }

      var blockHeight = $(this).height();
      var blockWidth = $(this).width();
      var blockPos = [0, 0, 0, 0];
      blockPos[0] = $(this).offset().top;
      blockPos[1] = blockPos[0] + blockHeight;
      blockPos[2] = $(this).offset().left;
      blockPos[3] = blockPos[2] + blockWidth;

      var blockCenterY = (blockPos[0] + blockPos[1]) * 0.5;
      var blockCenterX = (blockPos[2] + blockPos[3]) * 0.5;

      var radiusY = blockHeight / 2 + charHeight / 2;
      var radiusX = blockWidth / 2 + charWidth / 2;

      // var ted = Math.abs(blockCenterY - charCenterY);
      // console.log(ted);

      // console.log(charPos[0] +',' +blockPos[1]);

      if (
        Math.abs(blockCenterY - charCenterY) < radiusY &&
        Math.abs(blockCenterX - charCenterX) < radiusX
      ) {
        if ($(this).hasClass("heart")) {
          lives = lives + 1;
          if (lives > 3) {
            lives = 3;
          }
          $("#lives").removeClass();
          $("#lives").addClass("livesLeft_" + lives);
          $(this).addClass("colided");
        } else {
          $(this).addClass("colided");
          gameEnd();
        }
      }
    });
  }, 0.001);
}

function gameEnd() {
  lives = lives - 1;
  $("#lives").removeClass();
  $("#lives").addClass("livesLeft_" + lives);

  if (lives == 0 || lives < 0) {
    $(".game h1").removeClass("gameOn");
    gameStarted = false;
    $(".score").html("0");
    removeBlocks();
    clearInterval(blockInterval);
    clearInterval(collisionInterval);
    clearInterval(makeTimeInterval);
  }
}

$(document).ready(function() {
  checkSize();
});
var resizeTimer;

$(window).on("resize", function(e) {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    checkSize();
  }, 250);
});

function checkSize() {
  if ($(window).height() > $(window).width()) {
    // alert('Use Landscape mode');
    $(".landscapeMessage").addClass("open");
  } else {
    $(".landscapeMessage").removeClass("open");
  }
  gameEnd();
}