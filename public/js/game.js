/*
 *  Draw.it
 *  Copyright (C) 2021 Various Authors
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/* ---------------------------------------------------------------------------*/
/*                                HTML Elements                               */
/* ---------------------------------------------------------------------------*/

const wordIpt = document.querySelector('#wordIpt');
const sendBtn = document.querySelector('#sendBtn');
const timer = document.querySelector('#timer');
const imgClock = document.querySelector('#img-clock');
const roomCodeHeader = document.getElementById('roomCodeHeader');
const playersList = document.getElementById('players');
const gameHeader = document.getElementById('gameHeader');
const gameCanvas = document.getElementById('gameCanvas');

/* ---------------------------------------------------------------------------*/
/*                              Control Variables                             */
/* ---------------------------------------------------------------------------*/

/* global io */

let socket;
let player;
let currentRoom;

/* url params */

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const playerId = urlParams.get('playerId');
const roomCode = urlParams.get('roomCode');
const playerNick = urlParams.get('playerNick');

/* timers */

let timerInterval;

const initialCont = 10;
let cont = initialCont;

const initialStartGameSeconds = 5;
let startGameSeconds = initialStartGameSeconds;

/* canvas */

let context = gameCanvas.getContext('2d');

let drawing = false;
let isDrawer = false;

const currentPos = { color: 'black', x: 0, y: 0 };
const targetPos = { color: 'black', x: 0, y: 0 };

/* ---------------------------------------------------------------------------*/
/*                               Game Functions                               */
/* ---------------------------------------------------------------------------*/

/**
 * Updates the player list with the current room's players metadata.
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

/**
 * Starts a timer to start a new game.
 */
const newGame = () => {
  startGameSeconds = initialStartGameSeconds;
  startGameTimer = setInterval(() => {
    if (startGameSeconds === 0) {
      if (currentRoom.drawer.nickname == playerNick) {
        socket.emit('startNewTurn', roomCode);
      }
      clearInterval(startGameTimer);
    } else {
      gameHeader.innerHTML = `New Game starting in ${startGameSeconds}`;
      startGameSeconds--;
    }
  }, 1000);
};

/**
 * Updates the player's page with the current drawer data.
 */
function getDrawer() {
  const rect = gameCanvas.getBoundingClientRect();
  context = gameCanvas.getContext('2d');

  if (currentRoom.drawer.nickname == playerNick) {
    gameHeader.innerHTML = `Draw word: '${currentRoom.word}'`;
    isDrawer = true;
  } else {
    gameHeader.innerHTML = `'${currentRoom.drawer.nickname}' is drawing`;
    gameCanvas.style.setProperty('cursor', 'no-drop;');
    isDrawer = false;
  }
}

/**
 * Stops the round timer and updates the game header.
 */
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

/**
 * Starts the round timer.
 */
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

/* ---------------------------------------------------------------------------*/
/*                              Canvas Functions                              */
/* ---------------------------------------------------------------------------*/

/**
 * Gets the mouse coordinates relative to the canvas.
 *
 * @param {Object} e the event
 * @param {Object} position the position object to update
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

/**
 * Simple throttle function.
 *
 * @param {callback} callback the function to throttle
 * @param {number} delay the delay in milliseconds
 * @returns the throttled function
 */
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

/**
 * Draws a line between the current position and the target position.
 *
 * @param {number} x0 the current x position
 * @param {number} y0 the current y position
 * @param {number} x1 the target x position
 * @param {number} y1 the target y position
 * @param {string} color the color of the line
 * @param {boolean} emit whether to emit the line to the server
 */
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

/* ---------------------------------------------------------------------------*/
/*                                 HTML Events                                */
/* ---------------------------------------------------------------------------*/

/**
 * Submits the word guess.
 */
function onSubmitBtnClick() {
  const text = wordIpt.value;
  if (text) { console.log(text); }
}

/**
 * Updates the current mouse or touch position.
 *
 * @param {Object} e the mouse down or touch start event
 */
