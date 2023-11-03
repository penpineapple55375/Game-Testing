var cnv = document.getElementById('gameCanvas'),
    ctx = cnv.getContext('2d'),
    
    segmentLength = 10,
    startingSegments = 20,
    spawn = { x: 0, y:cnv.height/2 },
    snakeSpeed = 5,
    maxApples = 5,
    appleLife = 500,
    segmentsPerApple = 3,
    
    snakeWidth = 5,
    appleWidth = 5,
    cursorSize = 10,
    
    snakeColor =     [ 100, 255, 100, 1],
    appleColor =     [   0, 255,   0, 1],
    cursorColor =    [ 255, 255, 255, 1],
    cursorColorMod = [   0,-255,-255, 0],
    targetColor =    [   0,   0, 255, 1],
    targetColorMod = [ 255,   0,-255, 0],
    scoreColor =     [ 255, 255, 255, 1],
    
    cursorSpin = 0.075,
    
    snake,
    cursor,
    target,
    apples,
    score,
    gameState,
    deathMeans;

function distance(p1,p2){
	var dx = p2.x-p1.x;
	var dy = p2.y-p1.y;
  
	return Math.sqrt(dx*dx + dy*dy);
}

function lineIntersect(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
  var  s1_x = p1_x - p0_x,
      s1_y = p1_y - p0_y,
      s2_x = p3_x - p2_x,
      s2_y = p3_y - p2_y,
      s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y),
      t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return true;
  }

  return false;
}

function SGM(angle, x, y) {
  this.x = x || 0;
  this.y = y || 0;
  this.angle = angle || 0;
  this.parent = null;
};

SGM.prototype.endX = function() {
  return this.x + Math.cos(this.angle) * segmentLength;
};

SGM.prototype.endY = function() {
  return this.y + Math.sin(this.angle) * segmentLength;
};

SGM.prototype.pointAt = function(x, y) {
  var dx = x - this.x,
      dy = y - this.y;

  this.angle = Math.atan2(dy, dx);
};

SGM.prototype.target = function(x, y) {
  this.targetX = x;
  this.targetY = y;
  this.arrived = false;
  this.totalDist = distance({x:this.endX(), y: this.endY()}, {x: this.targetX, y: this.targetY});
  this.currentDist = parseInt(this.totalDist);
};

SGM.prototype.gotoTarget = function() {
  if(!this.arrived) {
    if(this.targetX > this.x + segmentLength || this.targetX < this.x - segmentLength || this.targetY > this.y + segmentLength || this.targetY < this.y - segmentLength) {
      this.pointAt(this.targetX, this.targetY);
    }
    else {
      this.arrived = true;
    }
    
    this.currentDist = distance({x:this.endX(), y: this.endY()}, {x: this.targetX, y: this.targetY});
  }
  
  this.x += (this.endX() - this.x) / snakeSpeed;
  this.y += (this.endY() - this.y) / snakeSpeed;

  this.parent.drag(this.x, this.y);
};

SGM.prototype.drag = function(x, y) {
  this.pointAt(x, y);

  this.x = x - Math.cos(this.angle) * segmentLength;
  this.y = y - Math.sin(this.angle) * segmentLength;

  if(this.parent) {
    this.parent.drag(this.x, this.y);
  }
};

SGM.prototype.render = function(context) {
  context.lineTo(this.endX(), this.endY());
};

function IKR(x, y) {
  this.ix = x || 0;
  this.iy = y || 0;
  this.sgms = [];
  this.lastArm = null;
};

IKR.prototype.addSeg = function(angle) {
  var arm = new SGM(angle);

  if(this.lastArm !== null) {
    arm.x = this.lastArm.endX();
    arm.y = this.lastArm.endY();

    arm.parent = this.lastArm;
  }
  else {
    arm.x = this.ix;
    arm.y = this.iy;
  }

  this.sgms.push(arm);
  this.lastArm = arm;
};

IKR.prototype.grow = function() {
  var tail = this.sgms[0],
      arm = new SGM(tail.angle);
  
  arm.x = tail.x - Math.cos(tail.angle) * segmentLength;
  arm.y = tail.y - Math.sin(tail.angle) * segmentLength;
  
  tail.parent = arm;
  this.sgms.unshift(arm);
}

IKR.prototype.drag = function(x, y) {
  this.lastArm.drag(x, y);
};

function CUR(x,y) {
  this.x = x;
  this.y = y;
  this.rotation = 0;
};

