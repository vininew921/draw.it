/*
  Draw.it
  Copyright (C) 2021  Various Authors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// HTML Elements
const wordIpt = document.querySelector('#wordIpt');
const sendBtn = document.querySelector('#sendBtn');
const resetCanvaBtn = document.querySelector('#reset-canvas');
const timer = document.querySelector('#timer');
const imgClock = document.querySelector('#img-clock');
const roomCodeHeader = document.getElementById('roomCodeHeader');
const playersList = document.getElementById('players');
const gameHeader = document.getElementById('gameHeader');
const gameCanvas = document.getElementById('gameCanvas');

/*
 * Control variables
 */
let context = gameCanvas.getContext('2d');

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const playerId = urlParams.get('playerId');
const roomCode = urlParams.get('roomCode');
const playerNick = urlParams.get('playerNick');
let player;
let socket;
let currentRoom;
let timerInterval;
const initialCont = 10;
let cont = initialCont;
const currentPos = { color: 'black', x: 0, y: 0 };
const targetPos = { color: 'black', x: 0, y: 0 };
let drawing = false;
let isDrawer = false;
const initialStartGameSeconds = 5;
let startGameSeconds = initialStartGameSeconds;
/*
 * Game Functions
 */

function updatePlayerList() {
  playersList.innerHTML = '';
  for (let i = 0; i < currentRoom.maxPlayers; i++) {
    const p = document.createElement('p');
    if (currentRoom.players[i]) {
      p.className = 'player joined';
      p.innerHTML = currentRoom.players[i].nickname;
    } else {
      p.className = 'player empty';
      p.innerHTML = 'Empty';
    }
    playersList.appendChild(p);
  }
}

const newGame = () => {
  startGameSeconds = initialStartGameSeconds;
  const startGameTimer = setInterval(() => {
    if (startGameSeconds === 0) {
      if (currentRoom.drawer.nickname === playerNick) {
        socket.emit('startNewTurn', roomCode);
      }
      clearInterval(startGameTimer);
    } else {
      gameHeader.innerHTML = `New Game starting in ${startGameSeconds}`;
      startGameSeconds--;
    }
  }, 1000);
};

function stopTimer() {
  timer.innerHTML = '0:00';
  imgClock.classList.add('animate');
  wordIpt.value = '';
  wordIpt.disabled = true;
  sendBtn.disabled = true;
  isDrawer = false;
  newGame();
  clearInterval(timerInterval);
}

function initTimer() {
  timerInterval = setInterval(() => {
    cont--;
    const time = new Date(cont * 1000).toISOString().substr(15, 4);
    timer.innerHTML = time;
    wordIpt.disabled = false;
    sendBtn.disabled = false;
    if (cont <= 0) { stopTimer(); }
  }, 1000);
}

/*
 * Canvas Functions
 */

function relMouseCoords(e, position) {
  let totalOffsetX = 0;
  let totalOffsetY = 0;
  let currentElement = e.target;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    currentElement = currentElement.offsetParent;
  } while (currentElement);

  position.x = (e.pageX || e.touches[0].pageX) - totalOffsetX;
  position.y = (e.pageY || e.touches[0].pageY) - totalOffsetY;
}

function throttle(callback, delay) {
  let previousCall = new Date().getTime();
  return (...args) => {
    const time = new Date().getTime();
    if ((time - previousCall) >= delay) {
      previousCall = time;
      callback.apply(null, args);
    }
  };
}

function drawLine(x0, y0, x1, y1, color, emit) {
  const rect = gameCanvas.getBoundingClientRect();
  const widthMultiplier = gameCanvas.width / rect.width;

  context.beginPath();
  context.moveTo((x0 * widthMultiplier), (y0 * widthMultiplier));
  context.lineTo((x1 * widthMultiplier), (y1 * widthMultiplier));
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
  context.closePath();

  if (emit) {
    socket.emit('gameDrawing', {
      x0,
      y0,
      x1,
      y1,
      color,
    }, player);
  }
}

