window.onload = function() {
    var message = document.getElementById("message");
    var result = document.getElementById("result");
    var choice = document.getElementById("choice");
    var rock = document.getElementById("rock");
    var paper = document.getElementById("paper");
    var scissors = document.getElementById("scissors");
    var playAgain = document.getElementById("playAgain");
    playAgain.style.display = "none";
    var resultAnimation = document.getElementById("result-animation");
    resultAnimation.display = "none";
    var newGame = false;
    var choicesArray = ["rock", "paper", "scissors"];
    
    var playerChoice = 0;
    var computerChoice = 0;
    
    rock.onclick = function() {
        play(choicesArray.indexOf("rock"), generateComputerChoice(), choicesArray, resultAnimation);
    }
    paper.onclick = function() {
        play(choicesArray.indexOf("paper"), generateComputerChoice(), choicesArray, resultAnimation);
    }
    scissors.onclick = function() {
        play(choicesArray.indexOf("scissors"), generateComputerChoice(), choicesArray, resultAnimation);
    }
    playAgain.onclick = function() {
        newGame = true;
        startNewGame(resultAnimation);
    }
}

function play(playerChoice, computerChoice, choicesArray, resultAnimation) {
    winner(playerChoice, computerChoice, choicesArray, resultAnimation);
    rock.style.display = "none";
    paper.style.display = "none";
    scissors.style.display = "none";
    choice.style.display = "none";
}

function generateComputerChoice() {
    // return a random number from 0 to 2 & use it to index into an array
    return (Math.floor(Math.random() * 3));
}

function winner(playerChoice, computerChoice, choicesArray, resultAnimation) {
    var resultMessage = "";
    message.innerHTML = "You chose " + choicesArray[playerChoice] + " and the computer chose " + choicesArray[computerChoice] + ".";
     
    if (playerChoice === 0 && computerChoice === 2) {
        resultMessage = "You win!";
    } else if (playerChoice === 2 && computerChoice === 0) {
        resultMessage = "You lose!";
    } else if (playerChoice > computerChoice) {
        resultMessage = "You win!";
    } else if (playerChoice < computerChoice) {
        resultMessage = "You lose!";
    } else {
        resultMessage = "It's a draw!";
    }
    result.innerHTML = resultMessage;   
    playAgain.style.display = "inline";
    drawAnimation(playerChoice, computerChoice, resultAnimation);
}

function drawAnimation(playerChoice, computerChoice, resultAnimation) {
    resultAnimation.display = "block";
    switch (true) {
        case (playerChoice === 0 && computerChoice === 0):
            resultAnimation.src = "https://i.postimg.cc/25nxCQS0/r-r.gif";
            break;
        case (playerChoice === 1 && computerChoice === 1):
            resultAnimation.src = "https://i.postimg.cc/htkrFycJ/p-p.gif";
            break;
        case (playerChoice === 2 && computerChoice === 2):
            resultAnimation.src = "https://i.postimg.cc/d3N25n5V/s-s.gif";
            break;
        case ((playerChoice === 0 && computerChoice === 1) || (playerChoice === 1 && computerChoice === 0)):
            resultAnimation.src = "https://i.postimg.cc/mDwNHTMM/r-p.gif";
            break;
        case ((playerChoice === 0 && computerChoice === 2) || (playerChoice === 2 && computerChoice === 0)):
            resultAnimation.src = "https://i.postimg.cc/26m7y1qr/r-s.gif";
            break;
        case ((playerChoice === 1 && computerChoice === 2) || (playerChoice === 2 && computerChoice === 1)):
            resultAnimation.src = "https://i.postimg.cc/Hnk00F4N/s-p.gif";
            break;
    }
}

function startNewGame(resultAnimation) {
    playAgain.style.display = "none";
    // make all buttons visible    
    rock.style.display = "inline";
    paper.style.display = "inline";
    scissors.style.display = "inline";
    // reset all messages to empty strings
    message.innerHTML = "";
    result.innerHTML = "";
    resultAnimation.src = "";
    resultAnimation.display = "none";
    choice.style.display = "block";
}