CUR.prototype.render = function(context) {
  context.save();
  
  context.translate(this.x, this.y);
  context.rotate(this.rotation);
  
  context.beginPath();
  
  context.moveTo(0, -cursorSize);
  context.lineTo(0, -cursorSize/2);
  context.moveTo(0, cursorSize/2);
  context.lineTo(0, cursorSize);
  
  context.moveTo(-cursorSize, 0);
  context.lineTo(-cursorSize/2, 0);
  context.moveTo(cursorSize/2, 0);
  context.lineTo(cursorSize, 0);
  
  context.stroke();
  context.restore();
  
  this.rotation = (this.rotation + cursorSpin) % 360;
};

function Apple(x, y) {
  this.x = x;
  this.y = y;
  this.life = appleLife;
  this.rotation = 0;
}

Apple.prototype.update = function() {
  this.life--;
};

Apple.prototype.render = function(context) {
  context.beginPath();
  context.arc(this.x, this.y, appleWidth, 0, Math.PI*2);
  context.fill();
  
  if(gameState !== 'dead') {
    context.save();
    
    context.fillStyle = 'white';
    context.font = '8px sans-serif';
    context.fillText(this.life, this.x+10, this.y+10);
    
    context.restore();
  
    CUR.prototype.render.call(this, context);
  }
};

function init() {
  snake = new IKR(spawn.x, spawn.y);
  cursor = new CUR(-20, -20);
  target = new CUR(spawn.x + segmentLength * (startingSegments + 5), spawn.y);
  apples = [];
  score = 0;

  for(var i = 0; i < startingSegments; i++) {
    snake.addSeg();
  }
  
  snake.lastArm.target(target.x, target.y);
  
  gameState = 'play';
}

init();

cnv.addEventListener('mousemove', function(e) {
  switch(gameState) {
    case 'play':
      cursor.x = e.offsetX;
      cursor.y = e.offsetY;
    break;
  }
});

cnv.addEventListener('mousedown', function(e) {
  switch(gameState) {
    case 'play':
      target.x = e.offsetX;
      target.y = e.offsetY;
      snake.lastArm.target(target.x, target.y);
    break;
    case 'dead':
      init();
    break;
  }
});

function badPlacement(apple) {
  for(var s = 0; s < snake.sgms.length; s++) {
    var seg = snake.sgms[s];
    
    if(Math.min(distance(apple, {x:seg.endX(), y:seg.endY()}), distance(apple, {x:seg.x,y:seg.y})) < appleWidth*2) {
      return true;
    }
  }
  return false;
}

function addScoreSegments() {
 for(var i = 0; i < segmentsPerApple; i++) {
   snake.grow();
 } 
}

function update() {
  if(gameState !== 'dead') {
    snake.lastArm.gotoTarget();
    
    if(snake.lastArm.endX() > cnv.width - 2 || snake.lastArm.endX() < 2 || snake.lastArm.endY() > cnv.height - 2 || snake.lastArm.endY() < 2) {
      gameState = 'dead';
      deathMeans = 'You hit the wall...';
      return;
    } 

    for(var s = 0; s < snake.sgms.length-2; s++) {
      var seg = snake.sgms[s];
      
      if(lineIntersect(snake.lastArm.x, snake.lastArm.y, snake.lastArm.endX(), snake.lastArm.endY(), seg.x, seg.y, seg.endX(), seg.endY())) {
        gameState = 'dead';
        deathMeans = 'You bit yourself!';
        return;
      }
      
      for(var a in apples) {
        var apple = apples[a];
        
        if(Math.min(distance(apple, {x:seg.endX(), y:seg.endY()}), distance(apple, {x:seg.x,y:seg.y})) < appleWidth*2) {
          score += Math.round(apple.life/2); // half  score if absorbed by the tail
          apples.splice(a, 1);
          addScoreSegments();
        }
      }
    }
    
    for(var a in apples) {
      var apple = apples[a];
      
      apple.update();
      
      if(apple.life <= 0) {
        apples.splice(a,1);
        continue;
      }
      
      if(distance(apple,{x:snake.lastArm.endX(),y:snake.lastArm.endY()})  < appleWidth*2) {
        score += apple.life;
        apples.splice(a,1);
        
        addScoreSegments();
      }
    }
    
    if(apples.length < maxApples && Math.random()<.1) {
      var offset = appleWidth*10,
          apple = new Apple(
            offset/2+Math.floor(Math.random()*(cnv.width-offset)),
            offset/2+Math.floor(Math.random()*(cnv.height-offset))
          );
      
      
      while(badPlacement(apple)) {
        apple.x = offset/2+Math.floor(Math.random()*(cnv.width-offset));
        apple.y = offset/2+Math.floor(Math.random()*(cnv.height-offset));
      }
      
      apples.push(apple);
    }
  }
}

