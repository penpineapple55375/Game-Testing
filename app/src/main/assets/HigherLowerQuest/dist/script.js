document.addEventListener("DOMContentLoaded", function() {
		var buttons = document.querySelectorAll("#page-1 button");
		for (var i = 0; i < buttons.length; i++) {
				buttons[i].addEventListener("click", loadGame);
		}
});

function loadGame(btn) {
		s("#page-1").setAttribute("class", "page hide");
		s("#page-1").addEventListener("webkitAnimationEnd", transition);
		s("#page-1").addEventListener("mozAnimationEnd", transition);
		s("#page-1").addEventListener("animationend", transition);

		var max = parseInt(btn.target.getAttribute("data-limit"));
		var randomNumber = Math.round(Math.random() * max) + 0;
		s("#page-2 h2 span").innerHTML = max;

		s("#page-2 input").addEventListener("keypress", function(e) {
				if (e.keyCode == 13) {
						s("#page-2 button").click();
				}
		});

		s("#page-2 button").addEventListener("click", function() {
				var input = parseInt(s("#page-2 input").value);
				saveInput(input);

				if (input === randomNumber) {
						updateCounter();

						var tries = parseInt(s(".tries span").innerHTML);
						s("#page-2").style.display = "none";
						s("#page-3").style.display = "block";
						s("#page-3").setAttribute("class", "page show");
						s("#page-3 p span").innerHTML = tries;

						if (tries == 1) {
								s("#page-3>p").innerHTML = "WOW! It only took you... 1 try!";
								s(".tip").innerHTML = "Impressive!";
						} else if (tries < 5) {
								s(".tip").innerHTML = "That's pretty good!";
						}
				} else if (input < randomNumber) {
						s(".response").innerHTML = "Too Low!";
				} else
				if (input > randomNumber) {
						s(".response").innerHTML = "Too High!";
				} else {
						s(".response").innerHTML = "Please enter a number!";
						return;
				}
				s("body").setAttribute("class", "alert");
				setTimeout(function() {
						s("body").removeAttribute("class");
				}, 900);
				updateCounter();
				s("#page-2 input").value = null;
		});
}

function transition() {
		s("#page-1").style.display = "none";
		s("#page-2").style.display = "block";
		s("#page-2").setAttribute("class", "page show");
}

function updateCounter() {
		var num = s(".tries span");
		var intNum = parseInt(num.innerHTML);
		num.innerHTML = intNum + 1;
}

function saveInput(input) {
		if (input) {
				if (s(".tries span").innerHTML != "0") {
						s(".used span").innerHTML = s(".used span").innerHTML + ", " + input;
				} else {
						s(".used span").innerHTML = input;
				}
		}
}

function s(e) {
		return document.querySelector(e);
}