'use strict'

console.log(`Самооценка\n
1. Верстка +10
  - реализован интерфейс игры +5
  - в футере ссылка на гитхаб автора, год издания и логотип курса со ссылкой на курс +5
2. Логика игры. Игра вполне играбельна и подчиняется своим правилам +10
3. Реализован Game Over при упущении двадцать кораблей +10
4. По окончанию игры выводится количество очков, набранное игроком +10
5. Результаты последних десяти игр сохраняются в Local Storage. Есть таблица рекордов, в которой сохраняются результаты предыдущих десяти игр +10
6. Добавил звуки взрывов и появляющиеся очки, чтобы совсем грустно не было. Сделал бы больше, но нет времени. Засчитывать этот пункт или нет - на ваше усмотрение +5
7. Сделать красиво не успел

Total: 55 / 60

P.S.: На заднем плане можно разглядеть машинное отделение малой подводной лодки, хранящейся в музее "Lennusadam" в Таллине. Сам фотографировал :\)\)`);

const playField = document.querySelector('.play-field');
const startGameButton = document.querySelector('.start-game-button');
const openLeaderboardButton = document.querySelector('.open-leaderboard-button');
const howToPlayButton = document.querySelector('.how-to-play-button');
const closeLeaderboardButton = document.querySelector('.close-leaderboard-button');
const closeHowToPlayButton = document.querySelector('.close-how-to-play-button');
const fire1button = document.querySelector('.fire-1-button');
const fire2button = document.querySelector('.fire-2-button');
const fire3button = document.querySelector('.fire-3-button');
const scoreDisplay = document.querySelector('.score-display');
const unescapeShipDisplay = document.querySelector('.unescape-ship-display');
const gameOver = document.querySelector('.game-over');
const closeGameOverButton = document.querySelector('.close-game-over-button');
const finalScore = document.querySelector('.final-score');
const leaderboard = document.querySelector('.leaderboard');
const leaderboardList = document.querySelector('.leaderboard-list');
const leaderboardListLi = document.querySelectorAll('.leaderboard-list > li');
const gameOverLeaderboardButton = document.querySelector('.game-over-leaderboard-button');
const howToPlay = document.querySelector('.how-to-play');
const message = document.querySelector('.message');

const resolutionX = +getComputedStyle(document.documentElement).getPropertyValue('--resolution-x');
const resolutionY = +getComputedStyle(document.documentElement).getPropertyValue('--resolution-y');
const cellSize = +getComputedStyle(document.documentElement).getPropertyValue('--cell-size').slice(0, (getComputedStyle(document.documentElement).getPropertyValue('--cell-size').length - 2));
const maxShipLength = +getComputedStyle(document.documentElement).getPropertyValue('--max-ship-length');
const mediumShipLength = +getComputedStyle(document.documentElement).getPropertyValue('--medium-ship-length');
const minShipLength = +getComputedStyle(document.documentElement).getPropertyValue('--min-ship-length');

const gameTact = 20; // Минимальная единица времени в игре, за которую будут происходить изменения
let shipBornSpeed = 50; // Количество тактов игры, за которое будет появляться новый корабль. Будет уменьшаться со временем
let shipCreateFreqency = gameTact * shipBornSpeed; // Время, через которое будет появляться новый корабль
let objNumber = 0; // Номер создаваемого корабля
let playFieldObjArray = []; // Массив всех созданных в игровом поле объектов - кораблей и торпед
let xPositionLeft = -maxShipLength * cellSize; // Позиция появления кораблей с левой стороны
let xPositionRight = resolutionX * cellSize; // Позиция появления кораблей с правой стороны
const minShipSpeed = 0.5; // Минимальная скорость корабля-0, от которой считаются скорости остальных кораблей
const minTorpedoSpeed = minShipSpeed / 1.5; // Минимальная скорость торпеды
const maxTorpedoSpeed = minShipSpeed * 7; // Максимальная скорость торпеды
const torpedoBoost = 1.028; // Ускорение торпеды
let isGameStarted = false; // Флаг начала игры
const rewardShip0Base = 100; // Базовое количество очков за корабль-0
const rewardShip1Base = 150; // Базовое количество очков за корабль-1
const rewardShip2Base = 200; // Базовое количество очков за корабль-2
const torpedoCost = 50; // Стоимость пуска одной торпеды
let score = 0; // Счет игрока
let scoreForShow = '+000000'; // Счет игрока с дополнительными нулями и знаком
const cooldown = 3000; // КД торпедных аппаратов
const unescapedShipUntilGameEnd = 20; // Количество пропущенных кораблей на всю игру
let unescapedShipCount = unescapedShipUntilGameEnd; // Счетчик сбежавших кораблей
let leadersArray = ['John Silver', 'Turanga Leela', 'Cpt. Vrungel', 'Nemo', 'Cpt. Jack Sparrow', 'Peter Blood', 'Mary Read', 'Cpt. Price', 'B.B.', 'Captain America']; // Десятка лидеров
let leadersScoreArray = [20123, 15051, 11011, 7320, 5506, 4601, 2022, 1100, 387, 20]; // Количество очков лидеров
let messageForShow = "You didn't reach the leaderboard";