/*
 * HTML Events Definitions
 */

function onSubmitBtnClick() {
  const text = wordIpt.value;
  if (text) { console.log(text); }
}

function onResetBtnClick() {
  context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

function changeColor(event) {
  currentPos.color = event.target.value;
}

function selectColor() {
  const penColor = document.querySelector('#pen-color');
  penColor.value = currentPos.color;
  penColor.addEventListener('input', changeColor, false);
  penColor.select();
}

function showToolBar() {
  const control = document.getElementById('controls');
  control.style.display = 'flex';
}

function onMouseDown(e) {
  drawing = true;
  selectColor();
  relMouseCoords(e, currentPos);
}

function onMouseUp(e) {
  if (isDrawer) {
    if (!drawing) { return; }
    drawing = false;
    relMouseCoords(e, targetPos);
    drawLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, currentPos.color, true);
  }
}

function onMouseMove(e) {
  if (isDrawer) {
    if (!drawing) { return; }
    relMouseCoords(e, targetPos);
    drawLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, currentPos.color, true);
    relMouseCoords(e, currentPos);
  }
}

/*
 * Socket Events
 */

function getDrawer() {
  // const rect = gameCanvas.getBoundingClientRect();
  context = gameCanvas.getContext('2d');
  if (currentRoom.drawer.nickname === playerNick) {
    gameHeader.innerHTML = `Draw word: '${currentRoom.word}'`;
    isDrawer = true;
    showToolBar();
  } else {
    gameHeader.innerHTML = `'${currentRoom.drawer.nickname}' is drawing`;
    gameCanvas.style.setProperty('cursor', 'no-drop;');
    isDrawer = false;
  }
}

function onPlayersChanged(data) {
  currentRoom = data;
  updatePlayerList();
}

function onJoinComplete(data) {
  currentRoom = data;
  player = currentRoom.mostRecentPlayer;
  roomCodeHeader.innerHTML = `Room ${currentRoom.roomCode}`;
  updatePlayerList();
  getDrawer();
}

function onJoinFailed() {
  gameHeader.innerHTML = 'Room not found!';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

function onJoinFailedMaxPlayers() {
  gameHeader.innerHTML = 'Room is full!';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

function onDrawingEvent(data) {
  drawLine(data.x0, data.y0, data.x1, data.y1, data.color, false);
}

function onEndGame() {
  gameHeader.innerHTML = 'Game has been ended';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

function onNewGame(data) {
  cont = initialCont;
  currentRoom = data;
  getDrawer();
  initTimer();
}

/*
 * Init
 */

function setupSocket() {
  // eslint-disable-next-line no-undef
  socket = io.connect('/');

  socket.on('joinComplete', onJoinComplete);
  socket.on('playersChanged', onPlayersChanged);
  socket.on('joinFailed', onJoinFailed);
  socket.on('joinFailedMaxPlayers', onJoinFailedMaxPlayers);
  socket.on('playerDrawing', onDrawingEvent);
  socket.on('newGame', onNewGame);
  socket.on('endGame', onEndGame);
}

function initializeClient() {
  const gameOptions = { playerId, roomCode };
  socket.emit('joinGame', gameOptions);
}

function checkParameters() {
  if (!playerId || !roomCode) {
    window.location.href = '/';
  }
}

setupSocket();
checkParameters();
initializeClient();
initTimer();

/* HTML Events Setup */

// HTML Events Definition

sendBtn.onclick = onSubmitBtnClick;
resetCanvaBtn.onclick = onResetBtnClick;
gameCanvas.addEventListener('mousedown', onMouseDown, false);
gameCanvas.addEventListener('mouseup', onMouseUp, false);
gameCanvas.addEventListener('mouseout', onMouseUp, false);
gameCanvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

// touch support for mobile devices
gameCanvas.addEventListener('touchstart', onMouseDown, false);
gameCanvas.addEventListener('touchend', onMouseUp, false);
gameCanvas.addEventListener('touchcancel', onMouseUp, false);
gameCanvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
