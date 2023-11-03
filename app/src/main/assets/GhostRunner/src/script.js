var rot = 0,
    rot_speed = 3,
    laps = 0,
    car_count = 0,
    en_cars = document.querySelectorAll('.en_car'),
    playa = document.querySelector('#car'),
    pumpkin = document.querySelector('#pumpkin'),
    num_of_trees = 10,
    scoreboard = document.querySelector('#scoreboard')

function showScores() {
  if(document.querySelector('.show_scores')) {
    scoreboard.classList.remove('show_scores')
  } else {
    scoreboard.classList.add('show_scores')
    getScores()    
  }
}

function driveCar() {
  checkWreck()

  rot = rot + rot_speed
  if(rot >= 360) {
    rot = 0
    laps++
    laps_count.innerHTML = laps
  }
  document.documentElement.style.setProperty('--car-rot', 'rotate('+rot+'deg)')

  if(laps == 1 && car_count == 0) {    
    en_cars[car_count].style.display = 'block'
    car_count++
  }
  if(laps == 4 && car_count == 1) {    
    en_cars[car_count].style.display = 'block'
    car_count++
  }
  if(laps == 7 && car_count == 2) {    
    en_cars[car_count].style.display = 'block'
    car_count++
  }
  if(laps == 10 && car_count == 3) {    
    en_cars[car_count].style.display = 'block'
    car_count++
  }   
}

function addHighScoresFrame() {
  var f = document.createElement('iframe')
  f.id = 'high_scores'
  f.style.position = 'absolute'
  f.style.left = '-9999px'
  f.style.top = '-9999px'
  document.body.appendChild(f)
}
addHighScoresFrame()

function submitHighScore() {
  var form = 'https://docs.google.com/forms/d/e/1FAIpQLSeK0nvJfp7WojG_QOhTwFWed1gq4OnJkJ57RTVH9eSJ5P4sGQ/formResponse?',
      game_name = 'Halloween Wreckage',
      player_name = prompt('YOU GOT A HIGH SCORE!', 'Name (5 letters max)').substr(0, 5),
      game_score = laps,
      game = 'entry.787263041=' + game_name,
      name = 'entry.1587103203=' + player_name,
      score = 'entry.661694085=' + game_score

  document.querySelector('#high_scores').src = form + game + '&' + name + '&' + score
}

function getScores() {
  var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSYZLDJIblDdWEv1t_dCQB5zsjZ-Qej0cFICzM84Uxe_AudabsmZevrhqQT66jm-t4etEpDtBjsRgoN/pub?gid=965430157&output=csv'
  Papa.parse(public_spreadsheet_url, {
    download: true,
    header: true,
    preview: 5,
    complete: compareScores
  })
}

function compareScores(results) {
  var data = results.data
  if(document.querySelector('.show_scores')) {
    scoreboard.innerHTML = `<h3>HIGH SCORES</h3><span class='score_heading'>RANK</span><span class='score_heading'>NAME</span><span class='score_heading'>LAPS</span>`
    for(var i=0;i<data.length;i++){  
      var s = document.createElement('div')
      s.className = 'score_block'
      s.innerHTML = `<span>${i+1}</span><span>${data[i]['Player Name']}</span><span>${data[i]['Score']}</span>`
      scoreboard.appendChild(s)
    }
  }

  if(Number(data[4].Score) < laps && !document.querySelector('.show_scores')) {
    submitHighScore()
    showScores()
  }
  // console.log(data);
}  

function checkWreck() {  
  en_cars.forEach(function(e){
    var playa_loc = playa.getBoundingClientRect(),
        half = playa_loc.width*.5
    tl = document.elementFromPoint(playa_loc.x + half,playa_loc.y + half),
      tr = document.elementFromPoint(playa_loc.x + playa_loc.width - half,playa_loc.y + half),
      bl = document.elementFromPoint(playa_loc.x + half,playa_loc.y + playa_loc.height - half),
      br = document.elementFromPoint(playa_loc.x + playa_loc.width - half,playa_loc.y + playa_loc.height - half)

    if(tl.classList.contains('en_car') || tr.classList.contains('en_car') || bl.classList.contains('en_car') || br.classList.contains('en_car')) {
      not_playa.style.pointerEvents = 'none'
      clearInterval(runGame)
      not_playa.style.animationPlayState = 'paused'
      pumpkin.style.animationPlayState = 'paused'
      spider.style.animationPlayState = 'paused'
      instructions.style.display = 'block'
      highscores.style.display = 'block'
      window.addEventListener('click', startGame)
      getScores()
      // setTimeout(getScores, 500)
    }
  })
}

function addCar() {
  var c = document.createElement('div')
  c.className = 'en_car'
  not_playa.appendChild(c)
}

// add trees for fun
for(var i=0;i<num_of_trees;i++){
  var t = document.createElement('div')
  t.className = 'tree'
  t.style.left = i % 2 === 0 ? Math.random()*10 + (i*10) + '%' : Math.random()*10 + (i*10) + '%'
  t.style.top = i % 2 === 0 ? Math.round(Math.random()*12) + '%' : Math.round(Math.random()*15) + 76 +'%'
  game_box.appendChild(t)
}

window.addEventListener('mousedown', function(){
  rot_speed = 1
})

window.addEventListener('mouseup', function(){
  rot_speed = 3
})

function startGame(e) {
  if(e.target.id == 'instructions') {
    instructions.style.display = 'none'
    highscores.style.display = 'none'
    runGame = setInterval(driveCar,1000/60)
    for(var i=0;i<en_cars.length;i++) {
      en_cars[i].style.display = ''
    } 
    not_playa.style.pointerEvents = ''
    not_playa.style.animationPlayState = ''
    pumpkin.style.animationPlayState = ''
    spider.style.animationPlayState = ''
    rot = 0
    rot_speed = 3
    laps = 0
    car_count = 0
    laps_count.innerHTML = laps
    window.removeEventListener('click', startGame)
  }
}
window.addEventListener('click', startGame)