class Ship {

  constructor(number) {
    this.number = number;

    const typeNumber = Math.floor(generateRandomNumber(0, 2));
    this.type = `ship-${typeNumber}`;

    this.line = Math.floor(generateRandomNumber(0, 4));

    const directionNumber = Math.floor(generateRandomNumber(0, 1));
    if (directionNumber === 0) {
      this.direction = 'forward';
    } else {
      this.direction = 'backward';
    }

    if (this.type === 'ship-0') {
      this.speed = generateRandomNumber(minShipSpeed, minShipSpeed * 1.5);
    } else if (this.type === 'ship-1') {
      this.speed = generateRandomNumber(minShipSpeed * 2, minShipSpeed * 2.5);
    } else {
      this.speed = generateRandomNumber(minShipSpeed * 4, minShipSpeed * 5);
    }

    let rewardBase
    if (this.type === 'ship-0') {
      rewardBase = rewardShip0Base;
    } else if (this.type === 'ship-1') {
      rewardBase = rewardShip1Base;
    } else {
      rewardBase = rewardShip2Base;
    }
    this.reward = Math.floor(rewardBase * (1 + this.speed / 10) * (1 + this.line / 16));
  }

  createShipDiv(number, direction) {
    const thisShip = document.createElement('div');
    thisShip.classList.add('ship');
    thisShip.classList.add(`${this.type}`);
    thisShip.classList.add(`${this.type}-${direction}`);
    thisShip.classList.add(`line-${this.line}`);

    if (direction === 'forward') {
      thisShip.setAttribute('style', `left: ${xPositionLeft}px`);
    } else {
      thisShip.setAttribute('style', `left: ${xPositionRight}px`);
    }

    thisShip.dataset.number = number;
    playField.append(thisShip);
  }

  makeStep() {
    const thisShip = document.querySelector(`[data-number="${this.number}"]`);
    this.xPosition = +thisShip.getAttribute("style").slice(0, thisShip.getAttribute("style").length - 2).replace('left: ', '');
    if (this.direction === 'forward') {
      this.xPosition += this.speed;
    } else {
      this.xPosition -= this.speed;
    }
    thisShip.setAttribute("style", `left: ${this.xPosition}px`);
  }

  destroyShip() {
    const thisShip = document.querySelector(`[data-number="${this.number}"]`);
    blowUpShip(this.reward, this.type, `line-${this.line}`, thisShip.getAttribute('style'));
    thisShip.remove();
    makeBlowSound();
  }
}

class Torpedo {

  constructor(number) {
    this.number = number;
    this.type = 'torpedo';
    this.speed = minTorpedoSpeed;
  }

  createTorpedoDiv(number, tube) {
    const thisTorpedo = document.createElement('div');
    thisTorpedo.classList.add('torpedo');
    thisTorpedo.classList.add(`${tube}`);
    thisTorpedo.setAttribute('style', `top: ${resolutionY * cellSize}px`);
    thisTorpedo.dataset.number = number;
    playField.append(thisTorpedo);
  }

