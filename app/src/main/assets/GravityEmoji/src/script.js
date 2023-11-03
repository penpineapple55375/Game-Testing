/* 
  Sorry for crappy code! I've just wantet to get it out
  before "never". Game is based on code from my 1k JS 
  compressed "Gravity" game also in my Codepen
  profile. 
*/

var a, //Angle to player from origo var
h, //Radius of player from origo
gameSize = 400, //Half the width of the game, width of planet
planetSize = 250, //Half the width of the game, width of planet
enemySize = 40, //Diameter of circles
shipSize = 70,
planetRotation = 0,
i, //Iterator for loops
vx, //Horisontal speed (x)
vy, //Vertical speed (y)
isRocketing, //Is engine on?
satxy, //Temp variable, for tangent angle 
satx, //Another temp var
l = 0.99, //Drag
numEnemies = 0, //Number of enemies
isCrashedWithSat = false, //Have crashed var
isGameOver = false, //Have crashed var
isLaunched = false, //Is it started?
highScore = 0, //Highscore
score = 0, //Score
newEnemyEveryScore = 200,
canvas = document.createElement('canvas'), //create a canvas to draw on
context = canvas.getContext('2d');
emojiSprites = {}, //Cached sprites, as canvas objects
emojiSpriteSize = 160,
(window.onresize = function () {
  canvas.style.transform = 'scale(' + Math.min(window.innerHeight,window.innerWidth) / 960 + ')';
})();

var shipChar = '🚀';
var shipRotation = (Math.PI * (1/4));

if (navigator.userAgent.match(/(Samsung|SAMSUNG)/)) {
  shipRotation = (Math.PI * (3/4));
} else if (navigator.userAgent.match(/(Android)/)) {
  shipRotation = Math.PI * 0.75;
}

canvas.width = canvas.height = gameSize * 2;
document.body.appendChild(canvas);

document.onkeydown = document.onkeyup = document.ontouchstart = document.ontouchend = document.onmousedown = document.onmouseup = function(e) {
  e.preventDefault();
  if (!isLaunched && !isGameOver) {
    isLaunched=true;
    vx = 4;
    vy = -1;
  }
  isRocketing=/(st|wn)/.test(e.type)
};

function pythagoras(a,b) { return Math.sqrt(a*a + b*b);} // Pythagoras
function getPhase() {  return new Date().getTime() / 10000; } // Time pased to from start

function cropCanvas(cropCanvas) {
  var w = cropCanvas.width,
    h = cropCanvas.height,
    ctx = cropCanvas.getContext('2d'),
    bounds = {min: {x: w, y: h}, max: {x: 0, y: 0}},
    imageData = ctx.getImageData(0,0,cropCanvas.width,cropCanvas.height),
    x, y, index;

  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      index = (y * w + x) * 4;
      if (imageData.data[index+3] > 0) {
        bounds.min.x = Math.min(bounds.min.x, x);
        bounds.max.x = Math.max(bounds.max.x, x);
        bounds.min.y = Math.min(bounds.min.y, y);
        bounds.max.y = Math.max(bounds.max.y, y);
      }   
    }
  }

  cropCanvas.width = bounds.max.x - bounds.min.x;
  cropCanvas.height = bounds.max.y - bounds.min.y;
  ctx.putImageData(imageData, -bounds.min.x, -bounds.min.y);
}

//Draw Circle
function drawCircle(x,y,r,c) {
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI, 0);
  context.fillStyle = c;
  context.fill();
}

//Draw Circle
function drawEmoji(x,y,char, r, size) {
  var tempCanvas, tempContext;
  var emojiTextSize = 16;
  if (emojiSprites.hasOwnProperty(char)) {
    tempCanvas = emojiSprites[char];
    tempContext = tempCanvas.getContext('2d');
  } else {
    emojiSprites[char] = tempCanvas = document.createElement('canvas');
    tempCanvas.width = tempCanvas.height = emojiSpriteSize * 2;
    tempContext = tempCanvas.getContext('2d');
    tempContext.font = emojiTextSize + 'px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", Times, Symbola, Aegyptus, Code2000, Code2001, Code2002, Musica, serif, LastResort'; //iPhone tar max 16px 
    tempContext.textAlign = 'left'; 
    tempContext.fillStyle = 'white'; 
    var scale = emojiSpriteSize / emojiTextSize;
    tempContext.scale(scale, scale); 
    tempContext.textBaseline = 'top';  
    tempContext.fillText(char, 10,  10); // Give some margin to prevent cropping on iPhone #magicnumber
    cropCanvas(tempCanvas);
  }

  r = (r + (Math.PI*2)) % (Math.PI*2);
  var tx = x;
  var ty = y;

  var aspectRatio  = tempCanvas.width / tempCanvas.height;
  var scale = size / tempCanvas.height;

  context.save();
  tx -= pythagoras(tempCanvas.width * scale, tempCanvas.height * scale) * Math.cos(r + Math.PI/4) * 0.5;
  ty -= pythagoras(tempCanvas.width * scale, tempCanvas.height * scale) * Math.sin(r + Math.PI/4) * 0.5;
  context.translate(tx, ty);
  context.rotate(r);
  context.scale(scale, scale);
  context.drawImage(tempCanvas, 0, 0);
  context.restore();
}

function playerDied() {
  isGameOver = new Date();
  isLaunched = false;
  isRocketing = false;
  
}

function restartGame() {
  isRocketing = false;
  isGameOver = false;
  x=0,y=-planetSize/2*1.5;
  vx=0,vy=0;
  score=0;
}

