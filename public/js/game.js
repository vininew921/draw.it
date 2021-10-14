//HTML Elements
const wordIpt = document.querySelector("#wordIpt");
const sendBtn = document.querySelector("#sendBtn");
const timer = document.querySelector("#timer");
const imgClock = document.querySelector("#img-clock");
const clockAudio = document.querySelector("#clockAudio");

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

  socket.emit("joinGame", { playerId, roomCode });
}

function setupSocket() {
  socket = io.connect("/");

  socket.on("joinComplete", onJoinComplete);
  socket.on("playersChanged", onPlayersChanged);
  socket.on("joinFailed", onJoinFailed);
  socket.on("joinFailedMaxPlayers", onJoinFailedMaxPlayers);
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