  makeStep() {
    const thisTorpedo = document.querySelector(`[data-number="${this.number}"]`);
    this.yPosition = +thisTorpedo.getAttribute("style").slice(0, thisTorpedo.getAttribute("style").length - 2).replace('top: ', '');
    this.yPosition -= this.speed;
    thisTorpedo.setAttribute("style", `top: ${this.yPosition}px`);
    if (this.speed * torpedoBoost < maxTorpedoSpeed) {
      this.speed *= torpedoBoost;
    } else {
      this.speed = maxTorpedoSpeed;
    }
  }

  destroyTorpedo() {
    const thisTorpedo = document.querySelector(`[data-number="${this.number}"]`);
    thisTorpedo.remove();
  }
}

function createShip() {
  if (isGameStarted) {
    playFieldObjArray[objNumber] = new Ship(objNumber);
    playFieldObjArray[objNumber].createShipDiv(objNumber, playFieldObjArray[objNumber].direction);
    objNumber++;
    removeCollisionShips(playFieldObjArray[objNumber - 1].line);
  }
}

function createTorpedo(tube) {
  if (isGameStarted) {
    playFieldObjArray[objNumber] = new Torpedo(objNumber);
    playFieldObjArray[objNumber].createTorpedoDiv(objNumber, tube);
    objNumber++;
    substructScore();
  }
}

function makeStepAll(allPlayFieldObj) {
  allPlayFieldObj.map(function (obj) {
    playFieldObjArray[obj.dataset.number].makeStep();
  });
}

function removeCollisionShips(line) {
  const allPlayFieldObj = Array.from(playField.children);
  const allPlayFieldShips = allPlayFieldObj.filter((obj) => {
    return (obj.classList.contains('ship'));
  });
  allPlayFieldShips.pop();

  let isCollision = false;
  allPlayFieldShips.map(function (obj) {
    if (playFieldObjArray[obj.dataset.number].line === line) {
      isCollision = true;
      return;
    }
  });
  if (isCollision) {
    playFieldObjArray.pop();
    playField.lastChild.remove();
    objNumber--;
  }
}

function removeLeaveObj(allPlayFieldObj) {
  allPlayFieldObj.map((obj) => {
    if (obj.classList.contains('ship')) {
      if (playFieldObjArray[obj.dataset.number].direction === 'forward') {
        if (+obj.getAttribute("style").replace('left: ', '').replace('px', '') >= xPositionRight + cellSize * 2) {
          obj.remove();
          countEscapeShip();
        }
      } else if (+obj.getAttribute("style").replace('left: ', '').replace('px', '') <= xPositionLeft - cellSize * 2) {
        obj.remove();
        countEscapeShip();
      }
    } else if (+obj.getAttribute("style").replace('top: ', '').replace('px', '') <= -cellSize) {
      obj.remove();
    }
  });
}

function destroyIfHit(allPlayFieldObj) {
  const allPlayFieldShips = allPlayFieldObj.filter((obj) => {
    return (obj.classList.contains('ship'));
  });
  const allPlayFieldTorpedo = allPlayFieldObj.filter((obj) => {
    return (obj.classList.contains('torpedo'));
  });
  allPlayFieldShips.map((thisShip) => {
    const shipXmin = +thisShip.getAttribute('style').replace('left: ', '').replace('px', '');
    let thisShipLength;
    if (thisShip.classList.contains('ship-0')) {
      thisShipLength = maxShipLength * cellSize;
    } else if (thisShip.classList.contains('ship-1')) {
      thisShipLength = mediumShipLength * cellSize;
    } else {
      thisShipLength = minShipLength * cellSize;
    }
    const shipXmax = shipXmin + thisShipLength;
    const shipYmin = +getComputedStyle(thisShip).top.replace('px', '');
    const shipYmax = shipYmin + cellSize;
    allPlayFieldTorpedo.map((thisTorpedo) => {
      const torpedoXmin = +getComputedStyle(thisTorpedo).left.replace('px', '') + cellSize * 0.2;
      const torpedoXmax = torpedoXmin + cellSize * 0.6;
      const torpedoYmin = +thisTorpedo.getAttribute('style').replace('top: ', '').replace('px', '') + cellSize * 0.2;
      const torpedoYmax = torpedoYmin + cellSize * 0.6;
      if (shipXmin <= torpedoXmax && shipXmax >= torpedoXmin && shipYmin <= torpedoYmax && shipYmax >= torpedoYmin) {
        addScore(thisShip.dataset.number);
        playFieldObjArray[thisShip.dataset.number].destroyShip();
        playFieldObjArray[thisTorpedo.dataset.number].destroyTorpedo();
      }
    });
  });
}

