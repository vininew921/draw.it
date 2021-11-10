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
const resetCanvaBtn = document.querySelector('#reset-canvas');
const timer = document.querySelector('#timer');
const imgClock = document.querySelector('#img-clock');
const roomCodeHeader = document.getElementById('roomCodeHeader');
const playersList = document.getElementById('players');
const gameHeader = document.getElementById('gameHeader');
const rightWord = document.getElementById('rightWord');
const gameCanvas = document.getElementById('gameCanvas');
const eraseBtn = document.getElementById('btn-erase');
const penBtn = document.getElementById('btn-pen');

/* ---------------------------------------------------------------------------*/
/*                              Control Variables                             */
/* ---------------------------------------------------------------------------*/

/* global io */

let socket;
let player;
let currentRoom;

let rightWordwas = '';

/* url params */

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const playerId = urlParams.get('playerId');
const roomCode = urlParams.get('roomCode');
const playerNick = urlParams.get('playerNick');

/* timers */

let timerInterval;

const initialCont = 120;
let cont = initialCont;

/*
 * Game Functions
 */

const initialStartGameSeconds = 5;
let startGameSeconds = initialStartGameSeconds;

/* canvas */

const context = gameCanvas.getContext('2d');

let drawing = false;
let erasing = false;
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
      p.innerHTML = `${currentRoom.players[i].nickname}-${currentRoom.players[i].points}`;
    } else {
      p.className = 'player empty';
      p.innerHTML = 'Empty';
    }

    playersList.appendChild(p);
  }
}

/**
 * Hides the the tools for drawing.
 */
function hideToolBar() {
  const control = document.getElementById('controls');
  control.style.display = 'none';
}

/**
 * Displays the the tools for drawing.
 */
function showToolBar() {
  const control = document.getElementById('controls');
  control.style.display = 'flex';
}

/**
 * Updates the player's page with the current drawer data.
 */
function getDrawer() {
  if (currentRoom.drawer.nickname === playerNick) {
    gameHeader.innerHTML = `Draw word: '${currentRoom.word}'`;
    isDrawer = true;
    wordIpt.style.display = 'none';
    sendBtn.style.display = 'none';
    showToolBar();
  } else {
    gameHeader.innerHTML = `'${currentRoom.drawer.nickname}' is drawing`;
    gameCanvas.style.setProperty('cursor', 'no-drop;');
    isDrawer = false;
    wordIpt.style.display = 'block';
    sendBtn.style.display = 'block';
    hideToolBar();
  }
}

/**
 * Stops the round timer and updates the game header.
 */
function stopTimer() {
  timer.innerHTML = '0:00';
  imgClock.classList.add('animate');
  wordIpt.value = '';
  wordIpt.style.display = 'none';
  sendBtn.style.display = 'none';
  isDrawer = false;
  socket.emit('endRound', player);
  clearInterval(timerInterval);
}

/**
 * Starts the round timer.
 */
function initTimer() {
  rightWord.innerHTML = '';
  rightWord.style.display = 'none';
  timerInterval = setInterval(() => {
    cont--;
    const time = new Date(cont * 1000).toISOString().substr(15, 4);
    timer.innerHTML = time;
    if (cont <= 0) {
      stopTimer();
    }
  }, 1000);
}

/**
 * Hides the guess input and displays the right word.
 */
function guessedRight() {
  wordIpt.style.display = 'none';
  sendBtn.style.display = 'none';
  rightWord.innerHTML = wordIpt.value;
  rightWord.style.display = 'block';
  rightWord.style.color = 'green';
}

/**
 * Clears the guess input.
 */
function guessedWrong() {
  wordIpt.value = '';
  wordIpt.style.color = 'red';
}

/* ---------------------------------------------------------------------------*/
/*                              Canvas Functions                              */
/* ---------------------------------------------------------------------------*/

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
    if (time - previousCall >= delay) {
      previousCall = time;
      callback.apply(null, args);
    }
  };
}

/**
 * Gets the mouse coordinates relative to the canvas.
 *
 * @param {Object} event the event
 * @param {Object} position the position object to update
 */
function relMouseCoords(event, position) {
  let totalOffsetX = 0;
  let totalOffsetY = 0;
  let currentElement = event.target;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    currentElement = currentElement.offsetParent;
  } while (currentElement);

  position.x = (event.pageX || event.touches[0].pageX) - totalOffsetX;
  position.y = (event.pageY || event.touches[0].pageY) - totalOffsetY;
}

/**
 * Erases the itens between the current position and the target position.
 *
 * @param {number} x0 the current x position
 * @param {number} y0 the current y position
 * @param {number} x1 the target x position
 * @param {number} y1 the target y position
 * @param {number} size the color of the line
 * @param {boolean} emit whether to emit the drawing input to the server
 */
function eraseLine(x0, y0, x1, y1, size, emit) {
  if (!emit) {
    const rect = gameCanvas.getBoundingClientRect();
    const widthMultiplier = gameCanvas.width / rect.width;
    context.clearRect(x1 * widthMultiplier, y1 * widthMultiplier, size, size);
    return;
  }

  socket.emit(
    'gameErasing',
    {
      x0,
      y0,
      x1,
      y1,
    },
    player
  );
}

/**
 * Draws a line between the current position and the target position.
 *
 * @param {number} x0 the current x position
 * @param {number} y0 the current y position
 * @param {number} x1 the target x position
 * @param {number} y1 the target y position
 * @param {string} color the color of the line
 * @param {boolean} emit whether to emit the drawing input to the server
 */
