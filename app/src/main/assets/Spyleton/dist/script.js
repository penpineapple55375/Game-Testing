console.clear();

const spider = '🕷️';
const skull = '💀';

const canvas = document.querySelector('canvas#canvas');
const ctx = canvas.getContext('2d');

let flag = false;

let canvasBounds = [0, 0, canvas.width, canvas.height];

resizeCanvas();

let foes = [];
let artArray = [];
let shotsTaken = 0;
let highScore = 0;

const mouse = {
  x: null,
  y: null,
  radius: 150
}

document.addEventListener('click', e => {
  for (let i = 0; i < 20; i++) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    let dX = Math.random() * 10 - 5;
    let dY = Math.random() * 10 - 5;
    artArray.push(new Art(mouse.x, mouse.y, dX, dY));  
  }
	shoot();
});

class Art {
  constructor(x, y, dX, dY) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 30 + 20;
    // this.color = color;
    this.dX = dX;
    this.dY = dY;
    this.gravity = Math.random() * 0.2;
    this.getRandomColor = Math.floor(Math.random() * 55);
    this.getRandomSat = Math.random() * 20 + 80;
    this.brightness = 60;
    this.alpha = 1;
    this.color = `hsla(${this.getRandomColor}, ${this.getRandomSat}%, ${this.brightness}%), ${this.alpha}`;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
  update() {
    const shrink = Math.random() * 2;
    this.x += this.dX;
    this.y += this.dY;
    if (this.radius - shrink > 0) {
      this.radius -= shrink;
    }
    this.dY += this.gravity;
    const desaturate = 1;
    this.getRandomSat -= desaturate;
    const brighten = 1;
    this.brightness += brighten;
    this.alpha -= 0.02;
    this.color = `hsla(${this.getRandomColor}, ${this.getRandomSat}%, ${this.brightness}%, ${this.alpha})`;
  }
}

class Foe {
	constructor(x, y, type) {
		this.x = x;
		this.y = y;
		this.size = Math.random() * 30 + 24;
		this.type = type;
		this.speed = Math.random() * 5 + 1;
		this.color = 'rgb(255,255,255)';
	}
	update() {
		this.y += this.speed;
		
		if (this.y - 50 > canvas.height) {
			this.y = -30;
		}
	}
	draw() {
		this.update();
		ctx.fillStyle = this.color;
		ctx.font = `${this.size}px sans-serif`;
  	ctx.fillText(this.type, this.x, this.y);
	}
}

addSpookies();

function animate() {
	ctx.clearRect(...canvasBounds);
	ctx.fillStyle = 'rgb(0 0 0 / 0.5)';
	ctx.fillRect(...canvasBounds);
	
	for (const foe of foes) {
		foe.draw();
	}
	
  artArray.forEach( (art, index) => {
    art.update();
    art.draw();
    if (art.radius < 0.1) {
      artArray.splice(index, 1);
    }
  })
	
	// remaining text
	ctx.fillStyle = 'rgb(255 255 255 / 0.8)';
	const remainingFontSize = 32;
	ctx.font = `${remainingFontSize}px sans-serif`;
	ctx.fillText(`Remaining spookies: ${foes.length}`, 10, remainingFontSize);
	
	if (highScore > 0) {
		// high score text
		ctx.fillStyle = 'rgb(255 255 255 / 0.8)';
		const scoreFontSize = 20;
		ctx.font = `${scoreFontSize}px sans-serif`;
		ctx.fillText(`High Score: ${highScore}`, 10, remainingFontSize * 2);
	}
	
	if (foes.length === 0 && !flag) {
		flag = true;
		document.querySelector('#controls').classList.add('show');
		if (highScore === 0) {
			highScore = shotsTaken;
		} else if (shotsTaken < highScore) {
			highScore = shotsTaken
		}
	}
	// shots taken text
	ctx.fillStyle = 'rgb(255 255 255 / 0.8)';
	const shotsFontSize = 14;
	ctx.font = `${shotsFontSize}px sans-serif`;
	ctx.fillText(`Total shots: ${shotsTaken}`, 10, canvas.height - 10);
	
		requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => resizeCanvas());

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvasBounds = [0, 0, canvas.width, canvas.height];
}

function shoot() {
	const range = 50;
	shotsTaken++;
	for (let i = 0; i < foes.length; i++) {
		const dx = (foes[i].x - mouse.x) + foes[i].size;
		const dy = (foes[i].y - mouse.y) - foes[i].size;
		const distance = Math.sqrt(dx**2 + dy**2);
		if (distance < range) {
			foes.splice(i, 1);
		}
	}
}

document.querySelector('#reset').addEventListener('click', resetGame);

function resetGame(e) {
	e.preventDefault();
	e.stopPropagation();
	addSpookies();
	document.querySelector('#controls').classList.remove('show');
	flag = false;
	shotsTaken = 0;
}

function addSpookies() {
	for (let i = 0; i < 20; i++) {
		const x = Math.random() * (canvas.width - 50);
		const y = -30;
		const type = Math.random() > 0.5 ? spider : skull;
		foes.push(new Foe(x, y, type))
	}
}