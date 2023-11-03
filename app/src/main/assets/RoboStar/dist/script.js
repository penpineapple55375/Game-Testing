const grid = document.querySelector('#grid')
const up = document.querySelector('#up')
const down = document.querySelector('#down')
const left = document.querySelector('#left')
const right = document.querySelector('#right')
const replay = document.querySelector('#replay')
let botPos = {x:0, y:0, i:0}
let starPos1 = {x:0, y:0}
let starPos2 = {x:0, y:0}
let starPos3 = {x:0, y:0}
let nStars = 0
let level = 1
let dotOrder = []

for (let row=0, i=0; row<10; row++){ //populate dot grid
  for (let col=0; col<10; col++){
    let dot = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    gsap.set(dot, {attr:{
      cx:5+col*10,
      cy:5+row*10,
      r:1.5,
      class:'dot dot'+i,
      'data-y':row*10,
      'data-x':col*10
    }})
    grid.appendChild(dot)
    i++
  }
}

gsap.set('#board', {y:10, onComplete:start}) //add some top padding, then start...

function start(){
  botPos = {x:0, y:0, i:0}
  dotOrder = shuffle( [...document.querySelectorAll('.dot')] )

  for (let i=1; i<=3; i++){ //random star placement
    let starPos = eval('starPos'+i)
    starPos.x = gsap.utils.random(1, 9, 1) * 10
    starPos.y = gsap.utils.random(3*(i-1), (i<3)?i*3-1:9, 1) * 10
  }
  
  gsap.timeline()
    .set('.txt2, .txt3, #replay', {autoAlpha:0})
    .set('svg', {opacity:1})
    .set('#star1', {...starPos1, transformOrigin:'50%'})
    .set('#star2', {...starPos2, transformOrigin:'50%'})
    .set('#star3', {...starPos3, transformOrigin:'50%'})    
    .to('.txt1', {duration:0.4, opacity:0, scale:2, transformOrigin:'50%', ease:'back.in(3)'}, 0.5)
    .fromTo('.dot', {scale:0.5, rotate:0, opacity:0, svgOrigin:'50 50'}, {scale:1, opacity:1, stagger:{grid:[10,10],from:'center',amount:0.4}, ease:'back.out(3)'}, 1)
    .fromTo('#bot, .stars use', {opacity:0, scale:1},{opacity:1, stagger:0.05, ease:'expo'}, 2)
    .fromTo('.ant', {y:3}, {y:0, transformOrigin:'50% 100%', ease:'back.out(2)'}, 2.2)
    .add(removeDot)
    .fromTo('#timer', {transformOrigin:'50% 100%', rotate:360}, {rotate:0, ease:'none', duration:15/(level/5), onComplete:()=>end(true)})
}

function move(t){
  gsap.fromTo(t, {attr:{fill:'#fff'}}, {attr:{fill:'#000'}, duration:0.2, ease:'power2.in', overwrite:'auto'})
  if (gsap.isTweening('#bot')) return;

  if (t == up && botPos.y>9 ){
    if ( gsap.getProperty('.dot'+(botPos.i-10), 'opacity')==0 ) return
    botPos.y-=10
    botPos.i-=10
  }
  else if (t == down && botPos.y<90 ){
    if ( gsap.getProperty('.dot'+(botPos.i+10), 'opacity')==0 ) return
    botPos.y+=10
    botPos.i+=10
  }
  else if (t == left && botPos.x>0 ){
    if ( gsap.getProperty('.dot'+(botPos.i-1), 'opacity')==0 ) return
    botPos.x-=10
    botPos.i-=1
    gsap.fromTo('.ant', {rotate:0}, {duration:0.22, rotate:25, yoyo:true, repeat:1, ease:'back.in(3)', overwrite:'auto'})
  }
  else if (t == right && botPos.x<90 ){
    if ( gsap.getProperty('.dot'+(botPos.i+1), 'opacity')==0 ) return
    botPos.x+=10
    botPos.i+=1
    gsap.fromTo('.ant', {rotate:0}, {duration:0.22, rotate:-25, yoyo:true, repeat:1, ease:'back.in(3)', overwrite:'auto'})
  }
  
  gsap.to('#bot', {duration:0.2, ease:'back', x:botPos.x, y:botPos.y})
  
  for (let i=1; i<=3; i++){
    const starPos = eval('starPos'+i)
    if ( botPos.x==starPos.x && botPos.y==starPos.y ){
      starPos.x = -1
      gsap.to('#star'+i, {scale:3, opacity:0})
      nStars++
      gsap.timeline()
      .fromTo('.ant', {y:0},{duration:0.3, y:1.5, yoyo:true, repeat:1, ease:'back.in(3)'}, 0)
      .fromTo('.mouth', {attr:{d:'M3,6.8L4,6.8L6,6.8L7,6.8'}},{attr:{d:'M3,6L4,7L6,7L7,6'}, yoyo:true, repeat:1, ease:'expo.inOut', repeatDelay:0.2}, 0)
      .to('.markers use', {attr:{fill:(i)=>(i+1<=nStars)?'#fff':'#000'}, onComplete:end}, 0)
    }
  }
}