function onMouseDown(e) {
  drawing = true;
  relMouseCoords(e, currentPos);
}

/**
 * Updates the current mouse or touch position and draws a line between the
 * current position and the target position.
 *
 * @param {Object} e the mouse up or touch end event
 */
function onMouseUp(e) {
  if (isDrawer) {
    if (!drawing) { return; }
    drawing = false;
    relMouseCoords(e, targetPos);
    drawLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, currentPos.color, true);
  }
}

/**
 * Updates the current mouse or touch position, draws a line between the current
 * position and the target position, and updates the current position.
 *
 * @param {Object} e the mouse move or touch move event
 */
function onMouseMove(e) {
  if (isDrawer) {
    if (!drawing) { return; }
    relMouseCoords(e, targetPos);
    drawLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, currentPos.color, true);
    relMouseCoords(e, currentPos);
  }
}

/* ---------------------------------------------------------------------------*/
/*                                Socket Events                               */
/* ---------------------------------------------------------------------------*/

/**
 * Updates the room data and the players list.
 *
 * @param {Object} data the updated room
 */
function onPlayersChanged(data) {
  currentRoom = data;
  updatePlayerList();
}

/**
 * Updates the room data and the new connected player page.
 *
 * @param {Object} data the updated room
 */
function onJoinComplete(data) {
  currentRoom = data;
  player = currentRoom.mostRecentPlayer;
  roomCodeHeader.innerHTML = `Room ${currentRoom.roomCode}`;
  updatePlayerList();
  getDrawer();
}

/**
 * Shows a failed join message and redirects to the home page.
 */
function onJoinFailed() {
  gameHeader.innerHTML = 'Room not found!';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

/**
 * Shows a failed due to full room message and redirects to the home page.
 */
function onJoinFailedMaxPlayers() {
  gameHeader.innerHTML = 'Room is full!';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

/**
 * Draws a line with the data incoming from the server.
 *
 * @param {Object} data the drawing input
 */
function onDrawingEvent(data) {
  drawLine(data.x0, data.y0, data.x1, data.y1, data.color, false);
}

/**
 * Shows a end game message and redirects to the home page.
 */
function onEndGame() {
  gameHeader.innerHTML = 'Game has been ended';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

/**
 * Updates the page with the room's new game data.
 *
 * @param {Object} data the updated room
 */
function onNewGame(data) {
  cont = initialCont;
  currentRoom = data;
  getDrawer();
  initTimer();
}

/* ---------------------------------------------------------------------------*/
/*                                    Init                                    */
/* ---------------------------------------------------------------------------*/

/**
 * Sets up the socket listeners.
 */
function setupSocket() {
  socket = io.connect('/');

  socket.on('joinComplete', onJoinComplete);
  socket.on('joinFailed', onJoinFailed);
  socket.on('joinFailedMaxPlayers', onJoinFailedMaxPlayers);

  socket.on('playersChanged', onPlayersChanged);
  socket.on('playerDrawing', onDrawingEvent);

  socket.on('newGame', onNewGame);
  socket.on('endGame', onEndGame);
}

/**
 * Checks the URL for the room code and player ID.
 */
function checkParameters() {
  if (!playerId || !roomCode) {
    window.location.href = '/';
  }
}

/**
 * Sets up the client with the URL parameters.
 */
function initializeClient() {
  const gameOptions = { playerId, roomCode };
  socket.emit('joinGame', gameOptions);
}

setupSocket();
checkParameters();
initializeClient();
initTimer();

/* HTML Events Setup */

sendBtn.onclick = onSubmitBtnClick;
gameCanvas.addEventListener('mousedown', onMouseDown, false);
gameCanvas.addEventListener('mouseup', onMouseUp, false);
gameCanvas.addEventListener('mouseout', onMouseUp, false);
gameCanvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

// touch support for mobile devices
gameCanvas.addEventListener('touchstart', onMouseDown, false);
gameCanvas.addEventListener('touchend', onMouseUp, false);
gameCanvas.addEventListener('touchcancel', onMouseUp, false);
gameCanvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
