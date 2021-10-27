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

const roomCodeHeader = document.getElementById('roomCodeHeader');
const playersHeader = document.getElementById('playersHeader');
const playersList = document.getElementById('players');
const lobbyHeader = document.getElementById('lobbyHeader');
const lobbyCanvas = document.getElementById('lobbyCanvas');
const readyButton = document.getElementById('lobbyReady');

/* ---------------------------------------------------------------------------*/
/*                              Control Variables                             */
/* ---------------------------------------------------------------------------*/

/* global Player, io */

const context = lobbyCanvas.getContext('2d');

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const lobbyType = urlParams.get('type');
const nickname = urlParams.get('nickname');
const roomCode = urlParams.get('roomCode');
let player;
let socket;
let currentRoom;
const currentPos = { color: 'black', x: 0, y: 0 };
const targetPos = { color: 'black', x: 0, y: 0 };
let drawing = false;
let startGameTimer;
let startGameSeconds = 5;

/* ---------------------------------------------------------------------------*/
/*                               Lobby Functions                              */
/* ---------------------------------------------------------------------------*/

/**
 * Starts a timer to redirect to the game page.
 *
 * @param {boolean} start whether to start the timer or cancel it.
 */
function startGame(start) {
  if (start && !startGameTimer) {
    startGameTimer = setInterval(() => {
      if (startGameSeconds === 0) {
        window.location.href = `/game?roomCode=${currentRoom.roomCode}&playerId=${socket.id}&playerNick=${nickname}`;
      } else {
        lobbyHeader.innerHTML = `Game starting in ${startGameSeconds}`;
        startGameSeconds--;
      }
    }, 1000);
  } else {
    clearInterval(startGameTimer);
    startGameTimer = undefined;
    startGameSeconds = 5;
    lobbyHeader.innerHTML = 'Waiting Room';
  }
}

/**
 * Updates the player list with the current room's players metadata.
 */
function updatePlayerList() {
  if (!currentRoom.gameStarted) {
    playersList.innerHTML = '';
    playersHeader.innerHTML = `Players - ${currentRoom.players.length}/${currentRoom.maxPlayers}`;

    for (let i = 0; i < currentRoom.maxPlayers; i++) {
      const p = document.createElement('p');

      if (currentRoom.players[i]) {
        p.className = 'player joined';
        p.innerHTML = currentRoom.players[i].nickname;
        if (currentRoom.players[i].ready) {
          p.innerHTML += ' 👍';
        }
      } else {
        p.className = 'player empty';
        p.innerHTML = 'Empty';
      }

      playersList.appendChild(p);
    }

    if (currentRoom.everyoneReady) {
      startGame(true);
    } else {
      startGame(false);
    }
  }
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
  if (!emit) {
    const rect = lobbyCanvas.getBoundingClientRect();
    const widthMultiplier = lobbyCanvas.width / rect.width;

    context.beginPath();
    context.moveTo((x0 * widthMultiplier), (y0 * widthMultiplier));
    context.lineTo((x1 * widthMultiplier), (y1 * widthMultiplier));
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    return;
  }

  socket.emit('lobbyDrawing', {
    x0,
    y0,
    x1,
    y1,
    color,
  }, player);
}

/* ---------------------------------------------------------------------------*/
/*                                 HTML Events                                */
/* ---------------------------------------------------------------------------*/

/**
 * Updates the current player's status and toggles the ready button.
 */
function onReadyClick() {
  if (readyButton.className === 'readyButton ready') {
    readyButton.className = 'readyButton cancel';
    readyButton.innerHTML = 'Cancel';
    player.ready = true;
    socket.emit('playerReadyChanged', player);
  } else {
    readyButton.className = 'readyButton ready';
    readyButton.innerHTML = 'Ready';
    player.ready = false;
    socket.emit('playerReadyChanged', player);
  }
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
  if (!drawing) { return; }
  drawing = false;
  relMouseCoords(e, targetPos);
  drawLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, currentPos.color, true);
}

/**
 * Updates the current mouse or touch position, draws a line between the current
 * position and the target position, and updates the current position.
 *
 * @param {Object} e the mouse move or touch move event
 */
function onMouseMove(e) {
  if (!drawing) { return; }
  relMouseCoords(e, targetPos);
  drawLine(currentPos.x, currentPos.y, targetPos.x, targetPos.y, currentPos.color, true);
  relMouseCoords(e, currentPos);
}

/* ---------------------------------------------------------------------------*/
/*                                Socket Events                               */
/* ---------------------------------------------------------------------------*/

/**
 * Updates the room data and the new connected player page.
 *
 * @param {Object} data the updated room
 */
function onJoinComplete(data) {
  currentRoom = data;
  roomCodeHeader.innerHTML = `Room ${currentRoom.roomCode}`;
  updatePlayerList();
}

/**
 * Shows a nickanme already in use failure message and redirects to the home page.
 */
function onNickInUse() {
  lobbyHeader.innerHTML = 'Nickname is already in use';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

/**
 * Shows a failed join message and redirects to the home page.
 */
function onJoinFailed() {
  lobbyHeader.innerHTML = 'Room not found!';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

/**
 * Shows a failed due to full room message and redirects to the home page.
 */
function onJoinFailedMaxPlayers() {
  lobbyHeader.innerHTML = 'Room is full!';
  setTimeout(() => { window.location.href = '/'; }, 2000);
}

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
 * Draws a line with the data incoming from the server.
 *
 * @param {Object} data the drawing input
 */
function onDrawingEvent(data) {
  drawLine(data.x0, data.y0, data.x1, data.y1, data.color, false);
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
  socket.on('nickInUse', onNickInUse);

  socket.on('playersChanged', onPlayersChanged);
  socket.on('playerDrawing', onDrawingEvent);
}

/**
 * Checks the URL for the lobby type, nickname and room code.
 */
function checkParameters() {
  if (!lobbyType || !nickname || !roomCode) {
    window.location.href = '/';
  }
}

/**
 * Sets up the client with the URL parameters.
 */
function initializeClient() {
  player = new Player(nickname, roomCode);

  if (lobbyType === 'create') {
    socket.emit('createRoom', player);
  } else {
    socket.emit('joinRoom', player);
  }
}

setupSocket();
checkParameters();
initializeClient();

/* HTML Events Setup */

readyButton.onclick = onReadyClick;
lobbyCanvas.addEventListener('mousedown', onMouseDown, false);
lobbyCanvas.addEventListener('mouseup', onMouseUp, false);
lobbyCanvas.addEventListener('mouseout', onMouseUp, false);
lobbyCanvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

// touch support for mobile devices
lobbyCanvas.addEventListener('touchstart', onMouseDown, false);
lobbyCanvas.addEventListener('touchend', onMouseUp, false);
lobbyCanvas.addEventListener('touchcancel', onMouseUp, false);
lobbyCanvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