function generateRandomNumber(min, max) {
  return Math.random() * (max - min + 1) + min;
}

function clearField() {
  const allPlayFieldObj = Array.from(playField.children);
  allPlayFieldObj.map((obj) => {
    obj.remove();
  });
  playFieldObjArray = [];
}

function showScore() {
  if (score === Math.abs(score)) {
    scoreForShow = '+' + (`000000${score}`).slice(-6);
    scoreDisplay.classList.remove('score-display-negative');
    scoreDisplay.classList.add('score-display-positive');
  } else {
    scoreForShow = '-' + (`000000${Math.abs(score)}`).slice(-6);
    scoreDisplay.classList.remove('score-display-positive');
    scoreDisplay.classList.add('score-display-negative');
  }
  scoreDisplay.innerHTML = scoreForShow;
}

function resetScore() {
  score = 0;
  showScore();
}

function addScore(destroyedShipNumber) {
  score += playFieldObjArray[destroyedShipNumber].reward;
  showScore();
}

function substructScore() {
  score -= torpedoCost;
  showScore();
}

function setCooldown(button) {
  if (isGameStarted) {
    button.setAttribute('disabled', '');
    setTimeout(() => {
      button.removeAttribute('disabled')
    }, cooldown);
  }
}

function startGame() {
  isGameStarted = !isGameStarted;
  toggleButtonAccessability(openLeaderboardButton);
  toggleButtonAccessability(howToPlayButton);
  if (isGameStarted) {
    toggleStartGameButtonText('start');
    resetScore();
    resetUnescapeCount();
    clearField();
    createShip();
  } else {
    toggleStartGameButtonText('stop');
  }
}

function countEscapeShip() {
  unescapedShipCount--;
  showUnescapedShipCount();
  testIsGameEnd();
}

function showUnescapedShipCount() {
  unescapeShipDisplay.innerHTML = unescapedShipCount;
  if (unescapedShipCount <= 5) {
    unescapeShipDisplay.classList.remove('score-display-positive');
    unescapeShipDisplay.classList.add('score-display-negative');
  }
}

function resetUnescapeCount() {
  unescapedShipCount = unescapedShipUntilGameEnd;
  unescapeShipDisplay.innerHTML = unescapedShipCount;
  unescapeShipDisplay.classList.remove('score-display-negative');
  unescapeShipDisplay.classList.add('score-display-positive');
}

function toggleGameOverScreen(command) {
  if (command === 'show') {
    gameOver.style.display = 'flex';
  } else {
    gameOver.style.display = 'none';
  }
}

function testIsGameEnd() {
  if (unescapedShipCount <= 0) {
    stopGame();
  }
}

function showFinalScore() {
  finalScore.innerHTML = scoreForShow;
}

function stopGame() {
  addScoreToLeaderboard();
  fillLeaderboard();
  notifyUserInLeaderboard();
  showFinalScore();
  toggleGameOverScreen('show');
  startGame();
}

function notifyUserInLeaderboard() {
  message.innerHTML = messageForShow;
}

function openLeaderboard() {
  leaderboard.style.display = 'flex';
}

function toggleButtonAccessability(button) {
  if (isGameStarted) {
    button.setAttribute('disabled', '');
  } else {
    button.removeAttribute('disabled', '');
  }
}

function closeLeaderboard() {
  leaderboard.style.display = 'none';
}

function fillLeaderboard() {
  leaderboardListLi.forEach(function(element, i) {
    element.children[0].children[0].innerHTML = leadersArray[i];
    element.children[0].children[1].innerHTML = leadersScoreArray[i];
    element.children[0].children[0].classList.remove('red-letters');
    element.children[0].children[1].classList.remove('red-letters');
    if (leadersArray[i] === 'Player') {
      element.children[0].children[0].classList.add('red-letters');
      element.children[0].children[1].classList.add('red-letters');
    }
  });
}

