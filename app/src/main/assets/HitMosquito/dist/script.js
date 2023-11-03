const D = document,
      QS = 'querySelector',
      QSA = 'querySelectorAll',
      holes = D[QSA]('.game-wrapper__hole'),
      scoreboard = D[QS]('.scoreboard'),
      restartBtn = D[QS]('.restart'),
      subHeading = D[QS]('.heading span'),
      remarks = D[QS]('.remarks');
let lastHole, 
    gameCount = 27,
    timer = 0,
    score = 0;
scoreboard.style.display = 'none';

holes.forEach((hole,index)=>{
  let img = D['createElement']('img');
  img.src = 'file:///android_res/mipmap/mosquito.png';
  hole.appendChild(img);
  hole[QS]('img').addEventListener('click',function(){
    subHeading.innerHTML = `${score++}/27`;
  })
})

function randomTime(min, max){
  let time = Math.floor(Math.random() * (max-min) + min);
  return time;
}

function randomHole(holes){
  let na = Math.floor(Math.random()*holes.length),
      hole = holes[na];
  if(lastHole === na){
    return randomHole(holes);
  }
  lastHole = na;
  return hole;
}

function jump(){
  let time = randomTime(400,1000),
    hole = randomHole(holes);
  
  hole.classList.add('up');

  //checks total jumps limit
  timer++; 
  if(timer <= gameCount || score === gameCount){    
    setTimeout(function(){
      hole.classList.remove('up');
      jump();
    },time);
  }
  else{
    setTimeout(function(){
      hole.classList.remove('up');
    });
    scoreboard.style.display = 'block';    
    remarks.innerHTML = score < 10 ? 'Need Practice!' : (score > 22? 'Awesome!':'very Nice!'); 
  }
}
jump();

function restartGame(){
  let ana = '';
  scoreboard.style.display = 'none';    
  timer = score = 0;
  jump();
  subHeading.innerHTML = `${score++}/27`;
}

restartBtn.addEventListener('click',restartGame);