function end(gameOver=false){  
  if (nStars==3 || gameOver){
    nStars = 0
    level++
    gsap.to('#timer', {rotate:360, overwrite:true, ease:'expo.inOut'})
    gsap.killTweensOf(removeDot)
    gsap.killTweensOf('.dot')

    gsap.timeline()
      .to('#bot, .stars use', {opacity:0, ease:'expo.inOut'})
      .to('.dot', {rotate:(level%2==0)?-45:45, scale:0.6, opacity:0, stagger:{grid:[10,10],from:'center',amount:0.6}, ease:'back.inOut'}, '-=0.5')
      .to('.markers use', {attr:{fill:'#000'}, ease:'power2.inOut', stagger:-0.1}, '-=0.5')
      .set('#grid, .txt1', {attr:{fill:(gameOver)?'#fff':'hsl('+(150+level*55)+',100%,50%)'}})
      .fromTo('.txt1', {scale:0, opacity:0, y:0, textContent:(gameOver)?'GAME OVER':'LEVEL '+level},{scale:1, opacity:1, ease:'back.out(3)'})
      .set('#bot',  {x:0, y:0})
      .add(()=>{
        if (!gameOver) start()
        else {
          let best = (window.localStorage.best) ? Number(window.localStorage.best) : 0
          window.localStorage.best = Math.max(best, level-2)
          gsap.timeline()
            .set('.txt2', {textContent:'Levels complete: '+(level-2)})
            .set('.txt3', {textContent:'Best: '+window.localStorage.best})
            .to('.txt1',  {scale:0.67, y:-12, ease:'power2.inOut'}, 1)
            .to('.txt2, .txt3, #replay', {autoAlpha:1, stagger:0.15, ease:'power2.inOut'}, '-=0.25')   
        }
      })
  }
}

function removeDot(){
  let dot = dotOrder.pop()
  for (let i=1; i<=3; i++){
    let starPos = eval('starPos'+i)
    if ( starPos.x == dot.dataset.x && starPos.y == dot.dataset.y ) {
      removeDot()
      return
    }
  }  
  gsap.to(dot, {duration:1/(level/2), opacity:0, ease:'expo.in', onComplete:removeDot})
}

up.onpointerup = down.onpointerup = 
left.onpointerup = right.onpointerup = (e)=> move(e.currentTarget)

window.onkeydown = (e)=> {
  if (e.keyCode){
    if (e.keyCode==38) move(up)
    if (e.keyCode==40) move(down)
    if (e.keyCode==37) move(left)
    if (e.keyCode==39) move(right)
  }
}

replay.onpointerup = (e)=>{
  level = 1
  gsap.timeline({onComplete:start})
    .set('.txt2, .txt3, #replay', {autoAlpha:0})
    .set('#grid, .txt1', {attr:{fill:'#0f2'}})
    .fromTo('.txt1', {scale:0, opacity:0, y:0, textContent:'LEVEL '+level},{scale:1, opacity:1, ease:'back.out(3)'})
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }
  return array;
}