function addScoreToLeaderboard() {
  messageForShow = "You didn't reach the leaderboard";
  for (let i = 9; i >= 0; i--) {
    if (score >= leadersScoreArray[i] && score < leadersScoreArray[i - 1]) {
      for (let j = 9; j > i; j--) {
        leadersScoreArray[j] = leadersScoreArray[j - 1];
        leadersArray[j] = leadersArray[j - 1];
      }
      leadersScoreArray[i] = score;
      leadersArray[i] = 'Player';
      messageForShow = 'Congratulations! Your score now added to the leaderboard!';
      saveLeaderboardToLocalStorage();
    }
  }
}

function saveLeaderboardToLocalStorage() {
  localStorage.setItem('leadersArray', leadersArray);
  localStorage.setItem('leadersScoreArray', leadersScoreArray);
}

function getLeaderboardFromLocalStorage() {
  leadersArray = localStorage.getItem('leadersArray').split(',');
  leadersScoreArray = [];
  const leadersScoreArrayStrings = localStorage.getItem('leadersScoreArray').split(',');
  leadersScoreArrayStrings.map((element) => {
    leadersScoreArray.push(+element);
  });
}

function closeHowToPlay() {
  howToPlay.style.display = 'none';
}

function showHowToPlay() {
  howToPlay.style.display = 'flex';
}

function toggleStartGameButtonText(command) {
  if (command === 'start') {
    startGameButton.innerHTML = 'Restart game';
  } else {
    startGameButton.innerHTML = 'Start new game';
  }
}

function blowUpShip (reward, shipType, line, left) {
  const thisBlow = document.createElement('div');
  const thisScore = document.createElement('p');
    thisBlow.classList.add('blow');
    thisBlow.classList.add(line);
    thisScore.classList.add('score');

    if (shipType === 'ship-0') {
      thisBlow.classList.add('blow-0');
    } else if (shipType === 'ship-1') {
      thisBlow.classList.add('blow-1');
    } else {
      thisBlow.classList.add('blow-2');
    }

    thisBlow.setAttribute('style', `${left}`);
    thisScore.innerHTML = reward;

    playField.append(thisBlow);
    thisBlow.append(thisScore);
    setTimeout(() => {
      thisBlow.remove();
    }, 2000);
}

function makeBlowSound() {
  const blowSound = new Audio;
  blowSound.src = './assets/sounds/blow.mp3';
  blowSound.setAttribute('preloadaed', 'trueth');
  blowSound.setAttribute('autoplay', '');
  blowSound.volume = 0.7;
  document.documentElement.append(blowSound);
  setTimeout(() => {
    blowSound.remove();
  }, 2000);
}

if (!localStorage.getItem('leadersArray') || !localStorage.getItem('leadersScoreArray')) {
  saveLeaderboardToLocalStorage();
}

getLeaderboardFromLocalStorage();

startGameButton.addEventListener('click', startGame);

openLeaderboardButton.addEventListener('click', openLeaderboard);

closeLeaderboardButton.addEventListener('click', closeLeaderboard);

closeHowToPlayButton.addEventListener('click', closeHowToPlay);

howToPlayButton.addEventListener('click', showHowToPlay);

gameOverLeaderboardButton.addEventListener('click', openLeaderboard);

closeGameOverButton.addEventListener('click', () => {
  toggleGameOverScreen('hide');
});

fire1button.addEventListener('click', () => {
  createTorpedo('tube-1');
  setCooldown(fire1button);
});

fire2button.addEventListener('click', () => {
  createTorpedo('tube-2');
  setCooldown(fire2button);
});

fire3button.addEventListener('click', () => {
  createTorpedo('tube-3');
  setCooldown(fire3button);
});

setInterval(createShip, shipCreateFreqency);

setInterval(() => {
  if (isGameStarted) {
    let allPlayFieldObj = Array.from(playField.children);
    allPlayFieldObj = allPlayFieldObj.filter((obj) => {
      return (obj.classList.contains('ship') || obj.classList.contains('torpedo'));
    });
    makeStepAll(allPlayFieldObj);
    removeLeaveObj(allPlayFieldObj);
    destroyIfHit(allPlayFieldObj);
  }
}, gameTact);

toggleGameOverScreen('hide');

fillLeaderboard();