function drawTarget(targetModFactor) {
  if(!snake.lastArm.arrived) {
    ctx.strokeStyle = 'rgba('+
      (targetColor[0] + targetColorMod[0]*targetModFactor).toFixed(0) + ',' +
      (targetColor[1] + targetColorMod[1]*targetModFactor).toFixed(0) + ',' +
      (targetColor[2] + targetColorMod[2]*targetModFactor).toFixed(0) + ',' +
      (targetColor[3] + targetColorMod[3]*targetModFactor).toFixed(0)
      +')';
    ctx.lineWidth = 1;
    target.render(ctx);
  }
}

function drawSnake() {
  ctx.beginPath();
  ctx.strokeStyle = ctx.fillStyle = 'rgba('+ snakeColor[0] +','+ snakeColor[1] +','+ snakeColor[2] +','+ snakeColor[3]+')';
  ctx.lineWidth = snakeWidth;

  ctx.moveTo(snake.sgms[0].x, snake.sgms[0].y);

  for(var s in snake.sgms) {
    snake.sgms[s].render(ctx);
  }

  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(snake.lastArm.endX(), snake.lastArm.endY(), appleWidth*.75, 0, Math.PI*2);
  ctx.fill();
}

function drawCursor(targetModFactor) {
  ctx.strokeStyle = 'rgba('+
    (cursorColor[0] + cursorColorMod[0]*targetModFactor).toFixed(0) + ',' +
    (cursorColor[1] + cursorColorMod[1]*targetModFactor).toFixed(0) + ',' +
    (cursorColor[2] + cursorColorMod[2]*targetModFactor).toFixed(0) + ',' +
    (cursorColor[3] + cursorColorMod[3]*targetModFactor).toFixed(0)
    +')';
  ctx.lineWidth = 1;
  cursor.render(ctx);
}

function drawApples() {
  ctx.fillStyle = 'rgba('+
    appleColor[0] +','+
    appleColor[1] +','+
    appleColor[2] +','+
    appleColor[3]
    +')';

  for(var a in apples) {
    var apple = apples[a],
        appleTargetMod = 1 - apple.life / appleLife;
    ctx.strokeStyle = 'rgba('+
      (cursorColor[0] + cursorColorMod[0]*appleTargetMod).toFixed(0) + ',' +
      (cursorColor[1] + cursorColorMod[1]*appleTargetMod).toFixed(0) + ',' +
      (cursorColor[2] + cursorColorMod[2]*appleTargetMod).toFixed(0) + ',' +
      (cursorColor[3] + cursorColorMod[3]*appleTargetMod).toFixed(0)
      +')';
    ctx.lineWidth = 1;
    apple.render(ctx);
  }
}

function render() {
  var targetModFactor = 1 - snake.lastArm.currentDist / snake.lastArm.totalDist;
  
  switch(gameState) {
    case 'play':
      ctx.clearRect(0, 0, cnv.width, cnv.height);

      drawTarget(targetModFactor);
      
      drawSnake();
      
      drawApples();
      
      drawCursor(targetModFactor);

      
      ctx.fillStyle = 'rgba('+
        scoreColor[0] +','+
        scoreColor[1] +','+
        scoreColor[2] +','+
        scoreColor[3]
      +')';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Score: '+score, 10, 10);
    break;
      
    case 'dead':
      ctx.clearRect(0, 0, cnv.width, cnv.height);
      
      drawSnake();
      
      drawApples();
      ctx.fillStyle = 'rgba(255,0,0,0.5)';
      ctx.fillRect(100, 100, cnv.width - 200, cnv.height - 200);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle = 'white';
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText('DEAD', cnv.width/2, cnv.height/2-70);
      
      ctx.font = 'bold 25px sans-serif'
      ctx.fillText(deathMeans, cnv.width/2, cnv.height/2-30);
      
      ctx.font = '20px sans-serif';
      ctx.fillText('Score:', cnv.width/2, cnv.height/2+15);
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText(score, cnv.width/2, cnv.height/2+60);
      ctx.font = 'lighter 10px sans-serif';
      ctx.lineWidth = 1;
      ctx.strokeRect(103, 103, cnv.width - 206, cnv.height - 206);
    break;
  }
}

function animate() {
  update();
  render();
  requestAnimationFrame(animate);
}

snake.lastArm.target(target.x, target.y);
animate();