function setupPlanet() {
  
  if (isLaunched) {
    planetRotation+=0.003;
  } 
  var radius = planetSize/2;
  var surfaceItemSize = 40;
  radius -= surfaceItemSize / 2;
  drawEmoji(gameSize, gameSize, '🌏', -planetRotation, planetSize);

  var surfaceArr = '🌵 🎪 🏃 🐳 🐬 🐡 🐙 🐚 🐌 🐛 🐜 🌴 🏠 🏥 🏣 🏪 🏫 💒 🚉 🚃'.split(' ');
  var step = Math.PI*2 / surfaceItemSize * 2.5;
  var surfaceItem = 0;
  radius += surfaceItemSize * 0.5 + surfaceItemSize * 0.2;
  for (var a = 0; a < Math.PI*2; a += step) {
    var angle = a + planetRotation;
    var i = (++surfaceItem)% surfaceArr.length;
    drawEmoji( gameSize + Math.sin(angle) * radius, gameSize + Math.cos(angle) * radius, surfaceArr[i],-angle  + Math.PI/1, surfaceItemSize);
  }
}

function updateGame(j) {
  a = Math.atan2(y,x); //Angle from origo
  satxy = a+Math.PI/2; //tangent angle
  r = pythagoras(x,y); //Radius

  if (!isGameOver) {
    score += pythagoras(vx,vy)/30; //Add to score
    highScore = Math.max(highScore,score);
  }
  
  if ((isRocketing && !isGameOver) || (isLaunched && score < 7)) { //Rocket power?
    vy += Math.sin(satxy)* .3; //Add speed in...
    vx += Math.cos(satxy)* .3; //...tangent direction
  }
  
 if(isLaunched) {
    //Gravity
    vy += Math.sin(a+Math.PI) * .2 / r*r;
    vx  += Math.cos(a+Math.PI) * .2 / r*r; 
 }
  
  context.clearRect(0,0, canvas.width, canvas.height);

  drawCircle(gameSize,gameSize,gameSize,'rgba(0,0,255,0.2)'); //Outer circle

  numEnemies = 1 + Math.min(Math.floor(score/newEnemyEveryScore),7); //Number of enemies increase every 200 points

  var enemyPhase; //Phase of one individual enemy from 0-1 in distance from earth origo
  var enemyDistanceFromOrigo;
  var planetSurfaceRadius = planetSize/2 + enemySize/2;
  var enemyMovementRange = (gameSize - planetSize/2 - enemySize);
  
  isCrashedWithSat = 0; //Have crashed var
  for (i=0; i < numEnemies; i++){
    a = Math.PI*2 * i/numEnemies; //Calculate angle to satellite
    enemyPhase = planetSurfaceRadius + Math.abs( Math.sin(j/2000 + a) * enemyMovementRange ); //The "wave" phase for this satellite -> orbital height
    enemyDistanceFromOrigo = enemyPhase * 1; // (1- Math.abs(Math.pow(Math.cos(score*Math.PI/200),60)));
    

    var enemyLife = Math.min(1, (score % newEnemyEveryScore) / newEnemyEveryScore); //How old is this enemy from 0 - 1. 0 is newboard,1 is midlife, 0 is end
    var entryPhaseLength = 0.3;
    var entryPhase = Math.min(1, Math.sin(enemyLife * Math.PI) / entryPhaseLength);
    
    satx = Math.round( Math.cos(a) * enemyDistanceFromOrigo ); //context position of satellite
    satxy = Math.round( Math.sin(a) * enemyDistanceFromOrigo ); //Y position of satellite
    drawEmoji(satx+gameSize,satxy+gameSize,'👾', Math.atan2(satx,satxy), enemySize * entryPhase);
    
    if (pythagoras(satx - x, satxy - y) < (enemySize/2 + shipSize/2) && entryPhase === 1){ //Use pythagoras to calculate distance to player - has it crashed?
      isCrashedWithSat = 1;
    }
  }

  if (!isGameOver && score > 20 && (r < planetSize/2+enemySize || pythagoras(x,y) > (gameSize ) || isCrashedWithSat)){ //Did game end?
      playerDied();
      setTimeout(restartGame, 3000);
  } 

  vx*=l;vy*=l; //Add some drag
  x+=vx;y+=vy; //Move by its speed

  setupPlanet();
  var r = Math.atan2(vy,vx);
  
  drawEmoji( x+gameSize, y+gameSize, '🚀', r + shipRotation, shipSize * (isRocketing ? 1 : 1.1));

  if (isGameOver) {
    var t = (new Date() - isGameOver)/500;
    t = Math.pow(t, 4);
    drawEmoji( x+gameSize, y+gameSize, '💥', r + (Math.PI * (1/4)) + getPhase()*100, shipSize);

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(255,255,255,' + (t).toFixed(2) + ')';
    context.fillStyle = 'white';
    context.font= (2 + t ) + "px Courier";
    context.fillText("GAME OVER",gameSize,gameSize);  
  }

  //Update score and instructions
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillStyle = 'rgba(255,255,255,0.4)';
  context.font="30px Courier";
  context.fillText(Math.round(score) + "/"+ Math.round(highScore),gameSize,10);  
  
  if (score < 15  || isGameOver) {
  context.textBaseline = 'bottom';
  context.font="25px Courier";
    var helpTextAlpha = isGameOver ? 100 : ((100-score*6)/100);
    
  context.fillStyle = 'rgba(255,255,255,' + helpTextAlpha.toFixed(2) + ')';

  context.fillText('Orbit to monitor alien activity 👾',gameSize,gameSize*2 - 90 - 30);  
  
  context.fillText('Click anywhere to thrust 🚀',gameSize,gameSize*2 - 85);
    context.fillText('Utilize earth gravity 🌍',gameSize,gameSize*2 - 50);
   }
  requestAnimationFrame(updateGame); //Animate again
}

restartGame();
updateGame();