//HTML Elements
const wordIpt = document.querySelector("#wordIpt");
const sendBtn = document.querySelector("#sendBtn");
const timer = document.querySelector("#timer");
const imgClock = document.querySelector("#img-clock");
const roomCodeHeader = document.getElementById("roomCodeHeader");
const playersHeader = document.getElementById("playersHeader");
const playersList = document.getElementById("players");
const gameHeader = document.getElementById("gameHeader");

//HTML Events
sendBtn.onclick = function () {
  const text = wordIpt.value;
  if (text) {
    console.log(text);
  }
};

//Control variables
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const playerId = urlParams.get('playerId');
const roomCode = urlParams.get('roomCode');
var player;
var socket;
var currentRoom;
let timerInterval;
let cont = 120;

//Initialization
checkParameters();
initializeClient();

//Functions
function checkParameters() {
  if (!playerId || !roomCode) {
      window.location.href = "/";
  }
}

function initializeClient() {
  setupSocket();

  let gameOptions = { playerId: playerId, roomCode: roomCode };
  socket.emit("joinGame", gameOptions);
}

function setupSocket() {
  socket = io.connect("/");

  socket.on("joinComplete", onJoinComplete);
  socket.on("playersChanged", onPlayersChanged);
  socket.on("joinFailed", onJoinFailed);
  socket.on("joinFailedMaxPlayers", onJoinFailedMaxPlayers);
}

function updatePlayerList() {
    playersList.innerHTML = "";
    for (var i = 0; i < currentRoom.maxPlayers; i++){
        var p = document.createElement("p");
        if (currentRoom.players[i]) {
            p.className = "player joined";
            p.innerHTML = currentRoom.players[i].nickname;
        }
        else {
            p.className = "player empty";
            p.innerHTML = "Empty";
        }
        playersList.appendChild(p);
    }
}

const initTimer = () => {
  timerInterval = setInterval(() => {
    cont--;
    const time = (cont / 60).toFixed(2).toString().split(".");
    const min = time[0];
    const sec = ((time[1] * 60) / 100).toFixed(0);
    timer.innerHTML = `${min}:${sec < 10 ? `0${sec}` : sec}`;
    if (cont <= 0) {
      stopTimer();
    }
  }, 1000);
};

const stopTimer = () => {
  timer.innerHTML = `0:00`;
  imgClock.classList.add("animate");
  wordIpt.value = "";
  wordIpt.disabled = true;
  sendBtn.disabled = true;
  clearInterval(timerInterval);
};

initTimer();

//Socket events
function onPlayersChanged(data) {
  currentRoom = data;
  updatePlayerList();
}

function onJoinComplete(data) {
  currentRoom = data;
  roomCodeHeader.innerHTML = "Room " + currentRoom.roomCode;
  updatePlayerList();
}

function onJoinFailed(data) {
  gameHeader.innerHTML = "Room not found!";
  // setTimeout(() => {
  //     window.location.href = "/";
  // }, 2000);
}

function onJoinFailedMaxPlayers(){
  gameHeader.innerHTML = "Room is full!";
  setTimeout(() => {
      window.location.href = "/";
  }, 2000);
}