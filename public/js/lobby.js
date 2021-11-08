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

/*
 * HTML Elements
 */

const roomCodeHeader = document.getElementById("roomCodeHeader");
const playersHeader = document.getElementById("playersHeader");
const playersList = document.getElementById("players");
const lobbyHeader = document.getElementById("lobbyHeader");
const lobbyCanvas = document.getElementById("lobbyCanvas");
const readyButton = document.getElementById("lobbyReady");
const resetCanvaBtn = document.querySelector("#reset-canvas");
const eraseBtn = document.querySelector("#btn-erase");
const penBtn = document.querySelector("#btn-pen");

/*
 * Control variables
 */

const context = lobbyCanvas.getContext("2d");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const lobbyType = urlParams.get("type");
const nickname = urlParams.get("nickname");
const roomCode = urlParams.get("roomCode");
let player;
let socket;
let currentRoom;
const currentPos = { color: "black", x: 0, y: 0 };
const targetPos = { color: "black", x: 0, y: 0 };
let drawing = false;
let erasing = false;
let startGameTimer;
let startGameSeconds = 5;

/*
 * Lobby Functions
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
    lobbyHeader.innerHTML = "Waiting Room";
  }
}

function updatePlayerList() {
  if (!currentRoom.gameStarted) {
    playersList.innerHTML = "";
    playersHeader.innerHTML = `Players - ${currentRoom.players.length}/${currentRoom.maxPlayers}`;
    for (let i = 0; i < currentRoom.maxPlayers; i++) {
      const p = document.createElement("p");
      if (currentRoom.players[i]) {
        p.className = "player joined";
        p.innerHTML = currentRoom.players[i].nickname;
        if (currentRoom.players[i].ready) {
          p.innerHTML += " 👍";
        }
      } else {
        p.className = "player empty";
        p.innerHTML = "Empty";
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
    if (time - previousCall >= delay) {
      previousCall = time;
      callback.apply(null, args);
    }
  };
}

function eraseLine(x0, y0, x1, y1, size, emit) {
  if (!emit) {
    const rect = lobbyCanvas.getBoundingClientRect();
    const widthMultiplier = lobbyCanvas.width / rect.width;
    context.clearRect(x1 * widthMultiplier, y1 * widthMultiplier, size, size);
    return;
  }

  socket.emit(
    "lobbyErasing",
    {
      x0,
      y0,
      x1,
      y1,
    },
    player
  );
}

function drawLine(x0, y0, x1, y1, color, emit) {
  if (!emit) {
    const rect = lobbyCanvas.getBoundingClientRect();
    const widthMultiplier = lobbyCanvas.width / rect.width;

    context.beginPath();
    context.moveTo(x0 * widthMultiplier, y0 * widthMultiplier);
    context.lineTo(x1 * widthMultiplier, y1 * widthMultiplier);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    return;
  }

  socket.emit(
    "lobbyDrawing",
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

/*
 * HTML Events Definitions
 */

function onReadyClick() {
  if (readyButton.className === "readyButton ready") {
    readyButton.className = "readyButton cancel";
    readyButton.innerHTML = "Cancel";
    player.ready = true;
    socket.emit("playerReadyChanged", player);
  } else {
    readyButton.className = "readyButton ready";
    readyButton.innerHTML = "Ready";
    player.ready = false;
    socket.emit("playerReadyChanged", player);
  }
}

function onResetBtnClick() {
  erasing = false;
  context.clearRect(0, 0, lobbyCanvas.width, lobbyCanvas.height);
}

function onEraseBtnClick() {
  erasing = true;
}

function onPenBtnClick() {
  erasing = false;
}

function changeColor(event) {
  erasing = false;
  currentPos.color = event.target.value;
}

function selectColor() {
  const penColor = document.querySelector("#pen-color");
  penColor.value = currentPos.color;
  penColor.addEventListener("input", changeColor, false);
  penColor.select();
}

function onMouseDown(e) {
  drawing = true;
  selectColor();
  relMouseCoords(e, currentPos);
}

function onMouseUp(e) {
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

function onMouseMove(e) {
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

/*
 * Socket Events
 */

function onJoinComplete(data) {
  currentRoom = data;
  roomCodeHeader.innerHTML = `Room ${currentRoom.roomCode}`;
  updatePlayerList();
}

function onNickInUse() {
  lobbyHeader.innerHTML = "Nickname is already in use";
  setTimeout(() => {
    window.location.href = "/";
  }, 2000);
}

function onJoinFailed() {
  lobbyHeader.innerHTML = "Room not found!";
  setTimeout(() => {
    window.location.href = "/";
  }, 2000);
}

function onJoinFailedMaxPlayers() {
  lobbyHeader.innerHTML = "Room is full!";
  setTimeout(() => {
    window.location.href = "/";
  }, 2000);
}

function onPlayersChanged(data) {
  currentRoom = data;
  updatePlayerList();
}

function onDrawingEvent(data) {
  drawLine(data.x0, data.y0, data.x1, data.y1, data.color, false);
}

function onErasingEvent(data) {
  eraseLine(data.x0, data.y0, data.x1, data.y1, 25, false);
}

/*
 * Init
 */

function setupSocket() {
  // eslint-disable-next-line no-undef
  socket = io.connect("/");

  socket.on("joinComplete", onJoinComplete);
  socket.on("playersChanged", onPlayersChanged);
  socket.on("joinFailed", onJoinFailed);
  socket.on("joinFailedMaxPlayers", onJoinFailedMaxPlayers);
  socket.on("nickInUse", onNickInUse);
  socket.on("playerDrawing", onDrawingEvent);
  socket.on("playerErasing", onErasingEvent);
}

function initializeClient() {
  // eslint-disable-next-line no-undef
  player = new Player(nickname, roomCode);

  if (lobbyType === "create") {
    socket.emit("createRoom", player);
  } else {
    socket.emit("joinRoom", player);
  }
}

function checkParameters() {
  if (!lobbyType || !nickname || !roomCode) {
    window.location.href = "/";
  }
}

setupSocket();
checkParameters();
initializeClient();

/* HTML Events Setup */

readyButton.onclick = onReadyClick;
resetCanvaBtn.onclick = onResetBtnClick;
eraseBtn.onclick = onEraseBtnClick;
penBtn.onclick = onPenBtnClick;

lobbyCanvas.addEventListener("mousedown", onMouseDown, false);
lobbyCanvas.addEventListener("mouseup", onMouseUp, false);
lobbyCanvas.addEventListener("mouseout", onMouseUp, false);
lobbyCanvas.addEventListener("mousemove", throttle(onMouseMove, 10), false);

// touch support for mobile devices
lobbyCanvas.addEventListener("touchstart", onMouseDown, false);
lobbyCanvas.addEventListener("touchend", onMouseUp, false);
lobbyCanvas.addEventListener("touchcancel", onMouseUp, false);
lobbyCanvas.addEventListener("touchmove", throttle(onMouseMove, 10), false);