function drawLine(x0, y0, x1, y1, color, emit) {
  const rect = gameCanvas.getBoundingClientRect();
  const widthMultiplier = gameCanvas.width / rect.width;

  context.beginPath();
  context.moveTo(x0 * widthMultiplier, y0 * widthMultiplier);
  context.lineTo(x1 * widthMultiplier, y1 * widthMultiplier);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
  context.closePath();

  if (emit) {
    socket.emit(
      'gameDrawing',
      {
        x0,
        y0,
        x1,
        y1,
        color,
      },
      player
    );
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
  if (text) {
    socket.emit('guessWord', player, text);
  }
}

/**
 * Emits to the socket that the canvas should be cleared.
 */
function onResetBtnClick() {
  socket.emit('clearBoard', player);
}

function onEraseBtnClick() {
  erasing = true;
}

function onPenBtnClick() {
  erasing = false;
}

/**
 * Updates the canvas input data object with client's selected color.
 *
 * @param {*} event the color input event.
 */
function changeColor(event) {
  erasing = false;
  currentPos.color = event.target.value;
}

/**
 * Setups the color change event listener and selects the new color.
 */
function selectColor() {
  const penColor = document.querySelector('#pen-color');
  penColor.value = currentPos.color;
  penColor.addEventListener('input', changeColor, false);
  penColor.select();
}

/**
 * Updates the current mouse or touch position.
 *
 * @param {Object} e the mouse down or touch start event
 */
function onMouseDown(e) {
  drawing = true;
  selectColor();
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
    if (!drawing) {
      return;
    }
    drawing = false;
    relMouseCoords(e, targetPos);
    if (erasing)
      eraseLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, 25, true);
    else
      drawLine(
        currentPos.x,
        currentPos.y,
        targetPos.x,
        targetPos.y,
        currentPos.color,
        true
      );
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
    if (!drawing) {
      return;
    }
    relMouseCoords(e, targetPos);
    if (erasing)
      eraseLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, 25, true);
    else
      drawLine(
        currentPos.x,
        currentPos.y,
        targetPos.x,
        targetPos.y,
        currentPos.color,
        true
      );
    relMouseCoords(e, currentPos);
  }
}

// TODO: This could be an one liner
function guessEnter(e) {
  if (e.key === 'Enter') {
    onSubmitBtnClick();
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
  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
}

/**
 * Shows a failed due to full room message and redirects to the home page.
 */
function onJoinFailedMaxPlayers() {
  gameHeader.innerHTML = 'Room is full!';
  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
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
 * Erases the lines with the data incoming from the server.
 *
 * @param {Object} data the drawing input
 */
function onErasingEvent(data) {
  eraseLine(data.x0, data.y0, data.x1, data.y1, 25, false);
}

/**
 * Clears the canvas content.
 */
function onClearBoard() {
  context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

/**
 * Updates the page with the room's new game data.
 *
 * @param {Object} data the updated room
 */
function onNewGame(data) {
  startGameSeconds = initialStartGameSeconds;
  const startGameTimer = setInterval(() => {
    if (startGameSeconds === 0) {
      clearInterval(startGameTimer);
      cont = initialCont;
      currentRoom = data;
      context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
      getDrawer();
      initTimer();
    } else {
      gameHeader.innerHTML = `New Game starting in ${startGameSeconds}`;
      if (wordIpt.value !== rightWordwas) {
        rightWord.innerHTML = rightWordwas;
        rightWord.style.display = 'block';
        rightWord.style.color = 'black';
      }
      rightWord.style.display = 'block';
      startGameSeconds--;
    }
  }, 1000);
}

/**
 * Shows a end game message and redirects to the home page.
 */
function onEndGame() {
  gameHeader.innerHTML = 'Game has been ended';
  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
}

/**
 *
 * @param {Object} updatedRoom the updated room
 * @param {Object} playerRight the player who guessed right
 */
function onGuessedRight(updatedRoom, playerRight) {
  currentRoom = updatedRoom;
  if (player.nickname === playerRight.nickname) {
    guessedRight();
  }
  updatePlayerList();
}

/**
 * Clears the guess input
 *
 * @param {Object} updatedRoom the updated room
 * @param {Object} playerRight the player who guessed wrong
 */
function onGuessedWrong(updatedRoom, playerWrong) {
  if (player.nickname === playerWrong.nickname) {
    guessedWrong();
  }
}

/**
 * Updates the word that was supposed to be guessed.
 *
 * @param {string} wordWas the word that was supposed to be guessed
 */
function onWordWas(wordWas) {
  rightWordwas = wordWas;
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
  socket.on('playerErasing', onErasingEvent);

  socket.on('newGame', onNewGame);
  socket.on('endGame', onEndGame);

  socket.on('guessedRight', onGuessedRight);
  socket.on('guessedWrong', onGuessedWrong);
  socket.on('wordWas', onWordWas);

  socket.on('resetBoard', onClearBoard);
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

/* ---------------------------------------------------------------------------*/
/*                              HTML Events Setup                             */
/* ---------------------------------------------------------------------------*/

resetCanvaBtn.onclick = onResetBtnClick;
eraseBtn.onclick = onEraseBtnClick;
penBtn.onclick = onPenBtnClick;
sendBtn.onclick = onSubmitBtnClick;
wordIpt.onkeydown = guessEnter;

/* Canvas */

// mouse events
gameCanvas.addEventListener('mousedown', onMouseDown, false);
gameCanvas.addEventListener('mouseup', onMouseUp, false);
gameCanvas.addEventListener('mouseout', onMouseUp, false);
gameCanvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

// touch events
gameCanvas.addEventListener('touchstart', onMouseDown, false);
gameCanvas.addEventListener('touchend', onMouseUp, false);
gameCanvas.addEventListener('touchcancel', onMouseUp, false);
gameCanvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
